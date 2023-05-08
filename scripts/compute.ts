import Recommender from '../recommender/RankingsRecommender'
import { getIds } from '../recommender/utils'
import { config } from '../recommender/config'
import LocaltrustGenerator from '../recommender/LocaltrustGenerator'
import Rankings from '../recommender/RankingsRecommender'

const main = async () => {
	const ids = await getIds()
	const localtrustGenerator = new LocaltrustGenerator()

	const localtrustStrategies = Object.values(config.localtrustStrategies)
	console.time("Generated localtrust")
	for (const ltStrategy of localtrustStrategies) {
		console.log(`Generating localtrust for ${ltStrategy}`)
		const localtrust = await localtrustGenerator.generateLocaltrust(ltStrategy)
		await localtrustGenerator.saveLocaltrust(ltStrategy, localtrust)
		await localtrustGenerator.uploadLocaltrust(ltStrategy, localtrust, ids)
	}
	console.timeEnd("Generated localtrust")

	console.time("Generated rankings")
	const rankingStrategies = config.rankingStrategies
	for (const rkStrategy of rankingStrategies) {
		console.log(`Generating rankings for ${rkStrategy.name}`)
		const rankings = await Recommender.calculateByStrategy(ids, rkStrategy)
		await Rankings.saveGlobaltrust(rkStrategy.name, rankings)
	}
	console.timeEnd("Generated rankings")
}

main().then(() => {
	console.log("Done!")
	process.exit()
})
