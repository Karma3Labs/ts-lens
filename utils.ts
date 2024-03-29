import  path from 'path'
import humps from 'humps'
require('dotenv').config({ path: path.resolve(__dirname, './.env') })

export const getDB = () => {
	const env = (process.env.ENVIRONMENT || 'default').toLowerCase()
	console.log(env)
	const config = require('./knexfile.js')[env]
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

export const getEnv = (name: string): string => {
	if (!process.env[name]) {
		throw new Error(`Env var undefined: ${name}`)
	}


	return String(process.env[name])
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))