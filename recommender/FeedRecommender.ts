import { strategies } from './strategies/feed'
import { config } from './config'
import { Post } from '../types'
import { getDB } from '../utils'

const db = getDB()

export default class FeedRecommender {
	static async calculateByStrategy(name: string, limit: number): Promise<any> {
		const strategy = FeedRecommender.getStrategy(name)
		limit = limit || strategy.limit
		const feedStrategy = strategies[strategy.feed]
		if (!feedStrategy) {	
			throw new Error("Invalid content strategy")
		}

		const content = await feedStrategy(limit)
		console.log(`Generated content with ${content.length} entries`)

		return content
	}

	static async saveFeed(strategyName: string, feed: Post[]) {
		const CHUNK_SIZE = 1000
		if (!feed.length) {
			return
		}

		await db('feed').where({ strategyName }).del()

		for (let i = 0; i < feed.length; i += CHUNK_SIZE) {
			const chunk = feed
				.slice(i, i + CHUNK_SIZE)
				.map(g => ({
					strategyName,
					postId: g.postId,
					v: +g.v,
				}))
			
			await db('feed')
				.insert(chunk)
		}
	}

	static async getFeed(
		strategyName: string, 
		limit: number, 
		offset: number, 
		rankLimit: number, 
		contentFocus: string[],
		language: string
		): Promise<Post[]> {

		let contentFocusClause: string = ''
		let cf_array: string[][] = []
		if (contentFocus && contentFocus.length > 0) {
			cf_array = [contentFocus.map(function(x){return x.toUpperCase()})]
			contentFocusClause = "AND main_content_focus = ANY ( :cf_array::text[] )"
			console.log(`cf_array: ${cf_array}`)
			console.log(`contentFocusClause: ${contentFocusClause}`)
		}
		let languageClause: string = ''
		if (language) {
			languageClause = `AND language = :language`
			console.log(`languageClause: ${languageClause}`)
		}
		const strategy = FeedRecommender.getStrategy(strategyName)

		console.log(`Getting feed for ${JSON.stringify(strategy)}`)

		const stratName = strategy.feed
		const rankName = strategy.ranking || 'engagement'
		limit = limit || strategy.limit

		const res = await db.raw(`
			SELECT		
				post_id,
				handle,
				k3l_rank.rank,
				mirrors_count,
				comments_count,
				collects_count,
				upvotes_count,
				v,
				created_at,
				content_uri
			FROM
				k3l_feed
			INNER JOIN k3l_rank on (k3l_rank.profile_id=k3l_feed.profile_id 
															AND k3l_rank.strategy_name=:rankName
															AND k3l_rank.rank < :rankLimit
															AND k3l_rank.date=(select max(date) from k3l_rank where strategy_name=:rankName))
			WHERE 
			k3l_feed.strategy_name = :stratName
				${contentFocusClause}
				${languageClause}
			ORDER BY
				(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / (60 * 60 * 24))::numeric ASC,
				v DESC
			LIMIT :limit OFFSET :offset;
		`, { stratName, rankName, rankLimit, cf_array, language, limit, offset })
			
		const feed = res.rows.map((r: any) => ({
			...r,
			mirrorsCount: +r.mirrorsCount,
			commentsCount: +r.commentsCount,
			collectsCount: +r.collectsCount,
			upvotesCount: +r.upvotesCount,
		}))

		if (!feed.length) {
			throw new Error("Feed not found")
		}

		return feed
	}

	static getStrategy(strategyName: string) {
		let strategy = config.sqlFeedStrategies.find((s) => s.name === strategyName)
		if (!strategy) {
			strategy = config.algoFeedStrategies.find((s) => s.name === strategyName)
		}
		if (!strategy) {
			throw new Error(`Invalid feed strategy ${strategyName}`)
		}
		return strategy
	}
 
}
