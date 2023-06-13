import { Express, Request, Response } from 'express'
import Rankings from '../recommender/RankingsRecommender'
import UserRecommender from '../recommender/UserRecommender'
import { 
	getIdFromQueryParams, 
	getProfileIdFromParam, 
	getIdsFromQueryParams, 
	getProfilesFromIdsOrdered, 
	getStrategyNameFromQueryParams, 
	isValidDate } from './utils'
import LocalTrustContentRecommender from '../recommender/LocalTrustContentRecommender'
import FeedRecommender from '../recommender/FeedRecommender'
import PersonalFeedRecommender from '../recommender/PersonalFeedRecommender'

export default async (app: Express) => {
	const userRecommender = new UserRecommender()
	const localTrustContentRecommender = new LocalTrustContentRecommender(userRecommender)
	await userRecommender.init()

	app.get('/suggest', async (req: Request, res: Response) => {
		const reqUri = req.originalUrl.split("?").shift()
		let id: number

		try {
			id = await getIdFromQueryParams(req.query)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} personalized for id: ${id}`)

		try {
			const re = await userRecommender.recommend(id)
			const profiles = await getProfilesFromIdsOrdered(re)
			profiles.map((profile: any, i: number) => {
				profile.rank = i + 1
			})
			return res.send(profiles)
		}
		catch (e: any) {
			console.error(`Error in ${reqUri} for id: ${id}`, e)
			res.status(500).send(`Could not get ${reqUri}`)
		}
	})

	app.get('/suggest_posts', async (req: Request, res: Response) => {
		const reqUri = req.originalUrl.split("?").shift()
		const limit = req.query.limit ? +req.query.limit : 50
		let id: number

		try {
			id = await getIdFromQueryParams(req.query)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} personalized for id: ${id}`)

		try {
			const ids = await localTrustContentRecommender.recommend(id, limit)
			return res.send(ids)
		}
		catch (e: any) {
			console.error(`Error in ${reqUri} for id: ${id}`, e)
			res.status(500).send(`Could not get ${reqUri}`)	
		}
	})

	app.get(['/rankings_count', '/profile_count'], async (req: Request, res: Response) => {
		const reqUri = req.originalUrl.split("?").shift()
		let strategyName: string, date: string

		try {
			strategyName = await getStrategyNameFromQueryParams(req.query)
			date = req.query.date && isValidDate(req.query.date as string) ? req.query.date as string : await Rankings.getLatestDateByStrategyName(strategyName)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} for strategyName: ${strategyName}`)

		try {
			const count = await Rankings.getGlobaltrustLength(strategyName, date)
			return res.send({ count })
		}
		catch (e: any) {
			console.error(`Error in /rankings_count for strategyName: ${strategyName}`, e)
			res.status(500).send(`Could not get ${reqUri}`)
		}
	})
	
	app.get(['/profile_score'], async (req: Request, res: Response) => {
		const reqUri = req.originalUrl.split("?").shift()
		let id: number, strategyName: string
		let date: string

		try {
			id = await getIdFromQueryParams(req.query)
			strategyName = await getStrategyNameFromQueryParams(req.query)
			date = req.query.date && isValidDate(req.query.date as string) ? req.query.date as string : await Rankings.getLatestDateByStrategyName(strategyName)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} for id: ${id} and strategyName: ${strategyName}`)

		try {
			const score = await Rankings.getScoreOfUser(strategyName, id, date);
			return res.send({ score })
		}
		catch (e: any) {
			console.error(`Error in ${reqUri} for handle: ${id} and strategyName: ${strategyName}`, e)
			res.status(500).send(`Could not get ${reqUri}`)
		}
	})

	app.get(['/profile_scores_by_users'], async (req: Request, res: Response) => {
		const reqUri = req.originalUrl.split("?").shift()
		let ids: number[], strategyName: string
		let date: string

		try {
			ids = await getIdsFromQueryParams(req.query)
			strategyName = await getStrategyNameFromQueryParams(req.query)
			date = req.query.date && isValidDate(req.query.date as string) ? req.query.date as string : await Rankings.getLatestDateByStrategyName(strategyName)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} for ids: ${ids} and strategyName: ${strategyName}`)

		try {
			const scores = await Rankings.getGlobaltrustByStrategyNameAndIds(strategyName, ids, date);
			return res.send(scores)
		}
		catch (e: any) {
			console.error(`Error in ${reqUri} for ids: ${ids} and strategyName: ${strategyName}`, e)
			res.status(500).send(`Could not get ${reqUri}`)
		}
	})

	app.get(['/ranking_index', '/profile_rank'], async (req: Request, res: Response) => {
		const reqUri = req.originalUrl.split("?").shift()
		let id: number, strategyName: string
		let date: string

		try {
			id = await getIdFromQueryParams(req.query)
			strategyName = await getStrategyNameFromQueryParams(req.query)
			date = req.query.date && isValidDate(req.query.date as string) ? req.query.date as string : await Rankings.getLatestDateByStrategyName(strategyName)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} for id: ${id} and strategyName: ${strategyName}`)

		try {
			const rank = await Rankings.getRankOfUser(strategyName, id, date);
			return res.send({ rank })
		}
		catch (e: any) {
			console.error(`Error in ${reqUri} for handle: ${id} and strategyName: ${strategyName}`, e)
			res.status(500).send(`Could not get ${reqUri}`)
		}
	})

	app.get(['/feed/personal/:profile/:strategy?'], async (req: Request, res: Response) => {
		const reqUri = req.originalUrl
		const limit = req.query.limit ? +req.query.limit : 100
		const strategy = req.params.strategy ? req.params.strategy as string : 'following'
		let profileId: string

		try {
			profileId = await getProfileIdFromParam(req.params.profile)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} personalized for id: ${profileId}`)
		try {
			const feed = await PersonalFeedRecommender.getFeed(strategy, limit, profileId)
			return res.send(feed)
		}
		catch (e: any) {
			console.log(`Error in ${reqUri}`, e)
			return res.status(500).send(`Could not get ${reqUri}`)
		}
	})


	app.get(['/feed/:strategy?'], async (req: Request, res: Response) => {
		const reqUri = req.originalUrl
		const limit = req.query.limit ? +req.query.limit : 100
		const strategy_name = req.params.strategy ? req.params.strategy as string : 'popular'

		try {
			const feed = await FeedRecommender.getFeed(strategy_name, limit)
			return res.send(feed)
		}
		catch (e: any) {
			console.log(`Error in ${reqUri}`, e)
			return res.status(500).send(`Could not get ${reqUri}`)
		}
	})

	app.get(['/rankings', '/profile_scores'], async (req: Request, res: Response) => {
		const reqUri = req.originalUrl.split("?").shift()
		const limit = req.query.limit ? +req.query.limit : 50
		const offset = req.query.offset ? +req.query.offset : 0
		let strategyName: string, date: string

		try {
			strategyName = await getStrategyNameFromQueryParams(req.query)
			date = req.query.date && isValidDate(req.query.date as string) ? req.query.date as string : await Rankings.getLatestDateByStrategyName(strategyName)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} for strategyName: ${strategyName} on ${date} ranging from [${offset} to ${offset + limit}]`)

		try {
			const globaltrust = await Rankings.getGlobaltrustByStrategyName(strategyName, limit, offset, date)
			return res.send(globaltrust)
		}
		catch (e: any) {
			console.log(`Error in ${reqUri} for strategyName: ${strategyName}`, e)
			return res.status(500).send(`Could not get ${reqUri}`)
		}
	})
}