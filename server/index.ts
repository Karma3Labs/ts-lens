import express, { Request, Response } from 'express'
import Recommender from '../recommender/index'
import { getFullProfiles } from './graphql'

const app = express()
const PORT = 8080

export default (recommender: Recommender) => {
	app.get('/suggest', async (req: Request, res: Response) => {
		const idRegex = /^0x([0-9A-Fa-f]+)$/
		try {
			const id = req.query?.id as string
			console.log('id', id)
			if (!idRegex.test(id)) {
				return res.status(400).send(`Invalid ID provided: ${id}`)
			}
			if (!recommender.ids.includes(id)) {
				return res.status(400).send(`ID does not exist provided: ${id}`)
			}

			const ids = await recommender.recommendUsers(id, 50)
			const fullProfiles = await getFullProfiles(ids)

			res.send(fullProfiles)
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
		await recommender.init()

		console.log(`Magic is happening on port: ${PORT}`)
	})
}