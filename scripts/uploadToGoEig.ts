import { getDB } from '../utils'
import RankingsRecommender from '../recommender/RankingsRecommender'
import { getIds } from '../recommender/utils'
import Rankings from '../recommender/RankingsRecommender'

const main = async () => {
	const db = getDB()
	const strategies = await db('localtrust_strategies').select()
	const ids = await getIds()

	for (const { id, name } of strategies) {
		const localtrust = await db('localtrust').select('i', 'j', 'v').where({ strategy_id: id })
		if (!localtrust.length) {
			console.log(`No localtrust for ${name} found, skipping`)
			continue
		}
		await Rankings.uploadLocaltrust(ids, name, localtrust)
	}
}

main()