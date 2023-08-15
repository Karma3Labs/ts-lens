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
import { config } from '../recommender/config'
import { execSync } from 'child_process'
import { string } from 'yargs'


export default async (app: Express) => {
	const userRecommender = new UserRecommender()
	const localTrustContentRecommender = new LocalTrustContentRecommender(userRecommender)
	await userRecommender.init()

	app.get('/_health', async (req: Request, res: Response) => {
		res.status(200).json({ status: 'ok' });
	});	

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

	app.get(['/profile_count', '/profile/count'], async (req: Request, res: Response) => {
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
	
	app.get(['/profile_score','/profile/score'], async (req: Request, res: Response) => {
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

	app.get(['/profile_scores_by_users','/profile/scores_by_users'], async (req: Request, res: Response) => {
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

	app.get(['/profile_rank', '/profile/rank'], async (req: Request, res: Response) => {
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
		const offset = req.query.offset ? +req.query.offset : 0
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
			const feed = await PersonalFeedRecommender.getFeed(strategy, limit, offset, profileId)
			return res.send(feed)
		}
		catch (e: any) {
			console.log(`Error in ${reqUri}`, e)
			return res.status(500).send(`Could not get ${reqUri}`)
		}
	})


	app.get(['/feed/:strategy?'], async (req: Request, res: Response) => {
		console.log(`Getting feed for ${JSON.stringify(req.query)}`)
		const reqUri = req.originalUrl

		const limit = req.query.limit ? +req.query.limit : 100
		const offset = req.query.offset ? +req.query.offset : 0
		let contentFocus = req.query.contentFocus as string[]
		if (typeof req.query.contentFocus === "string") {
			// if there is only one ContentFocus then req.query returns string instead of string[]
			contentFocus = [req.query.contentFocus]
		} 

		const strategy_name = req.params.strategy ? req.params.strategy as string : 'popular'


		try {
			const feed = await FeedRecommender.getFeed(strategy_name, limit, offset, contentFocus)
			return res.send(feed)
		}
		catch (e: any) {
			console.log(`Error in ${reqUri}`, e)
			return res.status(500).send(`Could not get ${reqUri}`)
		}
	})

	app.get(['/profile_scores', '/profile/scores'], async (req: Request, res: Response) => {
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

	app.get(['/config'], async (req: Request, res: Response) => {
		try {
			const gitHash = execSync('git rev-parse HEAD').toString().trim();
			const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();		
			const payload = {
				git: {
					gitHash,
					gitBranch
				},
				config,
			}
			return res.send(payload)

		} catch (err) {
			console.error('An error occurred while retrieving config information:', err);
			res.status(500).send('An error occurred while retrieving config information');
		}		
	})


}