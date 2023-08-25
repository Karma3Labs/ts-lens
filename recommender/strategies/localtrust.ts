import { LocalTrust } from '../../types'
import { getDB } from '../../utils';

export type LocaltrustStrategy = () => Promise<LocalTrust<string>>
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
	const  { totalCount } = await db('k3l_follows').count('profile_id as totalCount').first()

	const follows = await db('k3l_follows')
		.select('profile_id', 'to_profile_id')

	console.time('parsing follows')
	let followsMap: any = {}
	for (const { profileId, toProfileId } of follows) {
		followsMap[profileId] = followsMap[profileId] || []
		followsMap[profileId][toProfileId] = 1 / totalCount
	}
	console.timeEnd('parsing follows')

	return followsMap
}

const getCommentCounts = async () => {
	const { totalCount } = await db('k3l_comments').count('profile_id as totalCount').first()
	const comments = await db('k3l_comments')
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
	const { totalCount } = await db('k3l_mirrors').count('profile_id as totalCount').first()
	const mirrors = await db('k3l_mirrors')
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
	const { totalCount } = await db('k3l_collect_nft').count('profile_id as totalCount').first()
	const collects = await db('k3l_collect_nft')
		.select('profile_id', 'to_profile_id', db.raw('count(1) as count'))
		.groupBy('profile_id', 'to_profile_id')

	let collectsMap: any = {}
	for (const { profileId, toProfileId, count } of collects) {
		collectsMap[profileId] = collectsMap[profileId] || {}
		collectsMap[profileId][toProfileId] = +count / totalCount
	}

	console.log('length of collects', collects.length)
	return collectsMap
}

const getCollectsPrice = async () => {
	const { avg } = await db('k3l_collect_nft').avg('matic_price as avg').first()
	const collects = await db('k3l_collect_nft').select('profile_id', 'to_profile_id', 'matic_price')

	let collectsMap: any = {}
	for (const { profileId, toProfileId, maticPrice } of collects) {
		const price = +maticPrice || +avg
		collectsMap[profileId] = collectsMap[profileId] || {}
		collectsMap[profileId][toProfileId] = collectsMap[profileId][toProfileId] + price || +price
	}

	return collectsMap
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

export const strategies: Record<string, LocaltrustStrategy> = {
	existingConnections,
	f6c3m8enhancedConnections,
	f6c3m8col12enhancedConnections,
	f6c3m8col12Price
}