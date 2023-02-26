import { getDB } from "../utils" 

const db = getDB()

export const getProfilesFromIdsOrdered = async (ids: number[]): Promise<{id: number, handle: string}[]> => {
	const profiles = await db('profiles')
		.select('id', 'handle', 'count as followers_count')
		.innerJoin('follower_counts', 'follower_counts.profile_id', 'profiles.id')
		.whereIn('id', ids)
	
	profiles.sort((a: any, b: any) => ids.indexOf(a.id) - ids.indexOf(b.id))

	return profiles
}

export const getHandleFromQueryParams = async (query: any): Promise<string> => {
	if (!query.handle) {
		throw Error('Handle is required')
	}

	const handle = (query.handle as string).trim() 
	const record = await db('profiles').select('id').where({ handle }).first()
	if (!record) {
		throw new Error('Handle does not exist')
	}

	return handle
}

export const getIdFromHandle = async (handle: string): Promise<number> => {
	const { id } = await db('profiles').select('id').where({ handle }).first()
	return +id
}

export const getStrategyIdFromQueryParams = async (query: any): Promise<number> => {
	if (!query.strategy_id) {
		throw Error('Strategy id is required')
	}
	if (isNaN(+query.strategy_id)) { 
		throw Error("Invalid strategy id")
	}

	const record = await db('strategies').select('id').where('id', query.strategy_id).first()
	if (!record) {
		throw new Error('Strategy id does not exist')
	}

	return +query.strategy_id
}