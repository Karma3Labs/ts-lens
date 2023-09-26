import { LocalTrust, FollowsMap, CommentCountsMap, MirrorCountsMap, CollectsCountsMap, CollectsPriceMap } from '../../types'
import { getDB } from '../../utils';

export type LocaltrustStrategy = () => Promise<LocalTrust<string>>
const db = getDB()

let cachedFollows: FollowsMap | null = null;
let cachedCommentCounts: CommentCountsMap | null = null;
let cachedMirrorCounts: MirrorCountsMap | null = null;
let cachedCollectsCounts: CollectsCountsMap | null = null;
let cachedCollectsPrice: CollectsPriceMap | null = null;

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

const getFollows = async (): Promise<FollowsMap> => {
	if (cachedFollows) {
		console.log('Returning cachedFollows')
		return cachedFollows
	}

	console.time('getFollows')
	const  { totalCount } = await db('k3l_follows').count('profile_id as totalCount').first()
	const follows = await db('k3l_follows')
		.select('profile_id', 'to_profile_id')

	let followsMap: FollowsMap = {}
	for (const { profileId, toProfileId } of follows) {
		followsMap[profileId] = followsMap[profileId] || []
		followsMap[profileId][toProfileId] = 1 / totalCount
	}

	console.log('Length of follows', follows.length)
	cachedFollows = followsMap;

	console.timeEnd('getFollows')
	return followsMap
}

const getCommentCounts = async (): Promise<CommentCountsMap> => {
	if (cachedCommentCounts) {
		console.log('Returning cachedCommentCounts')
		return cachedCommentCounts
	}

	console.time('getCommentCounts')
	const { totalCount } = await db('k3l_comments').count('profile_id as totalCount').first()
	const comments = await db('k3l_comments')
		.select('profile_id', 'to_profile_id', db.raw('count(1) as count'))
		.groupBy('profile_id', 'to_profile_id')
	
	let commentsMap: CommentCountsMap = {}
	for (const { profileId, toProfileId, count } of comments) {
		commentsMap[profileId] = commentsMap[profileId] || {}
		commentsMap[profileId][toProfileId] = +count / totalCount
	}

	console.log('Length of comments', comments.length)
	cachedCommentCounts = commentsMap;

	console.timeEnd('getCommentCounts')
	return commentsMap
}

const getMirrorCounts = async (): Promise<MirrorCountsMap> => {
    if (cachedMirrorCounts) {
		console.log('Returning cachedMirrorCounts')
        return cachedMirrorCounts;
    }

	console.time('getMirrorCounts')
	const { totalCount } = await db('k3l_mirrors').count('profile_id as totalCount').first()
	const mirrors = await db('k3l_mirrors')
		.select('profile_id', 'to_profile_id', db.raw('count(1) as count'))
		.groupBy('profile_id', 'to_profile_id')

	let mirrorsMap: MirrorCountsMap = {}
	for (const { profileId, toProfileId, count } of mirrors) {
		mirrorsMap[profileId] = mirrorsMap[profileId] || {}
		mirrorsMap[profileId][toProfileId] = +count / totalCount
	}

	console.log('Length of mirrors', mirrors.length)
    cachedMirrorCounts = mirrorsMap;

	console.timeEnd('getMirrorCounts')
	return mirrorsMap
}

const getCollectCounts = async () => {
    if (cachedCollectsCounts) {
		console.log('Returning cachedCollectsCounts')
        return cachedCollectsCounts;
    }

	console.time('getCollectCounts')
	const { totalCount } = await db('k3l_collect_nft').count('profile_id as totalCount').first()
	const collects = await db('k3l_collect_nft')
		.select('profile_id', 'to_profile_id', db.raw('count(1) as count'))
		.groupBy('profile_id', 'to_profile_id')

	let collectsMap: any = {}
	for (const { profileId, toProfileId, count } of collects) {
		collectsMap[profileId] = collectsMap[profileId] || {}
		collectsMap[profileId][toProfileId] = +count / totalCount
	}

	console.log('Length of collects', collects.length)
    cachedCollectsCounts = collectsMap;

	console.timeEnd('getCollectCounts')
	return collectsMap
}

