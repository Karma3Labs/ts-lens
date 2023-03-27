import express, { Request, Response } from 'express'
import Recommender from '../recommender/index'
import { getIdFromQueryParams, getProfilesFromIdsOrdered, getStrategyIdFromQueryParams, isValidDate } from './utils'

const app = express()
const PORT = 8080

export default (recommender: Recommender) => {
	app.get('/suggest', async (req: Request, res: Response) => {
		let id: number, hex: boolean
		try {
			id = await getIdFromQueryParams(req.query)
			hex = req.query.hex === 'true'
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`Suggesting personalized for id: ${id}`)

		try {
			const ids = await recommender.recommend(50, id)
			const profiles = await getProfilesFromIdsOrdered(ids, hex)
			profiles.map((profile: any, i: number) => {
				profile.rank = i
			})
			return res.send(profiles)
		}
		catch (e: any) {
			console.error(`Error in /suggest for id: ${id}`, e)
			res.status(500).send('Computation failed')
		}
	})

	app.get('/rankings_count', async (req: Request, res: Response) => {
		let strategyId: number, date: string
		try {
			strategyId = await getStrategyIdFromQueryParams(req.query)
			date = req.query.date && isValidDate(req.query.date as string) ? req.query.date as string : await Recommender.getLatestDateByStrategyId(strategyId)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`Recommeding rankings count for strategyId: ${strategyId}`)

		try {
			const count = await Recommender.getGlobaltrustLength(strategyId, date)
			return res.send({ count })
		}
		catch (e: any) {
			console.error(`Error in /rankings_count for strategyId: ${strategyId}`, e)
			res.status(500).send('Could not get rankings count')
		}
	})

	app.get('/ranking_index', async (req: Request, res: Response) => {
		let id: number, strategyId: number
		let date: string

		try {
			id = await getIdFromQueryParams(req.query)
			strategyId = await getStrategyIdFromQueryParams(req.query)
			date = req.query.date && isValidDate(req.query.date as string) ? req.query.date as string : await Recommender.getLatestDateByStrategyId(strategyId)
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`Recommeding ranking index for id: ${id} and strategyId: ${strategyId}`)

		try {
			const rank = await Recommender.getRankOfUser(strategyId, id, date);
			return res.send({ rank })
		}
		catch (e: any) {
			console.error(`Error in /ranking_index for handle: ${id} and strategyId: ${strategyId}`, e)
			res.status(500).send('Could not get ranking index')
		}
	})

	app.get('/rankings', async (req: Request, res: Response) => {
		const limit = req.query.limit ? +req.query.limit : 50
		const offset = req.query.offset ? +req.query.offset : 0
		let strategyId: number, date: string, hex: boolean

		try {
			strategyId = await getStrategyIdFromQueryParams(req.query)
			date = req.query.date && isValidDate(req.query.date as string) ? req.query.date as string : await Recommender.getLatestDateByStrategyId(strategyId)
			hex = req.query.hex === 'true'
		}
		catch (e: any) {
			return res.status(400).send(e.message)
		}
		console.log(`Recommeding rankings in range [${offset}, ${offset + limit}]`)

		try {
			const globaltrust = await Recommender.getGlobaltrustByStrategyId(strategyId, date)
			const ids = globaltrust.slice(offset, offset + limit).map(({ i }) => i )
			const profiles = await getProfilesFromIdsOrdered(ids, hex)

			profiles.forEach((profile: any, i) => {
				profile.rank = offset + i
			})

			return res.send(profiles)
		}
		catch (e: any) {
			console.log(`Error in /rankings for strategyId: ${strategyId}`, e)
			return res.status(500).send('Could not get rankings')
		}
	})

	app.listen(PORT, () => console.log(`Magic is happening on port: ${PORT}`))
}

