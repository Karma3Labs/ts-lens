import { LocalTrust } from '../../types'
import { getDB } from '../../utils';

export type LocaltrustStrategy = () => Promise<LocalTrust>
const db = getDB()

/**
 * Generates basic localtrust by transforming all existing connections
*/

const getFollows = async () => {
	const follows = await db('follows')
	.select('profile_id as following_id', 'profiles.id as follower_id')
	.innerJoin('profiles', 'owner_address', 'follower_address')

	let followsMap: any = {}
	for (const { followerId, followingId } of follows) {
		followsMap[followerId] = followsMap[followerId] || []
		followsMap[followerId][followingId] = 1
	}
	return followsMap
}

const getCommentCounts = async () => {
	const comments = await db('comments')
		.select('profile_id', 'to_profile_id', db.raw('count(1) as count'))
		.groupBy('profile_id', 'to_profile_id')

	let commentsMap: any = {}
	for (const { profileId, toProfileId, count } of comments) {
		commentsMap[profileId] = commentsMap[profileId] || {}
		commentsMap[profileId][toProfileId] = +count
	}

	console.log('length of comments', comments.length)
	return commentsMap
}

const getMirrorCounts = async () => {
	const mirrors = await db('mirrors')
		.select('profile_id', 'to_profile_id', db.raw('count(1) as count'))
		.groupBy('profile_id', 'to_profile_id')

	let mirrorsMap: any = {}
	for (const { profileId, toProfileId, count } of mirrors) {
		mirrorsMap[profileId] = mirrorsMap[profileId] || {}
		mirrorsMap[profileId][toProfileId] = +count
	}

	console.log('length of mirrors', mirrors.length)
	return mirrorsMap
}

const getCollectCounts = async () => {
	const collects = await db('collects')
		.select('profile_id as to_profile_id', 'profiles.id as from_profile_id', db.raw('count(1) as count'))
		.innerJoin('profiles', 'collector_address', 'owner_address')
		.groupBy('profile_id', 'profiles.id')

	let collectsMap: any = {}
	for (const { fromProfileId, toProfileId, count } of collects) {
		collectsMap[fromProfileId] = collectsMap[fromProfileId] || {}
		collectsMap[fromProfileId][toProfileId] = +count
	}

	console.log('length of collects', collects.length)
	return collectsMap
}

const getLocaltrust = async (followsWeight: number, commentsWeight: number, mirrorsWeight: number, collectsWeight: number) => {
	const follows = followsWeight > 0 ? await getFollows() : null
	const commentsMap = commentsWeight > 0 ? await getCommentCounts() : null
	const mirrorsMap = mirrorsWeight > 0 ? await getMirrorCounts() : null
	const collectsMap = collectsWeight > 0 ? await getCollectCounts() : null

	let localtrust: LocalTrust = []

	const from = [
		...new Set([
			...Object.keys(follows || {}),
			...Object.keys(commentsMap || {}),
			...Object.keys(mirrorsMap || {}),
			...Object.keys(collectsMap || {})
		])
	]

	for (const id1 of from) {
		const to = [
			...new Set([
				...Object.keys(follows && follows[+id1] || {}),
				...Object.keys(commentsMap && commentsMap[+id1] || {}),
				...Object.keys(mirrorsMap && mirrorsMap[+id1] || {}),
				...Object.keys(collectsMap && collectsMap[+id1] || {})
			])
		]

		for (const id2 of to) {
			const follow = follows && follows[+id1] && follows[+id1][+id2] || 0
			const commentsCount = commentsMap && commentsMap[+id1] && commentsMap[+id1][+id2] || 0
			const mirrorsCount = mirrorsMap && mirrorsMap[+id1] && mirrorsMap[+id1][+id2] || 0
			const collectsCount = collectsMap && collectsMap[+id1] && collectsMap[+id1][+id2] || 0
			
			localtrust.push({
				i: +id1,
				j: +id2,
				v: commentsWeight * commentsCount +
				mirrorsWeight * mirrorsCount +
				collectsWeight * collectsCount +
				followsWeight * follow
			})
		}
	}

	console.timeEnd('localtrust')
	console.log('Length of localtrust', localtrust.length)

	return localtrust
}

const existingConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	return getLocaltrust(1, 0, 0, 0)
}

const c5m8enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	return getLocaltrust(1, 5, 8, 0)
}

const c5m8col12enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	return getLocaltrust(1, 5, 8, 12)
}

export const strategies: Record<string, LocaltrustStrategy> = {
	existingConnections,
	c5m8enhancedConnections,
	c5m8col12enhancedConnections
}