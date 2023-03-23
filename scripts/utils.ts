import { strategies as ptStrategies } from '../recommender/strategies/pretrust'
import { strategies as ltStrategies } from '../recommender/strategies/localtrust'
import { getDB } from '../utils'

const db = getDB()

/**
 * 
 * Uses the pretrust and localtrust strategies to generate all possible
 * combinations and saves them to the DB.
*/
export const generateStrategies = async () => {
	// const pretrustStrategies = Object.keys(ptStrategies)
	// let localStrategies = Object.keys(ltStrategies)
	// const ALPHAS = [0.5, 0.8]

	// for (const pt of pretrustStrategies) {
	// 	for (const lt of localStrategies) {
	// 		for (const alpha of ALPHAS) {
	// 			await db('strategies')
	// 				.insert({ pretrust: pt, localtrust: lt, alpha })
	// 				.onConflict(['pretrust', 'localtrust', 'alpha'])
	// 				.ignore()
	// 		}
	// 	}
	// }
	// 
	// const strategies = await db('strategies')

	// Let's focus on a fixed set of strategies for now
	const strategies = [
		{
			pretrust: 'pretrustAllEqually',
			localtrust: 'existingConnections',
			alpha: 0.5
		}, {
			pretrust: 'pretrustAllEqually',
			localtrust: 'c5m8enhancedConnections',
			alpha: 0.5
	  	}, {
			pretrust: 'pretrustOGs',
			localtrust: 'c5m8enhancedConnections',
			alpha: 0.5
	  	}, {
			pretrust: 'pretrustAllEqually',
			localtrust: 'c5m8col12enhancedConnections',
			alpha: 0.5,
	  	}, { 
			pretrust: 'pretrustOGs',
			localtrust: 'c5m8col12enhancedConnections',
			alpha: 0.5
		}
	]
	return strategies
}