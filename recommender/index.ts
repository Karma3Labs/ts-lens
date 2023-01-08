import  path from 'path'
import axios from "axios"
import { EthAddress, Follow, Pretrust, LocalTrust, GlobalTrust, Entry } from '../types'
import { getFollowersOfId, getAllFollows, objectFlip } from "./utils"
import { getDB } from '../utils'

const db = getDB()

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class Recommender {
	public follows: Follow[] = []
	public ids: string[] = []
	public idsToIndex: Record<string, number> = {}

	async init() {
		this.follows = await getAllFollows()
		this.ids = this.getUsersFromFollows(this.follows)
		this.idsToIndex = objectFlip(this.ids)

		console.log(`Loaded ${this.ids.length} profiles and ${this.follows.length} follows`)
	}

	async recommend(id: string, limit = 20) {
		const localtrust = await this.calculateLocalTrust(this.ids, this.follows)
		const pretrust = await this.calculatePretrust(id, this.ids, this.follows)

		const convertedLocaltrust = this.convertLocaltrustToIds(localtrust)
		const convertedPretrust = this.convertPretrustToIds(pretrust)

		const res = await this.requestEigentrust(
			convertedLocaltrust,
			convertedPretrust,
		)

		const globalTrust = this.convertGlobalTrustToAddresses(res);
		const globalTrustEntries: Entry[] = globalTrust.map((entry: GlobalTrust<EthAddress>[0]) => [entry.i, entry.v])
		globalTrustEntries.sort((a: Entry, b: Entry)  => b[1] - a[1]) 

		// //TODO: Pagination
		return globalTrustEntries.map(([address]) => address).slice(0, limit)

	}

	async recommendUsers(id: string, limit = 20) {
		const suggestions = await this.recommend(id, limit)
		return suggestions
	}

	/**
	 * Basic pretrust calculation. Just pre-trust all users the same.
	*/
	async calculatePretrust(address: string, users: EthAddress[], follows: Follow[]): Promise<Pretrust<EthAddress>> {
		const pretrust: Pretrust<string> = []
		const followers = await getFollowersOfId(address)
		followers.forEach((follower) => {
			pretrust.push({
				i: follower,
				v: 1 / followers.size
			})
		})

		return pretrust
	}

	/**
	 * Generates basic localtrust by transforming all existing connections
	*/
	async calculateLocalTrust(users: EthAddress[], follows: Follow[]): Promise<LocalTrust<string>> {
		const localTrust: LocalTrust<EthAddress> = []
		for (const { follower, followee } of follows) {
			localTrust.push({
				i: follower,
				j: followee,
				v: 1
			})
		}

		console.log(`Generated localtrust with ${localTrust.length} entries`)
		return localTrust
	}

	async requestEigentrust(localTrust: LocalTrust<number>, pretrust: Pretrust<number>) {
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
				alpha: 0.9
			})

			console.timeLog('calculation')
			return res.data.entries
		}
		catch (e) {
			throw new Error('Calculation did not succeed');
		}
	}

	/**
	 * Generate a list of users given all connections 
	 */
	private getUsersFromFollows(follows: Follow[]): string[] {
		// It seems that the users table doesn't contain all of the users in the follows table
		// That's why I construct the graph from the follows table
		const ids = new Set()
		for (const { follower, followee } of follows) {
			ids.add(follower)
			ids.add(followee)
		}

		return Array.from(ids) as string[]
	}


	/**
	 * Address to number conversions
	*/

	private convertLocaltrustToIds(localTrust: LocalTrust<string>): LocalTrust<number> {
		return localTrust.map(({ i, j, v }) => {
			return {
				i: +this.idsToIndex[i],
				j: +this.idsToIndex[j],
				v
			}
		}) 
	}
	
	private convertPretrustToIds(preTrust: Pretrust<EthAddress>): Pretrust<number> {
		return preTrust.map(({ i, v }) => {
			return {
				i: +this.idsToIndex[i],
				v
			}
		}) 
	}

	private convertGlobalTrustToAddresses(globalTrust: GlobalTrust<number>): GlobalTrust<string> {
		return globalTrust.map(({ i, v }) => {
			return {
				i: this.ids[i], 
				v
			}
		})
	}
}
