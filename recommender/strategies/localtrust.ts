import { LocalTrust } from '../../types'
import { getDB } from '../../utils';

export type LocaltrustStrategy = () => Promise<LocalTrust>
const db = getDB()

/**
 * Generates basic localtrust by transforming all existing connections
*/
const existingConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	const profiles = await db('profiles').select('id', 'followings')
	let localtrust: LocalTrust = []
	
	for (const profile of profiles) {
		for (const following of profile.followings) {
			localtrust.push({
				i: +profile.id,
				j: +following,
				v: 1
			})
		}
	}

	return localtrust
}

/**
 * Generates localtrust by taking into consuderation the number of likes between
 * two users.
*/
const enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	/**
	 * Generate comments data
	*/
	const comments = await db('comments')
		.select('from_profile', 'profile_id_pointed', db.raw('count(1) as count'))
		.groupBy('from_profile', 'profile_id_pointed')

	const maxComments = comments
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	let commentsMap: {[k: string]: {[v: string]: number}} = {}
	for (const { fromProfile, profileIdPointed, count } of comments) {
		commentsMap[fromProfile] = commentsMap[profileIdPointed] || {}
		commentsMap[fromProfile][profileIdPointed] = +count
	}

	/**
	 * Generate mirrors data
	*/
	const mirrors = await db('mirrors')
		.select('from_profile', 'profile_id_pointed', db.raw('count(1) as count'))
		.groupBy('from_profile', 'profile_id_pointed')

	const maxMirrors = mirrors
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	let mirrorsMap: {[k: string]: {[v: string]: number}} = {}
	for (const { fromProfile, profileIdPointed, count } of mirrors) {
		mirrorsMap[fromProfile] = mirrorsMap[profileIdPointed] || {}
		mirrorsMap[fromProfile][profileIdPointed] = +count
	}

	const localtrust: LocalTrust = []
	const profiles = await db('profiles').select('id', 'followings')
	
	for (const profile of profiles) {
		for (const following of profile.followings) {
			const commentsCount = commentsMap[profile.id] && commentsMap[profile.id][following] || 0
			const mirrorsCount = mirrorsMap[profile.id] && mirrorsMap[profile.id][following] || 0

			localtrust.push({
				i: +profile.id,
				j: +following,
				v: 3 * (commentsCount / maxComments) +
				   4 * (mirrorsCount / maxMirrors) +
				   1
			})
		}
	}

	return localtrust
}

export const strategies: Record<string, LocaltrustStrategy> = {
	existingConnections,
	enhancedConnections
}