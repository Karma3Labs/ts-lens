import  path from 'path'
import axios from "axios"
import { Follow, Pretrust, LocalTrust, GlobalTrust, Entry } from '../types'
import { getAllFollows, objectFlip } from "./utils"
import { PretrustPicker, PretrustStrategy, strategies as pretrustStrategies } from './strategies/pretrust'
import { LocaltrustStrategy, strategies as localStrategies } from './strategies/localtrust'
import { getDB } from '../utils'

const db = getDB()

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class Recommender {
	public follows: Follow[] = []
	public handles: string[] = []
	public handlesToIndex: Record<string, number> = {}
	public localtrustPicker: LocaltrustStrategy = localStrategies.existingConnections

	public pretrustPicker: PretrustPicker = pretrustStrategies.pretrustAllEqually.picker
	public personalized = pretrustStrategies.pretrustAllEqually.personalized

	public globaltrust: GlobalTrust<string> = []

	async init(pretrustPicker: PretrustStrategy, localtrustPicker = localStrategies.follows) {
		this.follows = await getAllFollows()
		this.handles = this.getUsersFromFollows(this.follows)
		this.handlesToIndex = objectFlip(this.handles)

		this.localtrustPicker = localtrustPicker

		this.pretrustPicker = pretrustPicker.picker
		this.personalized = pretrustPicker.personalized

		if (!this.personalized) {
			console.log('Since the strategy is not personalized, we can precompute the global trust')
			this.globaltrust = await this.runEigentrust()
		}

		console.log(`Loaded ${this.handles.length} profiles and ${this.follows.length} follows`)
	}

	async recommend(handle: string, limit = 20) {
		if (this.personalized) {	
			this.globaltrust = await this.runEigentrust(handle)
		}

		const globalTrustEntries: Entry[] = this.globaltrust.map((entry: GlobalTrust<string>[0]) => [entry.i, entry.v])
		globalTrustEntries.sort((a: Entry, b: Entry)  => b[1] - a[1]) 
		console.log('globalTrustEntries', globalTrustEntries)

		// TODO: Pagination
		return globalTrustEntries.map(([address]) => address).slice(0, limit)
	}

	private runEigentrust = async (handle?: string): Promise<GlobalTrust<string>> => {
		const pretrust = await this.pretrustPicker(handle)
		this.assertPretrustIsCorrect(pretrust, this.handles)
		const convertedPretrust = this.convertPretrustToIds(pretrust)
		console.log(`Generated pretrust with ${pretrust.length} entries`)

		console.log('generating localtrust')
		const localtrust = await this.localtrustPicker(this.follows)
		console.log('asserting localtrust correct')

		// Omit for now, since it is time consuming
		// this.assertLocaltrustIsCorrect(localtrust, this.handles)

		const convertedLocaltrust = this.convertLocaltrustToIds(localtrust)
		console.log(`Generated localtrust with ${localtrust.length} entries`)

		const res = await this.requestEigentrust(
			convertedLocaltrust,
			convertedPretrust,
		)

		return this.convertGlobalTrustToAddresses(res);
	}

	async requestEigentrust(localTrust: LocalTrust<number>, pretrust: Pretrust<number>) {
		try {
			console.time('calculation')

			const eigentrustAPI = `${process.env.EIGENTRUST_API}/basic/v1/compute`
			const res = await axios.post(eigentrustAPI, {
				localTrust: {
					scheme: 'inline',
					size: this.handles.length,
					entries: localTrust,
				},
				pretrust: {
					scheme: 'inline',
					size: this.handles.length,
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
		const handles = new Set()
		for (const { follower, followee } of follows) {
			handles.add(follower)
			handles.add(followee)
		}

		return Array.from(handles) as string[]
	}


	/**
	 * Address to number conversions
	*/

	private convertLocaltrustToIds(localTrust: LocalTrust<string>): LocalTrust<number> {
		return localTrust.map(({ i, j, v }) => {
			return {
				i: +this.handlesToIndex[i],
				j: +this.handlesToIndex[j],
				v
			}
		}) 
	}
	
	private convertPretrustToIds(preTrust: Pretrust<string>): Pretrust<number> {
		return preTrust.map(({ i, v }) => {
			return {
				i: +this.handlesToIndex[i],
				v
			}
		}) 
	}

	private convertGlobalTrustToAddresses(globalTrust: GlobalTrust<number>): GlobalTrust<string> {
		return globalTrust.map(({ i, v }) => {
			return {
				i: this.handles[i], 
				v
			}
		})
	}

	private assertLocaltrustIsCorrect = (pretrust: LocalTrust<string>, handles: string[]) => {
		const correct = pretrust.every(r => handles.includes(r.i) && handles.includes(r.j))
		if (!correct) {
			throw Error('Localtrust includes values that are not in valid handles')
		}
	}

	private assertPretrustIsCorrect = (pretrust: Pretrust<string>, handles: string[]) => {
		let correct = true
		for (const { i } of pretrust) {
			if (!handles.includes(i)) {
				console.log('Handle provided in pretrust does not exist in handles list', i)
				correct = false
			}
		}

		if (!correct) {
			throw Error('Pretrust includes values that are not in valid handles')
		}
	}

}
