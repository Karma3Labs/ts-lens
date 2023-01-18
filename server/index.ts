import express, { Request, Response } from 'express'
import Recommender from '../recommender/index'
import { LocaltrustStrategy } from '../recommender/strategies/localtrust'
import { PretrustStrategy } from '../recommender/strategies/pretrust'

const app = express()
const PORT = 8080

export default (recommender: Recommender, pretrustStrategy: PretrustStrategy, localtrustStrategy: LocaltrustStrategy) => {
	app.get('/suggest', async (req: Request, res: Response) => {
		try {
			const handle = req.query?.handle as string
			console.log('Recommeding for handle: ', handle)

			if (!recommender.handles.includes(handle)) {
				return res.status(400).send(`Handle provided does not exist: ${handle}`)
			}

			console.log(`Suggesting for handle: ${handle}`)

			const handles = await recommender.recommend(handle, 50)

			res.send(handles)
		}
		catch (e: unknown) {
			if (e instanceof Error) {
				console.log(`[SERVER] ${e.message} for input:`, req.query)
				return res.status(400).send(e.message) //TODO: Parameterize HTTP codes
			}
		}
	})

	app.listen(PORT, async () => {
		recommender = new Recommender()
		await recommender.init(pretrustStrategy, localtrustStrategy)

		console.log(`Magic is happening on port: ${PORT}`)
	})
}