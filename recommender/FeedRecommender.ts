import { strategies } from './strategies/feed'
import { config } from './config'
import { Post } from '../types'
import { getDB } from '../utils'

const db = getDB()

export default class FeedRecommender {
	static async calculateByStrategy(name: string): Promise<any> {
		const strategy = FeedRecommender.getStrategy(name)
		const feedStrategy = strategies[strategy.feed]
		if (!feedStrategy) {	
			throw new Error("Invalid content strategy")
		}

		const content = await feedStrategy(strategy.limit)
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

	static async getFeed(strategyName: string, limit: number, offset: number): Promise<Post[]> {
		const strategy = FeedRecommender.getStrategy(strategyName)

		console.log(`Getting feed for ${JSON.stringify(strategy)}`)
		const stratName = strategy.feed
		limit = limit || strategy.limit

		const res = await db.raw(`
			SELECT		
				post_id,
				handle,
				rank,
				mirrors_count,
				comments_count,
				collects_count,
				upvotes_count,
				v,
				created_at,
				content_uri
			FROM
				k3l_feed
			WHERE 
				strategy_name = :stratName
			ORDER BY
				(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / (60 * 60 * 24))::integer ASC,
				v DESC
			LIMIT :limit OFFSET :offset;
		`, { stratName, limit, offset })
			
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
