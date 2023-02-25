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

export const getIdFromQueryParams = async (query: Record<string, any>): Promise<number> => {
	if (query.id) {
		if (isNaN(query.id)) {
			throw new Error('Invalid id') 
		}

		const { count } = await db('profiles')
			.count({ count: '*' })
			.where('id', query.id)

		if (+count === 0) {
			throw new Error('Id does not exist')
		}

		return +query.id
	}

	if (query.handle) {
		const stripped = (query.handle as string).trim() 
		const record = await db('profiles').select('id').where('handle', stripped).first()

		if (!record) {
			throw new Error('Address does not exist')
		}

		return +record.id
	}

	throw new Error('Either handle or id should be provided')
}