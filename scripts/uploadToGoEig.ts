import { getDB } from '../utils'
import { getIds } from '../recommender/utils'
import Rankings from '../recommender/RankingsRecommender'
import { config } from '../recommender/config'

const main = async () => {
	const db = getDB()
	const strategies = config.localtrustStrategies
	const ids = await getIds()

	for (const name of Object.values(strategies)) {
		const localtrust = await db('localtrust').select('i', 'j', 'v').where({ strategy_name: name })
		if (!localtrust.length) {
			console.log(`No localtrust for ${name} found, skipping`)
			continue
		}
		await Rankings.uploadLocaltrust(ids, name, localtrust)
	}
}

main()