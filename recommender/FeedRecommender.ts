import  path from 'path'
import { strategies } from './strategies/feed'
import { config } from './config'
import { Post } from '../types'
import { getDB } from '../utils'

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

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

	static async getFeed(strategyName: string, limit: number): Promise<Post[]> {
		const strategy = FeedRecommender.getStrategy(strategyName)

		console.log(`Getting feed for ${JSON.stringify(strategy)}`)
		// const strategy = FeedRecommender.getStrategy(strategyName)
		// limit = limit || strategy.limit
		limit = limit || 100

		const res = await db.raw(`
			SELECT		
				k3l_posts.post_id,
				handle,
				rank,
				total_amount_of_mirrors as mirrors_count,
				total_amount_of_comments as comments_count,
				total_amount_of_collects as collects_count,
				total_upvotes as upvotes_count,
				feed.v,
				k3l_posts.created_at,
				content_uri
			FROM
				feed
				INNER JOIN k3l_posts on (k3l_posts.post_id = feed.post_id)
				INNER JOIN publication_stats ON (feed.post_id = publication_stats.publication_id)
				INNER JOIN k3l_profiles ON (k3l_posts.profile_id = k3l_profiles.profile_id)
				INNER JOIN 
					( SELECT 
							ROW_NUMBER() OVER (ORDER BY v DESC) AS rank,
							i as profile_id
						FROM globaltrust
						WHERE 
							strategy_name = 'engagement'
							AND date = (select max(date) from globaltrust)
					) as gt ON (gt.profile_id = k3l_posts.profile_id)
			WHERE 
				feed.strategy_name = :strategyName
			ORDER BY
				(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - k3l_posts.created_at)) / (60 * 60 * 24))::integer ASC,
				feed.v DESC
			LIMIT :limit;
		`, { strategyName, limit })
			
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
