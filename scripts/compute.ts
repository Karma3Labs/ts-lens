import { getIds } from '../recommender/utils'
import { config } from '../recommender/config'
import LocaltrustGenerator from '../recommender/LocaltrustGenerator'
import Rankings from '../recommender/RankingsRecommender'
import Feed from '../recommender/FeedRecommender'

const main = async () => {
	// TODO import yargs for better CLI handling
	const args = process.argv.slice(2);
	// TODO move schema into config so we don't have to pass it around
	const schema = args[0] || "public"; // Default to "public" if no argument is given
	const ids = await getIds()
	const localtrustGenerator = new LocaltrustGenerator(schema)
	
	console.time(`Generated localtrust in the ${schema} schema`)
	for (const ltStrategy of config.localtrustStrategies) {
		console.log(`Generating localtrust for ${schema}.${ltStrategy}`)
		const localtrust = await localtrustGenerator.generateLocaltrust(ltStrategy)
		console.log(`Saving localtrust for ${schema}.${ltStrategy}`)
		await localtrustGenerator.saveLocaltrust(ltStrategy, localtrust, schema)
		console.log(`Uploading localtrust for ${schema}.${ltStrategy}`)
		await localtrustGenerator.uploadLocaltrust(ltStrategy, localtrust, ids, schema)
	}
	console.timeEnd(`Generated localtrust in the ${schema} schema`)

	console.time("Generated rankings")
	for (const rkStrategy of config.rankingStrategies) {
		console.log(`Generating rankings for ${schema}.${rkStrategy.name}`)
		const rankings = await Rankings.calculateByStrategy(ids, rkStrategy, schema)
		// TODO make GlobalTrust schema-aware
		await Rankings.saveGlobaltrust(rkStrategy.name, rankings)
	}
	console.timeEnd("Generated rankings")

	console.time("Generated feed")
	for (const fStrategy of config.sqlFeedStrategies) {
		console.log(`Generating rankings for ${schema}.${fStrategy.name}`)
		const feed = await Feed.calculateByStrategy(fStrategy.name, 5000)
		await Feed.saveFeed(fStrategy.feed, feed)
	}
	console.timeEnd("Generated feed")
}

main().then(() => {
	console.log("Done!")
	process.exit()
})