const getCollectsPrice = async () => {
    if (cachedCollectsPrice) {
		console.log('Returning cachedCollectsPrice')
        return cachedCollectsPrice;
    }

	console.time('getCollectsPrice')
	const { avg } = await db('k3l_collect_nft').avg('matic_price as avg').first()
	const collects = await db('k3l_collect_nft').select('profile_id', 'to_profile_id', 'matic_price')

	let collectsMap: any = {}
	for (const { profileId, toProfileId, maticPrice } of collects) {
		const price = +maticPrice || +avg
		collectsMap[profileId] = collectsMap[profileId] || {}
		collectsMap[profileId][toProfileId] = collectsMap[profileId][toProfileId] + price || +price
	}

	console.log('Length of collects price', collects.length)
    cachedCollectsPrice = collectsMap;

	console.timeEnd('getCollectsPrice')
	return collectsMap;
}

const getLocaltrust = async ({followsWeight, commentsWeight, mirrorsWeight, collectsWeight}: LocaltrustPrams, withPrice = false): Promise<LocalTrust<string>> => {
	const follows = followsWeight ? await getFollows() : null
	const commentsMap = commentsWeight ? await getCommentCounts() : null
	const mirrorsMap = mirrorsWeight ? await getMirrorCounts() : null
	const collectsMap = collectsWeight ? (withPrice ? await getCollectsPrice() : await getCollectCounts()) : null

	let localtrust: LocalTrust<string> = []

	const from = new Set([
		...Object.keys(follows || {}),
		...Object.keys(commentsMap || {}),
		...Object.keys(mirrorsMap || {}),
		...Object.keys(collectsMap || {}),
	])

	for (const i of from) {
		const to = new Set([
			...Object.keys(follows && follows[i] || {}),
			...Object.keys(commentsMap && commentsMap[i] || {}),
			...Object.keys(mirrorsMap && mirrorsMap[i] || {}),
			...Object.keys(collectsMap && collectsMap[i] || {}),
		])

		for (const j of to) {
			if (i === j) continue
			const follow = follows && follows[i] && follows[i][j] || 0
			const commentsCount = commentsMap && commentsMap[i] && commentsMap[i][j] || 0
			const mirrorsCount = mirrorsMap && mirrorsMap[i] && mirrorsMap[i][j] || 0
			const collectsCount = collectsMap && collectsMap[i] && collectsMap[i][j] || 0
			
			localtrust.push({
				i,
				j,
				v: (followsWeight || 0) * follow +
				(commentsWeight || 0) * commentsCount +
				(mirrorsWeight || 0) * mirrorsCount + 
				(collectsWeight || 0) * collectsCount
			})
		}
	}

	console.log('Length of localtrust', localtrust.length)

	return localtrust
}

const existingConnections: LocaltrustStrategy = async (): Promise<LocalTrust<string>> => {
	return getLocaltrust({ followsWeight: 1 })
}

const f6c3m8enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust<string>> => {
	return getLocaltrust({ followsWeight: 6, commentsWeight: 3, mirrorsWeight: 8 })
}

const f6c3m8col12enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust<string>> => {
	return getLocaltrust({ followsWeight: 6, commentsWeight: 3, mirrorsWeight: 8, collectsWeight: 12 })
}

const f6c3m8col12Price: LocaltrustStrategy = async (): Promise<LocalTrust<string>> => {
	return getLocaltrust({ followsWeight: 6, commentsWeight: 3, mirrorsWeight: 8, collectsWeight: 12 }, true)
}

const f0c3m8col12enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust<string>> => {
	return getLocaltrust({ commentsWeight: 3, mirrorsWeight: 8, collectsWeight: 12 })
}

export const strategies: Record<string, LocaltrustStrategy> = {
	existingConnections,
	f6c3m8enhancedConnections,
	f6c3m8col12enhancedConnections,
	f6c3m8col12Price,
	f0c3m8col12enhancedConnections
}