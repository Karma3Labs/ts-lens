import  path from 'path'
import { strategies, PersonalFeedStrategy} from './strategies/personalfeed'
import { config } from './config'

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class PersonalFeedRecommender {

	static async getFeed(strategyName:string, limit: number, profileId: string) {
		const strategy = config.personalFeedStrategies.find((s) => s.name === strategyName)
		if (!strategy) {
			throw new Error("Invalid feed strategy")
		}
		const feedStrategy = strategies[strategy.feed]
		const content = await feedStrategy(limit, profileId)
		console.log(`Generated content with ${content.length} entries`)

		return content
	}

}
