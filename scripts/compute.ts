import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { getIds } from '../recommender/utils'
import { config } from '../recommender/config'
import LocaltrustGenerator from '../recommender/LocaltrustGenerator'
import Rankings from '../recommender/RankingsRecommender'
import Feed from '../recommender/FeedRecommender'

const generateLocaltrust = async (schema: string, ids: string[]) => {
	console.time(`Generated localtrust in the ${schema} schema`)
	const localtrustGenerator = new LocaltrustGenerator(schema)
	for (const ltStrategy of config.localtrustStrategies) {
		console.log(`Generating localtrust for ${schema}.${ltStrategy}`)
		console.time(`Generate localtrust for ${schema}.${ltStrategy}`)
		const localtrust = await localtrustGenerator.generateLocaltrust(ltStrategy)
		console.timeEnd(`Generate localtrust for ${schema}.${ltStrategy}`)

		console.log(`Saving localtrust for ${schema}.${ltStrategy}`)
		console.time(`Save localtrust for ${schema}.${ltStrategy}`)
		await localtrustGenerator.saveLocaltrust(ltStrategy, localtrust, schema)
		console.timeEnd(`Save localtrust for ${schema}.${ltStrategy}`)

		console.log(`Uploading localtrust for ${schema}.${ltStrategy}`)
		console.time(`Upload localtrust for ${schema}.${ltStrategy}`)
		await localtrustGenerator.uploadLocaltrust(ltStrategy, localtrust, ids, schema)
		console.timeEnd(`Upload localtrust for ${schema}.${ltStrategy}`)
	}
	console.timeEnd(`Upload localtrust in the ${schema} schema`)
}

const generateRankings = async (schema: string, ids: string[]) => {
	console.time(`Generated rankings for ${schema}`)
	for (const rkStrategy of config.rankingStrategies) {
		console.log(`Generating rankings for ${schema}.${rkStrategy.name}`)
		const rankings = await Rankings.calculateByStrategy(ids, rkStrategy, schema)
		// TODO make GlobalTrust schema-aware
		await Rankings.saveGlobaltrust(rkStrategy.name, rankings)
	}
	console.timeEnd(`Generated rankings for ${schema}`)
}

const generateFeed = async () => {
	console.time("Generated feed")
	for (const fStrategy of config.sqlFeedStrategies) {
		console.log(`Generating feed for ${fStrategy.name}`)
		const feed = await Feed.calculateByStrategy(fStrategy.name, 5000)
		await Feed.saveFeed(fStrategy.feed, feed)
	}
	console.timeEnd("Generated feed")
}

yargs(hideBin(process.argv))
	.command(
		'$0 [schema] [command]',
		'Compute various things',
		(yargs) => {
			yargs
				.positional('schema', {
					describe: 'Database schema to use',
					default: 'public',
				})
				.positional('command', {
					describe: 'To compute either rank or feed, if not specified, it will be both',
					choices: ['rank', 'feed'],
				})
		},
		async (argv) => {
			const schema: string = argv.schema as string
			const command = argv.command as string | undefined

			// Fetch IDs once here
			const ids = await getIds()

			if (!command || command === 'rank') {
				await generateLocaltrust(schema, ids)
				await generateRankings(schema, ids)
			}

			if (!command || command === 'feed') {
				await generateFeed()
			}

			console.log("Done!")
			process.exit()
		}
	)
	.help()
	.argv
