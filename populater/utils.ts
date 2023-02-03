import humps from 'humps'
import 'dotenv'

export const getSubgraphDB = () => {
	const config = {
		client: 'pg',
		connection: {
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		user: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: 'graph-node'
		}
	}

	let options: Record<string, any> = {
		...config,
		wrapIdentifier: (value: any, origImpl: Function, _: any) =>
			origImpl(humps.decamelize(value)),
		postProcessResponse: (result: any, _: any) => {
			return humps.camelizeKeys(result)
		},
	}

	const knex = require('knex')(options)
	return knex
}