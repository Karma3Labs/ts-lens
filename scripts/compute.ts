import Recommender from '../recommender'
import { generateStrategies } from './utils'

const main = async () => {
	const strategies = await generateStrategies()
	console.log(strategies)
	for (const { id, pretrust, localtrust, alpha } of strategies) {
		console.log(`Recalculating with [${pretrust},${localtrust},${alpha}]`)

		console.time('recalculation')
		const recommender = new Recommender(id)
		await recommender.recalculate()
		console.timeEnd('recalculation')
	}
}

main().then(() => {
	console.log("Done!")
	process.exit()
})
