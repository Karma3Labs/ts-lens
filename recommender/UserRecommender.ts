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
	private strategyId: number
	private ltStrategyName: string
	private limitGlobaltrust: number

	private ids: number[] = []
	private initialtrust: Pretrust = []

	constructor(strategyId?: number, ltStrategyName?: string, limitGlobaltrust?: number) {
		this.strategyId = strategyId || config.personalization.globaltrust
		this.ltStrategyName = ltStrategyName || config.personalization.ltStrategyName
		this.limitGlobaltrust = limitGlobaltrust || config.personalization.limitGlobaltrust
	} 

	async init() {
		console.time("initializing user recommender")
		this.ids = await getIds()
		this.initialtrust = await Rankings.getRawGlobaltrust(this.strategyId, this.limitGlobaltrust)
		console.timeEnd("initializing user recommender")
	}

	async recommend(id: number, limit = 50) {
		const pretrust = await UserRecommender.getFollowsPretrust(id)
		const globaltrust = await UserRecommender.runEigentrust(this.ids, pretrust, this.ltStrategyName, this.initialtrust, 0.5, 2)

		return globaltrust.map(({ i }) => +i).slice(0, limit)
	}

	static async runEigentrust(ids: number[], pretrust: Pretrust, localtrustName: string, initialtrust: Pretrust, alpha: number, maxIterations: number): Promise<GlobalTrust> {
		const idsToIndex = objectFlip(ids)

		const convertedPretrust = pretrust.map(({ i, v }) => {
			return {
				i: +idsToIndex[i], v: +v 
			}
		}) 

		const convertedInitialtrust = initialtrust.map(({ i, v }) => {
			return {
				i: +idsToIndex[i], v: +v
			}
		})

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
		pretrust: Pretrust, 
		initialTrust: Pretrust,
		alpha: number,
		maxIterations: number): Promise<GlobalTrust> {
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

	static async getFollowsPretrust(profileId: number): Promise<Pretrust> {
		const follows = await db('profile_follows').where({ follower: profileId })

		return follows.map((f: any) => {
			return {
				i: +f.following,
				v: 1
			}
		})
	}

	static async getLocaltrust(ltStrategyId: number) {
		const localtrust = await db('localtrust').where({ strategyId: ltStrategyId })

		if (!localtrust.length) {
			throw new Error(`Localtrust with id ${ltStrategyId} does not exist`)
		}

		return localtrust
	}
}
