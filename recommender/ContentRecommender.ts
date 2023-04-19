import  path from 'path'
import { strategies, ContentStrategy} from './strategies/content'
import { config } from './config'
import UserRecommender from './UserRecommender'

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class ContentRecommender {
	private userRecommender: UserRecommender
	private strategyName: string
	private strategy: ContentStrategy
	private limitUsers: number

	constructor(strategy = "viralPosts") {
		this.strategyName = strategy || config.content.strategy

		if (!strategies[this.strategyName]) throw new Error(`Strategy ${this.strategyName} not found`)
		this.strategy = strategies[this.strategyName]

		this.limitUsers = config.content.limitUsers

		const { globaltrust, ltStrategyId, limitGlobaltrust } = config.content.personalization
		this.userRecommender = new UserRecommender(globaltrust, ltStrategyId, limitGlobaltrust)
	} 

	async recommend(limit: number = 50) {
		const users = await this.userRecommender.recommend(this.limitUsers)
		return this.strategy(users, limit)
	}
}
