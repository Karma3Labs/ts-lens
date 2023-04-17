import  path from 'path'
import axios from "axios"
import { Pretrust, LocalTrust, GlobalTrust } from '../types'
import { objectFlip } from "./utils"
import { strategies as ptStrategies  } from './strategies/pretrust'
import { strategies as ltStrategies  } from './strategies/localtrust'
import { getDB } from '../utils'
const db = getDB()

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class Rankings {
	static async calculate(ids: number[], strategyId: number, save: boolean = true): Promise<GlobalTrust> {
		const strategy = await db('strategies').where({ id: strategyId }).first()
		if (!strategy) throw new Error(`Strategy with id ${strategyId} not found`);
	
		return await Rankings.calculateByStrategy(ids, strategy, save)
	}

	static calculateByStrategy = async (ids: number[], strategy: { pretrust: string, localtrust: string, alpha: number, id?: number }, save: boolean = true): Promise<GlobalTrust> => {
		const localtrustStrategy = ltStrategies[strategy.localtrust]
		const pretrustStrategy = ptStrategies[strategy.pretrust]

		console.log("Calculating localtrust")
		console.time('localtrust_generation')
		const localtrust = await localtrustStrategy()
		save && await Rankings.saveLocaltrust(strategy.localtrust, localtrust);
		console.timeEnd('localtrust_generation')
		console.log(`Generated localtrust with ${localtrust.length} entries`)

		console.time('pretrust_generation')
		const pretrust = await pretrustStrategy()
		console.timeEnd('pretrust_generation')

		console.log(`Generated localtrust with ${localtrust.length} entries`)
		console.log(`Generated pretrust with ${pretrust.length} entries`)

		const globaltrust = await Rankings.runEigentrust(ids, pretrust, localtrust, strategy.alpha)
		console.log("Generated globaltrust")

		save && await Rankings.saveGlobaltrust(strategy.id || 0, globaltrust)

		return globaltrust
	}

	static async runEigentrust(ids: number[], pretrust: Pretrust, localtrust: LocalTrust, alpha: number, initial?: Pretrust, maxIterations?: number): Promise<GlobalTrust> {
		const idsToIndex = objectFlip(ids)

		const convertedPretrust = pretrust.map(({ i, v }) => {
			return {
				i: +idsToIndex[i], v: +v 
			}
		}) 

		const convertedLocaltrust = localtrust.map(({ i, j, v }) => {
			return {
				i: +idsToIndex[i], j: +idsToIndex[j], v: +v
			}
		})

		const res = await Rankings.requestEigentrust(
			ids.length,
			convertedLocaltrust,
			convertedPretrust,
			alpha,
		)

		const parsedGlobaltrust = res.map(({ i, v }) => {
			return {
				i: ids[i],
				v: +v
			}
		})

		return parsedGlobaltrust.sort((a, b) => b.v - a.v)
	}

	static async requestEigentrust(peerslength: number, localTrust: LocalTrust, pretrust: Pretrust, alpha: number): Promise<GlobalTrust> {
		try {
			console.time('calculation')

			const opts: any = {
				localTrust: {
					scheme: 'inline',
					size: peerslength,
					entries: localTrust,
				},
				pretrust: {
					scheme: 'inline',
					size: peerslength,
					entries: pretrust,
				},
				alpha: alpha,
				epsilon: 1.0,
				flatTail: 2
			}

			const eigentrustAPI = `${process.env.EIGENTRUST_API}/basic/v1/compute`
			const res = await axios.post(eigentrustAPI, opts)
			console.timeEnd('calculation')
			return res.data.entries
		}
		catch (e) {
			throw new Error('Calculation did not succeed');
		}
	}

	static async saveLocaltrust(localtrustName: string, localtrust: LocalTrust) {
		const ltStrategy = await db('localtrust_strategies').where({ name: localtrustName }).first()
		if (!ltStrategy) throw new Error(`Localtrust strategy with name ${localtrustName} not found`);

		const CHUNK_SIZE = 1000
		if (!localtrust.length) {
			return
		}

		// Delete previous
		await db('localtrust').where({ strategy_id: ltStrategy.id }).del();

		for (let i = 0; i < localtrust.length; i += CHUNK_SIZE) {
			console.log("Working on chunk", i, i + CHUNK_SIZE)
			const chunk = localtrust
				.slice(i, i + CHUNK_SIZE)
				.map(g => ({
					strategyId: ltStrategy.id,
					...g
				}));

			console.log("Saving chunk", i, i + CHUNK_SIZE, chunk)
			
			await db('localtrust')
				.insert(chunk)
		}
		console.timeEnd("Saving localtrust")
	}


	static async saveGlobaltrust(strategyId: number, globaltrust: GlobalTrust) {
		const CHUNK_SIZE = 1000
		if (!globaltrust.length) {
			return
		}

		for (let i = 0; i < globaltrust.length; i += CHUNK_SIZE) {
			const chunk = globaltrust
				.slice(i, i + CHUNK_SIZE)
				.map(g => ({
					strategyId,
					...g
				}))
			
			await db('globaltrust')
				.insert(chunk)
				.onConflict(['strategy_id', 'date', 'i']).merge()
		}
	}

	static async getGlobaltrustByStrategyId(strategyId: number, date?: string, hex = false, limit = 50, offset = 0): Promise<GlobalTrust> {
		date = date || await Rankings.getLatestDateByStrategyId(strategyId)

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

	static async getGlobaltrustByStrategyIdAndIds(strategyId: number, ids: number[], hex = false, date?: string): Promise<GlobalTrust> {
		date = date || await Rankings.getLatestDateByStrategyId(strategyId)

		const globaltrust = await db.with('g', (q: any) => {
			return q.from('globaltrust')
				.where({ strategyId, date })
				.select('v as score', db.raw('row_number() over (order by v desc) as rank'), 'handle', 'count as followers_count', 'profiles.id as id')
				.innerJoin('profiles', 'profiles.id', 'globaltrust.i')
				.innerJoin('follower_counts', 'follower_counts.profile_id', 'profiles.id')
				.orderBy('score', 'desc')
		})
		.select('*')
		.from('g')
		.whereIn('id', ids)

		hex && globaltrust.forEach((g: any) => g.id = '0x' + g.id.toString(16))

		if (!globaltrust.length) {
			throw new Error(`No globaltrust found in DB for strategy id: ${strategyId}`)
		}

		return globaltrust 
	}

	static async getGlobaltrustLength(strategyId: number, date?: string): Promise<number> {
		date = date || await Rankings.getLatestDateByStrategyId(strategyId)

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
		date = date || await Rankings.getLatestDateByStrategyId(strategyId)

		const res = await db.with('globaltrust_ranks', (qb: any) => {
			return qb.from('globaltrust')
				.select('i', 'v', 'strategy_id', db.raw('row_number() over (order by v desc) as rank'))
				.where({ strategyId, date })
				.orderBy('v', 'desc')
		}).select('rank').from('globaltrust_ranks').where('i', id).first()

		return res && res.rank
	}

	static async getScoreOfUser(strategyId: number, id: number, date?: string): Promise<number> {
		date = date || await Rankings.getLatestDateByStrategyId(strategyId)

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

	static async getRawGlobaltrust(strategyId: number, limit ?: number): Promise<GlobalTrust> {
		const q = db('globaltrust')
			.where({ strategyId })
			.select('v', 'i')

		if (limit) {
			q.modify((q: any) => q.orderBy('v', 'desc').limit(limit))
		}

		const globaltrust = await q
		globaltrust.forEach((g: any) => g.v = +g.v)

		if (!globaltrust.length) {
			throw new Error(`No globaltrust found in DB for strategy id: ${strategyId}`)
		}

		return globaltrust
	}
}
