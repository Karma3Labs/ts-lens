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
		this.localtrustStrategies = config.localtrustStrategies
	}

	async compute() {
		for (const name of this.localtrustStrategies) {
			console.log(`Generate localtrust for ${name}`)
			const localtrust = await this.generateLocaltrust(name)

			console.log(`Save localtrust for ${name}`)
			await this.saveLocaltrust(name, localtrust)

			console.log(`Upload localtrust for ${name}`)
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

	async saveLocaltrust(strategyName: string, localtrust: LocalTrust<string>, dbSchema: string = "public") {
		const CHUNK_SIZE = 10000
		if (!localtrust.length) {
			return
		}

		// Delete previous
		await db(`${dbSchema}.localtrust`).where({ strategy_name: strategyName}).del();
		console.log(`Deleted previous localtrust for strategy ${strategyName}`)

		for (let i = 0; i < localtrust.length; i += CHUNK_SIZE) {
			const chunk = localtrust
				.slice(i, i + CHUNK_SIZE)
				.map(g => ({
					strategyName,
					...g
				}));

			await db(`${dbSchema}.localtrust`)
				.insert(chunk)
		}
		console.log(`Inserted localtrust for strategy ${strategyName}`)
	}

	async uploadLocaltrust(strategyName: string, localtrust: LocalTrust<string>, ids: string[] = []) {
		const CHUNK_SIZE = 2500000
		if (!ids.length) {
				ids = await getIds()
		}

		console.log(`Converting localtrust for strategy ${strategyName} to ids`)
		console.time("Uploading localtrust")
		const idsToIndex = objectFlip(ids)
		const convertedLocaltrust: LocalTrust<number> = localtrust.map(({ i, j, v }) => {
				return {
						i: +idsToIndex[i], j: +idsToIndex[j], v: +v
				}
		})

		let merge = false;
		for (let i = 0; i < convertedLocaltrust.length; i += CHUNK_SIZE) {
				const chunk = convertedLocaltrust.slice(i, i + CHUNK_SIZE)
				const opts: any = {
						scheme: 'inline',
						size: ids.length,
						entries: chunk,
				}
				console.log(`IDs: ${ids.length}, entries: ${chunk.length}`)

				const eigentrustAPI = `${process.env.EIGENTRUST_API}/basic/v1/local-trust/${strategyName}?merge=${merge}`
				console.log(`Uploading localtrust for strategy ${strategyName} to ${eigentrustAPI}`)
				await axios.put(eigentrustAPI, opts)
				merge = true;
		}
		console.timeEnd("Uploading localtrust")
	}

	async getLocaltrust(strategyName: string, dbSchema: string = "public") {
		const localtrust = await db(`${dbSchema}.localtrust`)
			.where({ strategyName })
			.select('i', 'j', 'v')

		return localtrust
	}
}