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
	withPrice?: boolean,
	withTimeDecay?: boolean
}

// TODO define a proper type instead of any
let ijfollows:any
let ijcomments:any
let ijmirrors:any
let ijcollects:any
let ijprices:any

/**
 * Generates basic localtrust by transforming all existing connections
*/


const getFollows = async () => {

	if (ijfollows) {
		return ijfollows
	} 

	console.time('fetching follows')
	const res = await db.raw(`
		SELECT 
			f.profile_id,
			f.to_profile_id,
			POWER(1-(1/52::numeric),
							(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - TO_TIMESTAMP(max(p.source_timestamp)/1000))) / (60 * 60 * 24))::numeric
							) AS v
		FROM k3l_follows AS f
		INNER JOIN profile_post AS p ON (p.profile_id=f.to_profile_id)
		GROUP BY f.profile_id, f.to_profile_id
	`)
	const follows = res.rows
	console.timeEnd('fetching follows')

	console.time('parsing follows')
	// // const follows = await db('k3l_follows')
	// // 	.select('profile_id', 'to_profile_id', db)

	ijfollows = {}
	for (const { profileId, toProfileId, v } of follows) {
		ijfollows[profileId] = ijfollows[profileId] || []
		ijfollows[profileId][toProfileId] = {v: +v}
	}
	console.timeEnd('parsing follows')

	return ijfollows
}

const getIJCounts = async (ijTableName: string) => {
	console.time(`fetching ${ijTableName}`)
	const res = await db.raw(`
		SELECT 
			profile_id, to_profile_id,
			SUM(power(1-(1/52::numeric),
							(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / (60 * 60 * 24))::numeric)) as v,
			count(1) as count
		FROM ${ijTableName} 
		GROUP BY profile_id, to_profile_id
	`)
	const reactions = res.rows
	console.timeEnd(`fetching ${ijTableName}`)

	console.time(`parsing ${ijTableName}`)
	// const comments = await db('k3l_comments')
	// 	.select('profile_id', 'to_profile_id', db.raw('count(1) as count'))
	// 	.groupBy('profile_id', 'to_profile_id')
	
	const ijreactions:any = {}
	for (const { profileId, toProfileId, v, count } of reactions) {
		ijreactions[profileId] = ijreactions[profileId] || {}
		ijreactions[profileId][toProfileId] = {v: +v, count: +count }
	}
	console.timeEnd(`parsing ${ijTableName}`)

	console.log(`length of ${ijTableName}`, reactions.length)
	return ijreactions

}

const getCommentCounts = async () => {
	if (ijcomments) {
		return ijcomments
	}
	ijcomments = await getIJCounts('k3l_comments')
	return ijcomments
}

const getMirrorCounts = async () => {
	if (ijmirrors) {
		return ijmirrors
	}
	ijmirrors = await getIJCounts('k3l_mirrors')
	return ijmirrors
}

const getCollectCounts = async () => {
	if (ijcollects) {
		return ijcollects
	}
	ijcollects = await getIJCounts('k3l_collect_nft')
	return ijcollects
}

const getCollectsPrice = async () => {

	if (ijprices) {
		return ijprices
	}

	console.time('fetching prices')
	const res = await db.raw(`
		SELECT 
			profile_id, to_profile_id,
			SUM(CASE WHEN (matic_price IS NULL OR matic_price = 0) 
						THEN 1e-20 
						ELSE matic_price
					END) AS v,
			count(1) as count
		FROM k3l_collect_nft 
		GROUP BY profile_id, to_profile_id
	`)
	const prices = res.rows
	console.timeEnd('fetching prices')

	console.time('parsing prices')
	ijprices = {}
	for (const { profileId, toProfileId, v, count } of prices) {
		ijprices[profileId] = ijprices[profileId] || {}
		ijprices[profileId][toProfileId] = {v: +v, count: +count }
	}
	console.timeEnd('parsing prices')
	console.log('length of prices', prices.length)
	return ijprices
}

const getLocaltrust = async (
		{
			followsWeight, 
			commentsWeight, 
			mirrorsWeight, 
			collectsWeight, 
			withPrice, 
			withTimeDecay}: LocaltrustPrams
	): Promise<LocalTrust<string>> => {

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
			const followsCount = 
				follows && follows[i] && follows[i][j] ? (withTimeDecay ? follows[i][j].v : 1) : 0
			const commentsCount = 
				commentsMap && commentsMap[i] && commentsMap[i][j] ? 
					(withTimeDecay ? commentsMap[i][j].v : commentsMap[i][j].count) : 0
			const mirrorsCount = 
				mirrorsMap && mirrorsMap[i] && mirrorsMap[i][j] ?
					(withTimeDecay ? mirrorsMap[i][j].v : mirrorsMap[i][j].count) : 0
			const collectsCount = 
				collectsMap && collectsMap[i] && collectsMap[i][j] ?
					(withTimeDecay || withPrice ? collectsMap[i][j].v : collectsMap[i][j].count) : 0
			
			localtrust.push({
				i,
				j,
				v: (followsWeight || 0) * followsCount +
				(commentsWeight || 0) * commentsCount +
				(mirrorsWeight || 0) * mirrorsCount + 
				(collectsWeight || 0) * collectsCount
			})
		}
	}

	console.log('Length of localtrust', localtrust.length)

	return localtrust
}

const f1c3m8col12PriceTimed: LocaltrustStrategy = async (): Promise<LocalTrust<string>> => {
	return getLocaltrust(
		{ followsWeight: 1, commentsWeight: 3, mirrorsWeight: 8, collectsWeight: 12, withPrice: true, withTimeDecay: true })
}

const f1c8m3col12PriceTimed: LocaltrustStrategy = async (): Promise<LocalTrust<string>> => {
	return getLocaltrust(
		{ followsWeight: 1, commentsWeight: 8, mirrorsWeight: 3, collectsWeight: 12, withPrice: true, withTimeDecay: true })
}

export const strategies: Record<string, LocaltrustStrategy> = {
	f1c3m8col12PriceTimed, 
	f1c8m3col12PriceTimed
}