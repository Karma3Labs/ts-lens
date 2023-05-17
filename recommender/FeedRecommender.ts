import  path from 'path'
import { strategies, ContentStrategy} from './strategies/content'
import { config } from './config'
import RankingsRecommender from './RankingsRecommender'
import { Post } from '../types'
import { getDB } from '../utils'

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const db = getDB()

export default class FeedRecommender {
	static async calculateByStrategy(name: string): Promise<any> {
		const strategy = FeedRecommender.getStrategy(name)
		const contentStrategy = strategies[strategy.feed]
		if (!contentStrategy) {	
			throw new Error("Invalid content strategy")
		}

		const globaltrust = await RankingsRecommender.getGlobaltrustByStrategyName(strategy.globaltrust, strategy.globaltrustSize)
		const userIds = globaltrust.map(({ id }: {id: string}) => id)
		console.log(`Generated globaltrust with ${userIds.length} entries`)

		const content = await contentStrategy(userIds, strategy.limit)
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

	static async getFeed(strategyName: string, limit?: number): Promise<Post[]> {
		console.log(`Getting feed for ${strategyName}`)
		const strategy = FeedRecommender.getStrategy(strategyName)
		limit = limit || strategy.limit 

		const res = await db('feed')
			.select(
				'k3l_posts.post_id',
				'total_amount_of_mirrors as mirrors_count',
				'total_amount_of_comments as comments_count',
				'total_amount_of_collects as collects_count',
				'v',
				'created_at',
				'content_uri'
			)
			.where({ strategy_name: strategyName })
			.innerJoin('k3l_posts', 'k3l_posts.post_id', 'feed.post_id')
			.innerJoin('publication_stats', 'feed.post_id', 'publication_stats.publication_id')
			.orderBy('v', 'desc')
			.limit(limit)
		
		const feed = res.map((r: any) => ({
			...r,
			mirrorsCount: +r.mirrorsCount,
			commentsCount: +r.commentsCount,
			collectsCount: +r.collectsCount,
		}))

		if (!feed.length) {
			throw new Error("Feed not found")
		}

		return feed
	}

	static getStrategy(strategyName: string) {
		const strategy = config.feed.find((s) => s.name === strategyName)
		if (!strategy) {
			throw new Error("Invalid feed strategy")
		}

		return strategy
	}
}

const main = async () => {
	// const posts = await FeedRecommender.calculateByStrategy('followship-viralPosts')
	// await FeedRecommender.saveFeed('followship-viralPosts', posts)

	const feed = await FeedRecommender.getFeed('followship-viralPosts')
	console.log(feed)
	process.exit()
}

main()
