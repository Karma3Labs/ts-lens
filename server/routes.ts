import { Express, Request, Response } from 'express'
import Rankings from '../recommender/RankingsRecommender'
import UserRecommender from '../recommender/UserRecommender'
import { getIdFromQueryParams, getIdsFromQueryParams, getProfilesFromIdsOrdered, getStrategyIdFromQueryParams, isValidDate } from './utils'

export default async (app: Express) => {
	// TODO: move to config
	const userRecommender = new UserRecommender()
	await userRecommender.init()

	app.get('/suggest', async (req: Request, res: Response) => {
		const reqUri = req.originalUrl.split("?").shift()
		let id: number, hex: boolean

		try {
			id = await getIdFromQueryParams(req.query)
			hex = req.query.hex === 'true'
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} personalized for id: ${id}`)

		try {
			const re = await userRecommender.recommend(id)
			console.log(re)
			const profiles = await getProfilesFromIdsOrdered(re, hex)
			profiles.map((profile: any, i: number) => {
				profile.rank = i
			})
			return res.send(profiles)
		}
		catch (e: any) {
			console.error(`Error in ${reqUri} for id: ${id}`, e)
			res.status(500).send(`Could not get ${reqUri}`)
		}
	})

	/*
	app.get('/suggest_posts', async (req: Request, res: Response) => {
		const reqUri = req.originalUrl.split("?").shift()
		const limit = req.query.limit ? +req.query.limit : 50
		let id: number, hex: boolean

		try {
			id = await getIdFromQueryParams(req.query)
			hex = req.query.hex === 'true'
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} personalized for id: ${id}`)

		try {
			const ids = await recommender.recommendCasts(limit, id)
			return res.send(ids)
		}
		catch (e: any) {
			console.error(`Error in ${reqUri} for id: ${id}`, e)
			res.status(500).send(`Could not get ${reqUri}`)	
		}
	})
	*/

	app.get(['/rankings_count', '/profile_count'], async (req: Request, res: Response) => {
		const reqUri = req.originalUrl.split("?").shift()
		let strategyId: number, date: string

		try {
			strategyId = await getStrategyIdFromQueryParams(req.query)
			date = req.query.date && isValidDate(req.query.date as string) ? req.query.date as string : await Rankings.getLatestDateByStrategyId(strategyId)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} for strategyId: ${strategyId}`)

		try {
			const count = await Rankings.getGlobaltrustLength(strategyId, date)
			return res.send({ count })
		}
		catch (e: any) {
			console.error(`Error in /rankings_count for strategyId: ${strategyId}`, e)
			res.status(500).send(`Could not get ${reqUri}`)
		}
	})
	
	app.get(['/profile_score'], async (req: Request, res: Response) => {
		const reqUri = req.originalUrl.split("?").shift()
		let id: number, strategyId: number
		let date: string

		try {
			id = await getIdFromQueryParams(req.query)
			strategyId = await getStrategyIdFromQueryParams(req.query)
			date = req.query.date && isValidDate(req.query.date as string) ? req.query.date as string : await Rankings.getLatestDateByStrategyId(strategyId)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} for id: ${id} and strategyId: ${strategyId}`)

		try {
			const score = await Rankings.getScoreOfUser(strategyId, id, date);
			return res.send({ score })
		}
		catch (e: any) {
			console.error(`Error in ${reqUri} for handle: ${id} and strategyId: ${strategyId}`, e)
			res.status(500).send(`Could not get ${reqUri}`)
		}
	})

	app.get(['/profile_scores_by_users'], async (req: Request, res: Response) => {
		const reqUri = req.originalUrl.split("?").shift()
		let ids: number[], strategyId: number, hex: boolean
		let date: string

		try {
			hex	= req.query.hex === 'true'
			ids = await getIdsFromQueryParams(req.query)
			strategyId = await getStrategyIdFromQueryParams(req.query)
			date = req.query.date && isValidDate(req.query.date as string) ? req.query.date as string : await Rankings.getLatestDateByStrategyId(strategyId)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} for ids: ${ids} and strategyId: ${strategyId}`)

		try {
			const scores = await Rankings.getGlobaltrustByStrategyIdAndIds(strategyId, ids, hex, date);
			return res.send(scores)
		}
		catch (e: any) {
			console.error(`Error in ${reqUri} for ids: ${ids} and strategyId: ${strategyId}`, e)
			res.status(500).send(`Could not get ${reqUri}`)
		}
	})

	app.get(['/ranking_index', '/profile_rank'], async (req: Request, res: Response) => {
		const reqUri = req.originalUrl.split("?").shift()
		let id: number, strategyId: number
		let date: string

		try {
			id = await getIdFromQueryParams(req.query)
			strategyId = await getStrategyIdFromQueryParams(req.query)
			date = req.query.date && isValidDate(req.query.date as string) ? req.query.date as string : await Rankings.getLatestDateByStrategyId(strategyId)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} for id: ${id} and strategyId: ${strategyId}`)

		try {
			const rank = await Rankings.getRankOfUser(strategyId, id, date);
			return res.send({ rank })
		}
		catch (e: any) {
			console.error(`Error in ${reqUri} for handle: ${id} and strategyId: ${strategyId}`, e)
			res.status(500).send(`Could not get ${reqUri}`)
		}
	})

	app.get(['/rankings', '/profile_scores'], async (req: Request, res: Response) => {
		const reqUri = req.originalUrl.split("?").shift()
		const limit = req.query.limit ? +req.query.limit : 50
		const offset = req.query.offset ? +req.query.offset : 0
		let strategyId: number, date: string, hex: boolean

		try {
			strategyId = await getStrategyIdFromQueryParams(req.query)
			date = req.query.date && isValidDate(req.query.date as string) ? req.query.date as string : await Rankings.getLatestDateByStrategyId(strategyId)
			hex = req.query.hex === 'true'
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`${reqUri} for strategyId: ${strategyId} on ${date} ranging from [${offset} to ${offset + limit}]`)

		try {
			const globaltrust = await Rankings.getGlobaltrustByStrategyId(strategyId, date, hex, limit, offset)
			return res.send(globaltrust)
		}
		catch (e: any) {
			console.log(`Error in ${reqUri} for strategyId: ${strategyId}`, e)
			return res.status(500).send(`Could not get ${reqUri}`)
		}
	})
}