import { getDB } from '../utils'

const db = getDB()

/**
 * 
 * Uses the pretrust and localtrust strategies to generate all possible
 * combinations and saves them to the DB.
*/
export const generateStrategies = async () => {
	const strategies = await db('strategies')
	console.log(strategies)
	return strategies
}