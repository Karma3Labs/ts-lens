import { LocalTrust } from '../../types'
import { getDB } from '../../utils';

export type LocaltrustStrategy = () => Promise<LocalTrust>
const db = getDB()

/**
 * Generates basic localtrust by transforming all existing connections
*/

const existingConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	const follows = await db('follows')
		.select('id as follower_id', db.raw('unnest(profile_ids) as following_id'))
		.innerJoin('profiles', 'profiles._to', 'follows.follower')

	const localtrust: LocalTrust = []
	for (const { followerId, followingId } of follows) {
		localtrust.push({
			i: followerId,
			j: followingId,
			v: 1
		})
	}

	return []
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
		.select('profile_id', 'profile_id_pointed', db.raw('count(1) as count'))
		.groupBy('profile_id', 'profile_id_pointed')

	const maxComments = comments
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	let commentsMap: any = {}
	for (const { profileId, profileIdPointed, count } of comments) {
		commentsMap[profileId] = commentsMap[profileIdPointed] || {}
		commentsMap[profileId][profileIdPointed] = +count
	}
	console.log('length of comments', comments.length)

	/**
	 * Generate mirrors data
	*/
	const mirrors = await db('mirrors')
		.select('profile_id', 'profile_id_pointed', db.raw('count(1) as count'))
		.groupBy('profile_id', 'profile_id_pointed')
	console.log('length of mirrors', mirrors.length)

	const maxMirrors = mirrors
		.reduce((max: number, { count }: {count: number}) =>
		Math.max(max, count), 0)

	let mirrorsMap: any = {}
	for (const { profileId, profileIdPointed, count } of mirrors) {
		mirrorsMap[profileId] = mirrorsMap[profileIdPointed] || {}
		mirrorsMap[profileId][profileIdPointed] = +count
	}

	const localtrust: LocalTrust = []

	const follows = await db('follows')
		.select('id as follower_id', db.raw('unnest(profile_ids) as following_id'))
		.innerJoin('profiles', 'profiles._to', 'follows.follower')

	for (const { followerId, followingId } of follows) {
		const commentsCount = commentsMap[followerId] && commentsMap[followerId][followingId] || 0
		const mirrorsCount = mirrorsMap[followerId] && mirrorsMap[followerId][followingId] || 0

		localtrust.push({
			i: followerId,
			j: followingId,
			v: 5 * (commentsCount / maxComments) + 
			   8 * mirrorsCount / maxMirrors +
			   1
		})
	}
	
	console.log('length of localtrust', localtrust.length)

	return localtrust
}

export const strategies: Record<string, LocaltrustStrategy> = {
	existingConnections,
	enhancedConnections
}