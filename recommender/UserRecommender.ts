import  path from 'path'
import axios from "axios"
import { Pretrust, LocalTrust, GlobalTrust } from '../types'
import { getIds, objectFlip } from "./utils"
import { getDB } from '../utils'
import Rankings from './RankingsRecommender'
import { config } from './config'
const db = getDB()

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class UserRecommender {
	private rankingsStrategyName: string
	private ltStrategyName: string
	private limitGlobaltrust: number

	private ids: string[] = []
	private initialtrust: Pretrust<string> = []

	constructor(rankingsStrategyName?: string, ltStrategyName?: string, limitGlobaltrust?: number) {
		this.rankingsStrategyName = rankingsStrategyName || config.personalization.globaltrust
		this.ltStrategyName = ltStrategyName || config.personalization.ltStrategyName
		this.limitGlobaltrust = limitGlobaltrust || config.personalization.limitGlobaltrust
	} 

	async init() {
		console.time("initializing user recommender")
		this.ids = await getIds()
		this.initialtrust = await Rankings.getRawGlobaltrust(this.rankingsStrategyName, this.limitGlobaltrust)
		console.timeEnd("initializing user recommender")
	}

	async recommend(id: number, limit = 50, alpha = 0.8) {
		const pretrust = await UserRecommender.getFollowsPretrust(id)
		const globaltrust = await UserRecommender.runEigentrust(this.ids, pretrust, this.ltStrategyName, this.initialtrust, alpha, 2)

		return globaltrust.map(({ i }) => i).slice(0, limit)
	}

	static async runEigentrust(ids: string[], pretrust: Pretrust<string>, localtrustName: string, initialtrust: Pretrust<string>, alpha: number, maxIterations: number): Promise<GlobalTrust<string>> {
		const idsToIndex = objectFlip(ids)

		const convertedPretrust = pretrust.map(({ i, v }) => {
			return {
				i: +idsToIndex[i], v: +v 
			}
		}) as Pretrust<number>

		const convertedInitialtrust = initialtrust.map(({ i, v }) => {
			return {
				i: +idsToIndex[i], v: +v
			}
		}) as Pretrust<number>

		const res = await this.requestEigentrust(
			ids.length,
			localtrustName,
			convertedPretrust,
			convertedInitialtrust,
			alpha,
			maxIterations
		)

		const parsedGlobaltrust = res.map(({ i, v }) => {
			return {
				i: ids[i],
				v: +v
			}
		})

		return parsedGlobaltrust.sort((a, b) => b.v - a.v)
	}

	static async requestEigentrust(
		peersCount: number,
		localTrustName: string,
		pretrust: Pretrust<number>, 
		initialTrust: Pretrust<number>,
		alpha: number,
		maxIterations: number): Promise<GlobalTrust<number>> {
		try {
			console.time('calculation')

			const opts: any = {
				localTrust: {
					scheme: 'stored',
					id: localTrustName,
				},
				pretrust: {
					scheme: 'inline',
					size: peersCount,
					entries: pretrust,
				},
				initialTrust: {
					scheme: 'inline',
					size: peersCount,
					entries: initialTrust,
				},
				maxIterations,
				alpha: alpha,
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

	static async getFollowsPretrust(profileId: number): Promise<Pretrust<string>> {
		const follows = await db('k3l_follows').where({  profileId })
		console.log(follows.length)
		const f = follows.map((f: any) => {
			return {
				i: f.toProfileId,
				v: 1
			}
		})

		console.log(f)
		return f
	}

	static async getLocaltrust(ltStrategyId: number, schema: string = "public") {
		const localtrust = await db(`${schema}.localtrust`).where({ strategyId: ltStrategyId })

		if (!localtrust.length) {
			throw new Error(`Localtrust with id ${ltStrategyId} does not exist`)
		}

		return localtrust
	}
}
