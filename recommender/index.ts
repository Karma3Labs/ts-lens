import  path from 'path'
import axios from "axios"
import { Pretrust, LocalTrust, GlobalTrust, Entry, ParsedGlobaltrust } from '../types'
import { objectFlip } from "./utils"
import { PretrustStrategy, strategies as pretrustStrategies } from './strategies/pretrust'
import { LocaltrustStrategy, strategies as localStrategies } from './strategies/localtrust'
import { PersonalizationStrategy, strategies as personalizationStrategies } from './strategies/personalization'
import { getIds } from './utils'
import { parsed } from 'yargs'
import { toNumber } from 'lodash'

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class Recommender {
	public alpha: number
	public ids: number[] = []
	public idsToIndex: Record<number, number> = {}
	public localtrustStrategy: LocaltrustStrategy
	public pretrustStrategy: PretrustStrategy
	public personalizationStrategy: PersonalizationStrategy
	public globaltrust: ParsedGlobaltrust = {}

	constructor(pretrustStrategy: PretrustStrategy, localtrustStrategy: LocaltrustStrategy, alpha = 0.3, personalizationStrategy?: PersonalizationStrategy) {
		this.alpha = alpha
		this.localtrustStrategy = localtrustStrategy
		this.pretrustStrategy = pretrustStrategy
		this.personalizationStrategy = personalizationStrategy || personalizationStrategies.useFollows
	}

	async load() {
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
	}

	async recommend(limit = 20, id?: number): Promise<number[]> {
		return Object.keys(this.globaltrust)
			.slice(0, limit)
			.map(parseInt) // Damn ts

		return this.personalizationStrategy(this.globaltrust, limit)
	}

	private runEigentrust = async (pretrust: Pretrust, localtrust: LocalTrust, id?: number): Promise<ParsedGlobaltrust> => {
		const convertedPretrust = this.convertPretrustToIndeces(pretrust)
		const convertedLocaltrust = this.convertLocaltrustToIndeces(localtrust)

		const res = await this.requestEigentrust(
			convertedLocaltrust,
			convertedPretrust,
		)

		const globaltrust = this.parseGlobaltrust(res);
		
		return globaltrust
	}

	async requestEigentrust(localTrust: LocalTrust, pretrust: Pretrust) {
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

	private parseGlobaltrust(globaltrust: GlobalTrust): ParsedGlobaltrust {
		const parsedGlobalTrust: ParsedGlobaltrust = {}

		globaltrust.forEach(({ i, v }) => {
			parsedGlobalTrust[this.ids[i]] = v
		})

		const sorted = Object.fromEntries(
			Object.entries(parsedGlobalTrust).sort(([,a],[,b]) => b - a)
		);

		return sorted
	}
}
