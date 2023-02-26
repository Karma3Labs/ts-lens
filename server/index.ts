import express, { Request, Response } from 'express'
import Recommender from '../recommender/index'
import { getDB } from '../utils'
import { getIdFromQueryParams, getProfilesFromIdsOrdered } from './utils'

const app = express()
const PORT = 8080
const db = getDB()

/**
 * * ranks instead of ids
 * * rankings_count
 * * ranking_index (handle)
*/

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

	app.get('/rankings_count', async (req: Request, res: Response) => {
		const strategyId = req.query.strategy_id ? +req.query.strategy_id : undefined
		if (!strategyId) {
			return res.status(400).send('Missing strategy_id')
		}

		return res.send({ count: await Recommender.getGlobaltrustLength(strategyId) })
	})

	app.get('/ranking_index', async (req: Request, res: Response) => {
		if (!req.query.handle) {
			return res.status(400).send('Handle must be provided')
		}
		const handle = (req.query.handle as string).trim() 

		const strategyId = req.query.strategy_id ? +req.query.strategy_id : undefined
		if (!strategyId) {
			return res.status(400).send('Missing strategy_id')
		}

		const rank = await Recommender.getRankOfUserByHandle(strategyId, handle);
		if (!rank ) {
			return res.status(400).send('Handle is not in globaltrust')
		}
		res.send({ rank })
	})

	app.get('/rankings', async (req: Request, res: Response) => {
		try {
			const limit = req.query.limit ? +req.query.limit : 50
			const offset = req.query.offset ? +req.query.offset : 0
			const strategyId = req.query.strategy_id ? +req.query.strategy_id : undefined

			if (!strategyId) {
				return res.status(400).send('Missing strategyId')
			}
			console.log(`Recommeding rankings in range [${offset}, ${offset + limit}]`)

			const globaltrust = await Recommender.getGlobaltrustByStrategyId(strategyId)
			const ids = globaltrust.slice(offset, offset + limit).map(({ i }) => i )
			const profiles = await getProfilesFromIdsOrdered(ids)

			profiles.forEach((profile: any, i) => {
				profile.rank = offset + i
			})

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

