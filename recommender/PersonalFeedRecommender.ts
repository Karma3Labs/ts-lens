import  path from 'path'
import { strategies } from './strategies/personalfeed'
import { config } from './config'

// TODO: Fix that ugly thingie
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

export default class PersonalFeedRecommender {

	static async getFeed(strategyName:string, limit: number, offset: number, profileId: string, contentFocus: string[]) {
		const strategy = config.personalFeedStrategies.find((s) => s.name === strategyName)
		if (!strategy) {
			throw new Error(`Invalid feed strategy ${strategyName}`)
		}
		const feedStrategy = strategies[strategy.feed]
		const content = await feedStrategy(limit, offset, profileId, contentFocus)
		console.log(`Generated content with ${content.length} entries for ${profileId} using ${strategyName} strategy`)

		return content
	}

}
