import { id } from 'ethers/lib/utils';
import { Follow, LocalTrust } from '../../types'
import {  } from '../utils'

export type LocaltrustStrategy = (follows: Follow[]) => Promise<LocalTrust<string>>

/**
 * Generates basic localtrust by transforming all existing connections
*/
const existingConnections: LocaltrustStrategy = async (follows: Follow[]): Promise<LocalTrust<string>> => {
	const localTrust: LocalTrust<string> = []
	for (const { follower, followee } of follows) {
		localTrust.push({
			i: follower,
			j: followee,
			v: 1
		})
	}

	return localTrust
}

export const strategies: Record<string, LocaltrustStrategy> = {
	existingConnections
}