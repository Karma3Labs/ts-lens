import  path from 'path'
import axios from "axios"
import { Profile, Pretrust, GlobalTrust, GlobalTrustConfig } from '../types'
import { objectFlip } from "./utils"
import { strategies as ptStrategies  } from './strategies/pretrust'
import { getDB } from '../utils'
const db = getDB()

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class Rankings {
	static calculateByStrategy = async (
		ids: string[], 
		strategy: { pretrust: string, localtrust: string, alpha: number, strategyName: string }, 
		schema: string,
		save: boolean = true): Promise<GlobalTrust<string>> => {
		const pretrustStrategy = ptStrategies[strategy.pretrust]

		if (!pretrustStrategy) {
			throw new Error("Invalid pretrust strategy")
		}

		console.time('pretrust_generation')
		const pretrust = await pretrustStrategy()
		console.timeEnd('pretrust_generation')

		console.log(`Generated pretrust with ${pretrust.length} entries`)
		console.log(`Slice of pretrust: ${JSON.stringify(pretrust.slice(0,10))}`)

		const localtrustName = `${schema}.${strategy.localtrust}`
		const globaltrust = await Rankings.runEigentrust(ids, pretrust, localtrustName, strategy.alpha)
		console.log("Generated globaltrust")

		return globaltrust
	}

	static async runEigentrust(ids: string[], pretrust: Pretrust<string>, localtrustName: string, alpha: number): Promise<GlobalTrust<string>> {
		const idsToIndex = objectFlip(ids)

		const convertedPretrust: Pretrust<number> = pretrust.map(({ i, v }) => {
			return {
				i: +idsToIndex[i], v: +v 
			}
		}) 

		const res = await Rankings.requestEigentrust(
			ids.length,
			localtrustName,
			convertedPretrust,
			alpha,
		)

		const parsedGlobaltrust = res.map(({ i, v }) => {
			return {
				i: ids[i],
				v: +v
			}
		}) as GlobalTrust<string>

		return parsedGlobaltrust.sort((a, b) => b.v - a.v)
	}

	static async requestEigentrust(peerslength: number, localTrustName: string, pretrust: Pretrust<number>, alpha: number): Promise<GlobalTrust<number>> {
		try {
			console.time('calculation')

			const opts: any = {
				localTrust: {
					scheme: 'stored',
					id: localTrustName,
				},
				pretrust: {
					scheme: 'inline',
					size: peerslength,
					entries: pretrust,
				},
				alpha: alpha,
				epsilon: 1.0,
				maxIterations: 50,
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

	static async saveGlobaltrust(strategyName: string, globaltrust: GlobalTrust<string>) {
		const CHUNK_SIZE = 1000
		if (!globaltrust.length) {
			return
		}

		for (let i = 0; i < globaltrust.length; i += CHUNK_SIZE) {
			const chunk = globaltrust
				.slice(i, i + CHUNK_SIZE)
				.map(g => ({
					strategyName,
					...g
				}))
			
			await db('globaltrust')
				.insert(chunk)
				.onConflict(['strategy_name', 'date', 'i']).merge()
		}
	}

	static async saveGlobaltrustConfig(globaltrustConfig: GlobalTrustConfig, schema: string) {
		if (!globaltrustConfig.length) {
			return
		}

		await db(`${schema}.globaltrust_config`)
			.insert(globaltrustConfig)
			.onConflict(['strategy_name', 'date']).merge()

	}

	// TODO: Type that
	static async getGlobaltrustByStrategyName(strategyName: string, limit = 50, offset = 0, date?: string): Promise<any> {
		console.log(`Getting globaltrust for strategy: ${strategyName}`)

		date = date || await Rankings.getLatestDateByStrategyName(strategyName)

		const globaltrust = await db('globaltrust')
			.where({ strategyName, date })
			.select('v as score', db.raw('row_number() over (order by v desc) as rank'), 'handle', 'count as followers_count')
			.select('k3l_profiles.profile_id as id')
			.innerJoin('k3l_profiles', 'k3l_profiles.profile_id', 'globaltrust.i')
			.innerJoin('k3l_follow_counts', 'k3l_follow_counts.to_profile_id', 'k3l_profiles.profile_id')
			.orderBy('score', 'desc')
			.offset(offset)
			.limit(limit)

		if (!globaltrust.length) {
			throw new Error(`No globaltrust found in DB for strategy: ${strategyName}`)
		}

		return globaltrust
	}	

	static async getGlobaltrustByStrategyNameAndIds(strategyName: string, ids: number[], date?: string): Promise<GlobalTrust<string>> {
		console.log(strategyName, ids)
		date = date || await Rankings.getLatestDateByStrategyName(strategyName)

		const globaltrust = await db.with('g', (q: any) => {
			return q.from('globaltrust')
				.where({ strategyName, date })
				.select('v as score', db.raw('row_number() over (order by v desc) as rank'), 'handle', 'count as followers_count', 'k3l_profiles.profile_id as id')
				.innerJoin('k3l_profiles', 'k3l_profiles.profile_id', 'globaltrust.i')
				.innerJoin('k3l_follow_counts', 'k3l_follow_counts.to_profile_id', 'k3l_profiles.profile_id')
				.orderBy('score', 'desc')
		})
		.select('*')
		.from('g')
		.whereIn('id', ids)

		if (!globaltrust.length) {
			throw new Error(`No globaltrust found in DB for strategy name: ${strategyName}`)
		}

		return globaltrust 
	}

	static async getGlobaltrustLength(strategyName: string, date?: string): Promise<number> {
		let dateClause: string = ''
		if (date) {
			dateClause = 'date=:date'
		} else {
			dateClause = 'date=(select max(date) from globaltrust where strategy_name = :strategyName)'
		}

		const res = await db.raw(`
			select 
				count(*) 
			from globaltrust 
				inner join k3l_profiles on (k3l_profiles.profile_id = globaltrust.i)
				inner join k3l_follow_counts on (k3l_follow_counts.to_profile_id = k3l_profiles.profile_id)
			where 
				strategy_name = :strategyName
				and ${dateClause}
			`, { strategyName, date })

		const { count } = res.rows[0]

		return +count
	}	

	static async getRankOfUser(strategyName: string, id: number, date?: string): Promise<number> {
		date = date || await Rankings.getLatestDateByStrategyName(strategyName)

		const res = await db.with('globaltrust_ranks', (qb: any) => {
			return qb.from('globaltrust')
				.select('i', 'v', 'strategy_name', db.raw('row_number() over (order by v desc) as rank'))
				.where({ strategyName, date })
				.orderBy('v', 'desc')
		}).select('rank').from('globaltrust_ranks').where('i', id).first()

		return res && res.rank
	}

	static async getScoreOfUser(strategyName: string, id: number, date?: string): Promise<number> {
		date = date || await Rankings.getLatestDateByStrategyName(strategyName)

		const res = await db('globaltrust')
			.select(db.raw('v as score'))
			.where({ strategyName, i: id, date })
			.first()

		return res && res.score
	}

	static async getFollowSuggestions(strategyName: string, id: number, limit: number): Promise<Profile[]> {
		const res = await db.raw(`
			SELECT 
				nf::text as profileid,
				prof.handle as handle,
				rnk.rank as rank
			FROM profile_suggests AS suggest
			CROSS JOIN LATERAL JSONB_ARRAY_ELEMENTS_TEXT(suggest.json_data->'not_following') AS nf 
			INNER JOIN k3l_profiles AS prof 
						ON prof.profile_id = nf::text
			INNER JOIN k3l_rank AS rnk 
						ON (rnk.profile_id=prof.profile_id AND rnk.strategy_name=:strategyName
								AND rnk.date=(SELECT MAX(date) FROM k3l_rank where strategy_name=:strategyName))
			WHERE 
				suggest.json_data->>'profile_id'::text=:id
			ORDER BY rnk.rank
			LIMIT :limit
		`, { strategyName, id, limit})
		return res.rows
	}

	static async getSimilarSuggestions(strategyName: string, id: number, limit: number): Promise<Profile[]> {
		const res = await db.raw(`
			SELECT 
				sg::text as id,
				prof.handle as handle,
				rnk.rank as rank
			FROM profile_suggests AS suggest
			CROSS JOIN LATERAL JSONB_ARRAY_ELEMENTS_TEXT(suggest.json_data->'suggest_profiles') AS sg 
			INNER JOIN k3l_profiles AS prof 
						ON prof.profile_id = sg::text
			INNER JOIN k3l_rank AS rnk 
						ON (rnk.profile_id=prof.profile_id AND rnk.strategy_name=:strategyName
								AND rnk.date=(SELECT MAX(date) FROM k3l_rank where strategy_name=:strategyName))
			WHERE 
				suggest.json_data->>'profile_id'::text=:id
			AND prof.profile_id != :id
			ORDER BY rnk.rank
		`, { strategyName, id, limit})
		return res.rows
	}

	static async getLatestDateByStrategyName(strategyName: string): Promise<string> {
		const { date } = await db('globaltrust')
			.where('strategy_name', strategyName)
			.max('date as date')
			.first()

		return date
	}

	static async getRawGlobaltrust(strategyName: string, limit ?: number): Promise<GlobalTrust<string>> {
		const q = db('globaltrust')
			.where({ strategyName })
			.select('v', 'i')
			.orderBy('v', 'desc')

		if (limit) {
			q.modify((q: any) => q.limit(limit))
		}

		const globaltrust = await q

		if (!globaltrust.length) {
			throw new Error(`No globaltrust found in DB for strategy name: ${strategyName}`)
		}

		return globaltrust
	}
	
}
