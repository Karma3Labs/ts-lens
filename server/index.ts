import express, { Request, Response } from 'express'
import Recommender from '../recommender/index'
import { getIdFromQueryParams, getProfilesFromIdsOrdered } from './utils'
import { getDB } from '../utils' 

const app = express()
const PORT = 8080

export default (recommender: Recommender) => {
	app.get('/suggest', async (req: Request, res: Response) => {
		try {
			const id = await getIdFromQueryParams(req.query)
			console.log('Recommeding for id: ', id)

			const ids = await recommender.recommend(50, id)
			const profiles = await getProfilesFromIdsOrdered(ids)
			console.log(ids)

			res.send(profiles)
		}
		catch (e: unknown) {
			if (e instanceof Error) {
				console.log(`[SERVER] ${e.message} for input:`, req.query)
				return res.status(400).send(e.message) //TODO: Parameterize HTTP codes
			}
		}
	})

	app.get('/rankings', async (req: Request, res: Response) => {
		try {
			const limit = req.query.limit ? +req.query.limit : 50
			const offset = req.query.offset ? +req.query.offset : 0
			const strategyId = req.query.strategyId ? +req.query.strategyId : undefined
			if (!strategyId) {
				return res.status(400).send('Missing strategyId')
			}
			console.log(`Recommeding rankings in range [${offset}, ${offset + limit}]`)

			const globaltrust = await Recommender.getGlobaltrustByStrategyId(strategyId)
			const ids = globaltrust.slice(offset, offset + limit).map(({ i }) => i )
			const profiles = await getProfilesFromIdsOrdered(ids)
			res.send(profiles)
		}
		catch (e: unknown) {
			if (e instanceof Error) {
				console.log(`[SERVER] ${e.message} for input:`, req.query)
				return res.status(400).send(e.message) //TODO: Parameterize HTTP codes
			}
		}
	})

	app.listen(PORT, () => console.log(`Magic is happening on port: ${PORT}`))
}

