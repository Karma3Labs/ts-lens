import Recommender from '../recommender/RankingsRecommender'
import { generateStrategies } from './utils'

const main = async () => {
	const strategies = await generateStrategies()
	console.log(strategies)
	for (const strategy of strategies) {
		console.log(`Recalculating with [${strategy.pretrust},${strategy.localtrust},${strategy.alpha}]`)

		console.time('recalculation')
		await Recommender.calculate(strategy)
		console.timeEnd('recalculation')
	}
}

main().then(() => {
	console.log("Done!")
	process.exit()
})
