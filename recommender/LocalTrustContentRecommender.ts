import  path from 'path'
import { strategies, ContentStrategy} from './strategies/content'
import { config } from './config'
import UserRecommender from './UserRecommender'

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

/**
 * User-specific GlobalTrust is computed on-demand using 
 * the profiles that the user follows as a PreTrust. 
 * Posts by the top profiles in the GlobalTrust are then recommended.
 */
export default class LocalTrustContentRecommender {
	private userRecommender: UserRecommender
	private strategyName: string
	private strategy: ContentStrategy
	private limitUsers: number

	constructor(userRecommender: UserRecommender, strategy = "viralPosts") {
		this.strategyName = strategy || config.content.strategy

		if (!strategies[this.strategyName]) throw new Error(`Strategy ${this.strategyName} not found`)
		this.strategy = strategies[this.strategyName]

		this.limitUsers = config.content.limitUsers
		this.userRecommender = userRecommender
	} 

	async recommend(userId: number, limit: number = 50) {
		const users = await this.userRecommender.recommend(userId, this.limitUsers)
		return this.strategy(users, limit)
	}
}
