import Recommender from '../recommender/RankingsRecommender'
import { getIds } from '../recommender/utils'
import { config } from '../recommender/config'

const main = async () => {
	const ids = await getIds()
	const strategies = config.rankingStrategies

	for (const st of Object.values(strategies)) {
		console.log(`Recalculating with [${st.pretrust},${st.localtrust},${st.alpha}]`)

		console.time('recalculation')
		await Recommender.calculateByStrategy(ids, st)
		console.timeEnd('recalculation')
	}
}

main().then(() => {
	console.log("Done!")
	process.exit()
})
