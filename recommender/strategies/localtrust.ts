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

	console.log('length of follows', follows.length)
	return follows
}

const getCommentCounts = async () => {
	const comments = await db('comments')
		.select('profile_id', 'to_profile_id', db.raw('count(1) as count'))
		.groupBy('profile_id', 'to_profile_id')

	let commentsMap: any = {}
	for (const { profileId, toProfileId, count } of comments) {
		commentsMap[profileId] = commentsMap[toProfileId] || {}
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
		mirrorsMap[profileId] = mirrorsMap[toProfileId] || {}
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
		collectsMap[fromProfileId] = collectsMap[toProfileId] || {}
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

	for (const { followerId, followingId } of follows) {
		const commentsCount = commentsMap && commentsMap[followerId] && commentsMap[followerId][followingId] || 0
		const mirrorsCount = mirrorsMap && mirrorsMap[followerId] && mirrorsMap[followerId][followingId] || 0
		const collectsCount = collectsMap && collectsMap[followerId] && collectsMap[followerId][followingId] || 0

		localtrust.push({
			i: followerId,
			j: followingId,
			v: commentsWeight * commentsCount +
			   mirrorsWeight * mirrorsCount +
			   collectsWeight * collectsCount +
			   followsWeight 
		})
	}

	return localtrust
}

const existingConnections = async (): Promise<LocalTrust> => {
	return getLocaltrust(1, 0, 0, 0)
}

const c5m8enhancedConnections = async (): Promise<LocalTrust> => {
	return getLocaltrust(1, 5, 8, 0)
}

const c5m8col10enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	return getLocaltrust(1, 5, 8, 10)
}

export const strategies: Record<string, LocaltrustStrategy> = {
	existingConnections,
	c5m8enhancedConnections,
	c5m8col10enhancedConnections
}