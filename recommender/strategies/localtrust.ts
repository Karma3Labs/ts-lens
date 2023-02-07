import { LocalTrust } from '../../types'
import { getDB } from '../../utils';

export type LocaltrustStrategy = () => Promise<LocalTrust>
const db = getDB()

/**
 * Generates basic localtrust by transforming all existing connections
*/
const existingConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	const profiles = await db('profiles').select('id', 'followings')
	let localtrust: LocalTrust = []
	
	for (const profile of profiles) {
		for (const following of profile.followings) {
			localtrust.push({
				i: +profile.id,
				j: +following,
				v: 1
			})
		}
	}

	return localtrust
}

const enhancedConnections: LocaltrustStrategy = async (): Promise<LocalTrust> => {
	const profiles = await db('profiles').select('id', 'followings')
	let localtrust: LocalTrust = []
	
	for (const profile of profiles) {
		for (const following of profile.followings) {
			localtrust.push({
				i: +profile.id,
				j: +following,
				v: 1
			})
		}
	}

	return localtrust
}


export const strategies: Record<string, LocaltrustStrategy> = {
	existingConnections,
	enhancedConnections
}