import  path from 'path'
import axios from "axios"
import { Pretrust, LocalTrust, GlobalTrust } from '../types'
import { objectFlip, getIds } from "./utils"
import { strategies as ptStrategies  } from './strategies/pretrust'
import { strategies as ltStrategies  } from './strategies/localtrust'
import { getDB } from '../utils'
import { PersonalizationStrategy } from './strategies/personalization'
const db = getDB()

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class Recommender {
	public ids: number[] = []
	public idsToIndex: Record<number, number> = {}
	public globaltrust: GlobalTrust = []

	constructor(
		public strategyId: number,
		public personalizationStrategy?: PersonalizationStrategy,
	) {}

	async recalculate(save = true, strategy?: { pretrust: string, localtrust: string, alpha: number }) {
		this.ids = await getIds()
		this.idsToIndex = objectFlip(this.ids)

		strategy = strategy || await db('strategies')
			.where('id', this.strategyId)
			.first() as { pretrust: string, localtrust: string, alpha: number }

		const localtrustStrategy = ltStrategies[strategy.localtrust]
		const pretrustStrategy = ptStrategies[strategy.pretrust]

		console.time('localtrust_generation')
		const localtrust = await localtrustStrategy()
		console.timeEnd('localtrust_generation')
		console.log(`Generated localtrust with ${localtrust.length} entries`)

		console.time('pretrust_generation')
		const pretrust = await pretrustStrategy()
		console.timeEnd('pretrust_generation')
		console.log(`Generated localtrust with ${localtrust.length} entries`)
		console.log(`Generated pretrust with ${pretrust.length} entries`)

		this.globaltrust = await this.runEigentrust(pretrust, localtrust, strategy.alpha)
		console.log("Generated globaltrust")

		save && await this.saveGlobaltrust()
	}

	async recommend(limit = 20, id: number): Promise<number[]> {
		if (!this.personalizationStrategy) {
			throw Error('Reommending but no personalization strategy set')
		}

		return this.personalizationStrategy(this.globaltrust, this.strategyId, id, limit)
	}

	private runEigentrust = async (pretrust: Pretrust, localtrust: LocalTrust, alpha: number, id?: number): Promise<GlobalTrust> => {
		const convertedPretrust = this.convertPretrustToIndeces(pretrust)
		const convertedLocaltrust = this.convertLocaltrustToIndeces(localtrust)

		const res = await this.requestEigentrust(
			convertedLocaltrust,
			convertedPretrust,
			alpha
		)

		return this.parseGlobaltrust(res)
	}

	async requestEigentrust(localTrust: LocalTrust, pretrust: Pretrust, alpha: number): Promise<GlobalTrust> {
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
				alpha: alpha,
				epsilon: 1.0,
				flatTail: 2
			})

			console.timeEnd('calculation')
			return res.data.entries
		}
		catch (e) {
			throw new Error('Calculation did not succeed');
		}
	}

	async loadFromDB() {
		this.globaltrust = await Recommender.getGlobaltrustByStrategyId(this.strategyId)
		console.log(`Loaded ${this.globaltrust.length} globaltrust entries from DB`)
	}

	private async saveGlobaltrust() {
		const CHUNK_SIZE = 1000
		if (!this.globaltrust.length) {
			return
		}

		for (let i = 0; i < this.globaltrust.length; i += CHUNK_SIZE) {
			const chunk = this.globaltrust
				.slice(i, i + CHUNK_SIZE)
				.map(g => ({
					strategyId: this.strategyId,
					...g
				}))
			
			await db('globaltrust')
				.insert(chunk)
				.onConflict(['strategy_id', 'date', 'i']).merge()
		}
	}

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

	static async getGlobaltrustByStrategyId(strategyId: number, date?: string, hex = false, limit = 50, offset = 0): Promise<GlobalTrust> {
		date = date || await this.getLatestDateByStrategyId(strategyId)

		const globaltrust = await db('globaltrust')
			.where({ strategyId, date })
			.select('v as score', db.raw('row_number() over (order by v desc) as rank'), 'handle', 'count as followers_count')
			.select(hex ? db.raw("'0x' || to_hex(profiles.id) as id") : 'profiles.id as id')
			.innerJoin('profiles', 'profiles.id', 'globaltrust.i')
			.innerJoin('follower_counts', 'follower_counts.profile_id', 'profiles.id')
			.orderBy('score', 'desc')
			.offset(offset)
			.limit(limit)

		if (!globaltrust.length) {
			throw new Error(`No globaltrust found in DB for strategy id: ${strategyId}`)
		}

		return globaltrust
	}	

	static async getGlobaltrustLength(strategyId: number, date?: string): Promise<number> {
		date = date || await this.getLatestDateByStrategyId(strategyId)

		// TODO: Investigate why count is different without joins
		const { count } = await db('globaltrust')
			.where({ strategyId, date })
			.innerJoin('profiles', 'profiles.id', 'globaltrust.i')
			.innerJoin('follower_counts', 'follower_counts.profile_id', 'profiles.id')
			.count()
			.first()

		return +count
	}	

	static async getRankOfUser(strategyId: number, id: number, date?: string): Promise<number> {
		date = date || await this.getLatestDateByStrategyId(strategyId)

		const res = await db.with('globaltrust_ranks', (qb: any) => {
			return qb.from('globaltrust')
				.select('i', 'v', 'strategy_id', db.raw('row_number() over (order by v desc) as rank'))
				.where({ strategyId, date })
				.orderBy('v', 'desc')
		}).select('rank').from('globaltrust_ranks').where('i', id).first()

		return res && res.rank
	}

	static async getScoreOfUser(strategyId: number, id: number, date?: string): Promise<number> {
		date = date || await this.getLatestDateByStrategyId(strategyId)

		const res = await db('globaltrust')
			.select(db.raw('v as score'))
			.where('strategyId', strategyId)
			.where('i', id)
			.where('date', date).first()

		return res && res.score
	}

	static async getLatestDateByStrategyId(strategyId: number): Promise<string> {
		const { date } = await db('globaltrust')
			.where('strategy_id', strategyId)
			.max('date as date')
			.first()
		
		return date
	}
}
