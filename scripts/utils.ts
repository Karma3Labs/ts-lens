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

	
	// 
	// const strategies = await db('strategies')

	// Let's focus on a fixed set of strategies for now
	const strategies = [
		{
			id: 1,
			pretrust: 'pretrustAllEqually',
			localtrust: 'existingConnections',
			alpha: 0.5
		}, {
			id: 2,
			pretrust: 'pretrustAllEqually',
			localtrust: 'c5m8enhancedConnections',
			alpha: 0.5
	  	}, {
			id: 3,
			pretrust: 'pretrustOGs',
			localtrust: 'c5m8enhancedConnections',
			alpha: 0.5
	  	}, {
			id: 4,
			pretrust: 'pretrustAllEqually',
			localtrust: 'c5m8col12enhancedConnections',
			alpha: 0.5,
	  	}, { 
			id: 5,
			pretrust: 'pretrustOGs',
			localtrust: 'c5m8col12enhancedConnections',
			alpha: 0.5
		}
	]



	return strategies
}