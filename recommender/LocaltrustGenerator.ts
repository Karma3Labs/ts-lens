import axios from "axios"
import { config }from './config'
import { strategies } from './strategies/localtrust'
import { getIds, objectFlip } from './utils'
import { getDB } from '../utils'
import { LocalTrust } from '../types'

const db = getDB()

export default class LocaltrustGenerator {
	public localtrustStrategies: string[]
	public ids: string[]

	constructor(ids: string[] = []) {
		this.ids = ids
		this.localtrustStrategies = Object.values(config.localtrustStrategies)
	}

	async compute() {
		for (const name of this.localtrustStrategies) {
			const localtrust = await this.generateLocaltrust(name)

			await this.saveLocaltrust(name, localtrust)
			await this.uploadLocaltrust(name, localtrust, this.ids)
		}
	}

	async generateLocaltrust(name: string) {
		if (!strategies[name]) throw new Error(`Strategy ${name} not found`)

		const localtrustStrategy = strategies[name]
		const localtrust = await localtrustStrategy()

		console.log(`Generated localtrust with ${localtrust.length} entries`)

		return localtrust
	}

	async saveLocaltrust(strategyName: string, localtrust: LocalTrust<string>) {
		const CHUNK_SIZE = 1000
		if (!localtrust.length) {
			return
		}

		// Delete previous
		await db('localtrust').where({ strategy_name: strategyName}).del();

		for (let i = 0; i < localtrust.length; i += CHUNK_SIZE) {
			const chunk = localtrust
				.slice(i, i + CHUNK_SIZE)
				.map(g => ({
					strategyName,
					...g
				}));

			await db('localtrust')
				.insert(chunk)
		}
	}

	async uploadLocaltrust(strategyName: string, localtrust: LocalTrust<string>, ids: string[] = []) {
		if (!ids.length) {
			ids = await getIds()
		}

		console.time("Uploading localtrust")
		const idsToIndex = objectFlip(ids)
		const convertedLocaltrust: LocalTrust<number> = localtrust.map(({ i, j, v }) => {
			return {
				i: +idsToIndex[i], j: +idsToIndex[j], v: +v
			}
		})

		const opts: any = {
			scheme: 'inline',
			size: ids.length,
			entries: convertedLocaltrust,
		}

		const eigentrustAPI = `${process.env.EIGENTRUST_API}/basic/v1/local-trust/${strategyName}`
		await axios.put(eigentrustAPI, opts)
		console.timeEnd("Uploading localtrust")
	}

	async getLocaltrust(strategyName: string) {
		const localtrust = await db('localtrust')
			.where({ strategyName })
			.select('i', 'j', 'v')

		return localtrust
	}
}