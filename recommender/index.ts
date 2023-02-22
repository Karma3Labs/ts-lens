import  path from 'path'
import axios from "axios"
import { Pretrust, LocalTrust, GlobalTrust } from '../types'
import { objectFlip, getIds } from "./utils"
import { PretrustStrategy } from './strategies/pretrust'
import { LocaltrustStrategy } from './strategies/localtrust'
import { PersonalizationStrategy, strategies as personalizationStrategies } from './strategies/personalization'
import { getDB } from '../utils'
const db = getDB()

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })


export default class Recommender {
	public alpha: number
	public ids: number[] = []
	public idsToIndex: Record<number, number> = {}
	public localtrustStrategy: LocaltrustStrategy
	public pretrustStrategy: PretrustStrategy
	public personalizationStrategy: PersonalizationStrategy
	public globaltrust: GlobalTrust = []

	constructor(pretrustStrategy: PretrustStrategy, localtrustStrategy: LocaltrustStrategy, alpha = 0.3, personalizationStrategy?: PersonalizationStrategy) {
		this.alpha = alpha
		this.localtrustStrategy = localtrustStrategy
		this.pretrustStrategy = pretrustStrategy
		this.personalizationStrategy = personalizationStrategy || personalizationStrategies.useFollows
	}

	async recalculate() {
		console.time('ids')
		this.ids = await getIds()
		console.timeEnd('ids')

		this.idsToIndex = objectFlip(this.ids)

		console.time('localtrust_generation')
		const localtrust = await this.localtrustStrategy()
		console.timeEnd('localtrust_generation')
		console.log(`Generated localtrust with ${localtrust.length} entries`)

		const pretrust = await this.pretrustStrategy()
		console.log(`Generated pretrust with ${pretrust.length} entries`)

		this.globaltrust = await this.runEigentrust(pretrust, localtrust)
		this.saveToDB(this.globaltrust)
	}

	async saveToDB(globaltrust: GlobalTrust) {
		const chunkSIZE = 1000

		for (let i = 0; i < globaltrust.length; i += chunkSIZE) {
			const chunk = globaltrust.slice(i, i + chunkSIZE)
			await db('globaltrust_cache').insert(chunk)
		}
	}

	async loadFromDB() {
		this.globaltrust = await db('globaltrust_cache')
			.orderBy('v', 'desc')
			.select()
	}

	async recommend(limit = 20, id: number): Promise<number[]> {
		// return this.globaltrust.slice(0, limit).map(({ i }) => i)

		return this.personalizationStrategy(this.globaltrust, id, limit)
	}

	private runEigentrust = async (pretrust: Pretrust, localtrust: LocalTrust, id?: number): Promise<GlobalTrust> => {
		const convertedPretrust = this.convertPretrustToIndeces(pretrust)
		const convertedLocaltrust = this.convertLocaltrustToIndeces(localtrust)

		const res = await this.requestEigentrust(
			convertedLocaltrust,
			convertedPretrust,
		)

		return this.parseGlobaltrust(res)
	}

	async requestEigentrust(localTrust: LocalTrust, pretrust: Pretrust): Promise<GlobalTrust> {
		try {
			console.time('calculation')

			const eigentrustAPI = `${process.env.EIGENTRUST_API}/basic/v1/compute`
			const res = await axios.post(eigentrustAPI, {
				localTrust: {
					scheme: 'inline',
					size: this.ids.length,
					entries: localTrust,
				},
				pretrust: {
					scheme: 'inline',
					size: this.ids.length,
					entries: pretrust,
				},
				alpha: this.alpha
			})

			console.timeEnd('calculation')
			return res.data.entries
		}
		catch (e) {
			throw new Error('Calculation did not succeed');
		}
	}

	/**
	 * Address to number conversions
	*/

	private convertLocaltrustToIndeces(localTrust: LocalTrust): LocalTrust {
		return localTrust.map(({ i, j, v }) => {
			return {
				i: +this.idsToIndex[i],
				j: +this.idsToIndex[j],
				v
			}
		}) 
	}
	
	private convertPretrustToIndeces(preTrust: Pretrust): Pretrust {
		return preTrust.map(({ i, v }) => {
			return {
				i: +this.idsToIndex[i],
				v
			}
		}) 
	}

	private parseGlobaltrust(globaltrust: GlobalTrust): GlobalTrust {
		const parsedGlobaltrust = globaltrust.map(({ i, v }) => {
			return {
				i: this.ids[i],
				v: +v
			}
		})

		return parsedGlobaltrust.sort((a, b) => b.v - a.v)
	}
}
