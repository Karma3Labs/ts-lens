import { strategies as ptStrategies } from '../recommender/strategies/pretrust'
import { strategies as ltStrategies } from '../recommender/strategies/localtrust'
import Recommender from '../recommender'
import { getDB } from '../utils'

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
		const recommender = new Recommender(pt, lt, 0.3)
		await recommender.loadFromDB()
		const globaltrust = recommender.globaltrust	

		const chunkSIZE = 1000 

		const entries = Object.entries(globaltrust)
		for (let i = 0; i < entries.length; i += chunkSIZE) {
			const chunk = entries
				.slice(i, i + chunkSIZE)
				.map(([ id, globaltrust ]) => ({
					pretrust_strategy: pretrustStrategy,
					localtrust_strategy: localtrustStrategy,
					id,
					globaltrust
				}))

			await db('globaltrusts').insert(chunk)
		}
	}
}
