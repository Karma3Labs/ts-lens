import { strategies as ptStrategies } from '../recommender/strategies/pretrust'
import { strategies as ltStrategies } from '../recommender/strategies/localtrust'
import Recommender from '../recommender'
import { getDB } from '../utils'

const CHUNK_SIZE = 1000 
const ALPHA = 0.5

const db = getDB()

const pretrustStrategies = ['pretrustAllEqually', 'pretrustSpecificIds']
const localStrategies = ['existingConnections', 'enhancedConnections']

const combinations = pretrustStrategies.flatMap(pretrustStrategy => {
	return localStrategies.map((localtrustStrategy) => {
		return { 
			pretrustStrategy,
			localtrustStrategy
		}
	})
})

const main = async () => {
	for (const { pretrustStrategy, localtrustStrategy } of combinations) {
		const pt = ptStrategies[pretrustStrategy]
		const lt = ltStrategies[localtrustStrategy]

		console.log(`Recalculating with ${pretrustStrategy} and ${localtrustStrategy} strategies`)

		console.time('recalculation')
		const recommender = new Recommender(pt, lt, ALPHA)
		await recommender.recalculate()
		const globaltrust = recommender.globaltrust	
		console.timeEnd('recalculation')

		console.log("Saving to DB")
		console.time('saving')
		const entries = Object.entries(globaltrust)
		for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
			const chunk = entries
				.slice(i, i + CHUNK_SIZE)
				.map(([ id, globaltrust ]) => ({
					pretrust: pretrustStrategy,
					localtrust: localtrustStrategy,
					alpha: ALPHA,
					i: id,
					v: globaltrust
				}))

			await db('globaltrust')
				.insert(chunk)
				.onConflict(['pretrust', 'localtrust', 'alpha', 'i']).merge()
		}
		console.timeEnd('saving')
	}
}

main()