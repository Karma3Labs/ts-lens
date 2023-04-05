import { LocalTrust } from '../../types'
import { getDB } from '../../utils';

export type LocaltrustStrategy = () => Promise<LocalTrust>
const db = getDB()

type LocaltrustPrams = {
	followsWeight?: number,
	commentsWeight?: number,
	mirrorsWeight?: number,
	collectsWeight?: number,
	collectPriceWeight?: number
}

/**
 * Generates basic localtrust by transforming all existing connections
*/

const getFollows = async () => {
	const  { totalCount } = await db('follows').count('profile_id as totalCount').first()
	const follows = await db('follows')
		.select('profile_id as following_id', 'profiles.id as follower_id')
		.innerJoin('profiles', 'owner_address', 'follower_address')

	let followsMap: any = {}
	for (const { followerId, followingId } of follows) {
		followsMap[followerId] = followsMap[followerId] || []
		followsMap[followerId][followingId] = 1 / totalCount
	}

	return followsMap
}

const getCommentCounts = async () => {
	const { totalCount } = await db('comments').count('profile_id as totalCount').first()
	const comments = await db('comments')
		.select('profile_id', 'to_profile_id', db.raw('count(1) as count'))
		.groupBy('profile_id', 'to_profile_id')
	
	let commentsMap: any = {}
	for (const { profileId, toProfileId, count } of comments) {
		commentsMap[profileId] = commentsMap[profileId] || {}
		commentsMap[profileId][toProfileId] = +count / totalCount
	}

	console.log('length of comments', comments.length)
	return commentsMap
}

const getMirrorCounts = async () => {
	const { totalCount } = await db('mirrors').count('profile_id as totalCount').first()
	const mirrors = await db('mirrors')
		.select('profile_id', 'to_profile_id', db.raw('count(1) as count'))
		.groupBy('profile_id', 'to_profile_id')

	let mirrorsMap: any = {}
	for (const { profileId, toProfileId, count } of mirrors) {
		mirrorsMap[profileId] = mirrorsMap[profileId] || {}
		mirrorsMap[profileId][toProfileId] = +count / totalCount
	}

	console.log('length of mirrors', mirrors.length)
	return mirrorsMap
}

const getCollectCounts = async () => {
	const { totalCount } = await db('collects').count('profile_id as totalCount').first()
	const collects = await db('collects')
		.select('profile_id as to_profile_id', 'profiles.id as from_profile_id', db.raw('count(1) as count'))
		.innerJoin('profiles', 'collector_address', 'owner_address')
		.groupBy('profile_id', 'profiles.id')

	let collectsMap: any = {}
	for (const { fromProfileId, toProfileId, count } of collects) {
		collectsMap[fromProfileId] = collectsMap[fromProfileId] || {}
		collectsMap[fromProfileId][toProfileId] = +count / totalCount
	}

	console.log('length of collects', collects.length)
	return collectsMap
}

const getCollectPrices = async () => {
	const collects = await db('collects')
		.select('profile_id as to_profile_id', 'profiles.id as from_profile_id', db.raw('sum(price) as price'))
		.innerJoin('profiles', 'collector_address', 'owner_address')
		.groupBy('profile_id', 'profiles.id')

	const { min, max, avg } = await db.with('coll', (q: any) => q.from('collects')
			.select('profile_id as to_profile_id', 'profiles.id as from_profile_id', db.raw('sum(price) as price'))
			.innerJoin('profiles', 'collector_address', 'owner_address')
			.groupBy('profile_id', 'profiles.id')
			.where('price', '>', 0)
		)
		.select(db.raw('min(price) as min'), db.raw('max(price) as max'), db.raw('avg(price) as avg'))
		.from('coll').first()
	
	let collectsMap: any = {}

	for (const { fromProfileId, toProfileId, price } of collects) {
		collectsMap[fromProfileId] = collectsMap[fromProfileId] || {}
		collectsMap[fromProfileId][toProfileId] = +price ? ((+price - +min) / (+max - +min)) : +avg
	}

	console.log('length of collects', collects.length)
	return collectsMap
}

const getLocaltrust = async ({followsWeight, commentsWeight, mirrorsWeight, collectsWeight, collectPriceWeight }: LocaltrustPrams): Promise<LocalTrust> => {
	const follows = followsWeight ? await getFollows() : null
	const commentsMap = commentsWeight ? await getCommentCounts() : null
	const mirrorsMap = mirrorsWeight ? await getMirrorCounts() : null
	const collectsMap = collectsWeight ? await getCollectCounts() : null
	const collectsPriceMap = collectPriceWeight ? await getCollectPrices() : null

	let localtrust: LocalTrust = []

	const from = new Set([
		...Object.keys(follows || {}),
		...Object.keys(commentsMap || {}),
		...Object.keys(mirrorsMap || {}),
		...Object.keys(collectsMap || {})
	])

	for (const id1 of from) {
		const to = new Set([
			...Object.keys(follows && follows[+id1] || {}),
			...Object.keys(commentsMap && commentsMap[+id1] || {}),
			...Object.keys(mirrorsMap && mirrorsMap[+id1] || {}),
			...Object.keys(collectsMap && collectsMap[+id1] || {})
		])

		for (const id2 of to) {
			const follow = follows && follows[+id1] && follows[+id1][+id2] || 0
			const commentsCount = commentsMap && commentsMap[+id1] && commentsMap[+id1][+id2] || 0
			const mirrorsCount = mirrorsMap && mirrorsMap[+id1] && mirrorsMap[+id1][+id2] || 0
			const collectsCount = collectsMap && collectsMap[+id1] && collectsMap[+id1][+id2] || 0
			const collectPrice = collectsPriceMap && collectsPriceMap[+id1] && collectsPriceMap[+id1][+id2] || 0
			
			localtrust.push({
				i: +id1,
				j: +id2,
				v: (followsWeight || 0) * follow +
				(commentsWeight || 0) * commentsCount +
				(mirrorsWeight || 0) * mirrorsCount + 
				(collectsWeight || 0) * collectsCount +
				(collectPriceWeight || 0) * collectPrice
			})
		}
	}

	console.timeEnd('localtrust')
	console.log('Length of localtrust', localtrust.length)

	return localtrust
}

const existingConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	return getLocaltrust({ followsWeight: 1 })
}

const f6c3m8enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	return getLocaltrust({ followsWeight: 6, commentsWeight: 3, mirrorsWeight: 8 })
}

const f6c3m8col12enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	return getLocaltrust({ followsWeight: 6, commentsWeight: 3, mirrorsWeight: 8, collectsWeight: 12 })
}

const f6c3m8col12PriceEnhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	return getLocaltrust({ followsWeight: 6, commentsWeight: 3, mirrorsWeight: 8, collectPriceWeight: 12 })
}

export const strategies: Record<string, LocaltrustStrategy> = {
	existingConnections,
	f6c3m8enhancedConnections,
	f6c3m8col12enhancedConnections,
	f6c3m8col12PriceEnhancedConnections
}