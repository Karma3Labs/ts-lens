import  path from 'path'
import { strategies, ContentStrategy} from './strategies/content'
import { config } from './config'
import RankingsRecommender from './RankingsRecommender'

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class FeedRecommender {
	private strategyName: string
	private strategy: ContentStrategy

	constructor(strategy = "viralPosts") {
		this.strategyName = strategy || config.feed.strategy

		if (!strategies[this.strategyName]) throw new Error(`Strategy ${this.strategyName} not found`)

		this.strategy = strategies[this.strategyName]
	} 

	async recommend(limit: number = 50) {
		const users = await RankingsRecommender.getGlobaltrustByStrategyName(config.feed.globaltrust, config.feed.globaltrustSize)
		console.log(users)
		const userIds = users.map(({ id }: {id: string}) => id)
		return this.strategy(userIds, limit)
	}
}
