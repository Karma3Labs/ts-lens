import Recommender from '../recommender/RankingsRecommender'
import { getIds } from '../recommender/utils'
import { generateStrategies } from './utils'

const main = async () => {
	const strategies = await generateStrategies()
	const ids = await getIds()
	console.log(strategies)
	for (const strategy of strategies) {
		console.log(`Recalculating with [${strategy.pretrust},${strategy.localtrust},${strategy.alpha}]`)

		console.time('recalculation')
		await Recommender.calculate(ids, strategy.id)
		console.timeEnd('recalculation')
	}
}

main().then(() => {
	console.log("Done!")
	process.exit()
})
