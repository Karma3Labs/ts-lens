import { getDB } from "../utils"

const db = getDB()

export const getProfilesFromIdsOrdered = async (ids: string[], hex = false): Promise<{id: number, handle: string}[]> => {
	console.log('ids', ids)
	const profiles = await db('k3l_profiles')
		.select('k3l_profiles.profile_id', 'handle', 'count as followers_count')
		.innerJoin('k3l_follow_counts', 'k3l_follow_counts.profile_id', 'k3l_profiles.profile_id')
		.whereIn('k3l_profiles.profile_id', ids)
	
	profiles.sort((a: any, b: any) => ids.indexOf(a.profileId) - ids.indexOf(b.profileId))

	return profiles
}

export const getIdsFromQueryParams = async (query: any): Promise<number[]> => {
	console.log(query)
	if (!query.handles && !query.ids) {
		throw Error('Ids or handles is required')
	}

	if (query.ids) {
		let ids = query.ids
		ids = ids.split(',')

		const { count } = await db('k3l_profiles').count('profile_id').whereIn('profile_id', ids).first()
		console.log(count)
		if (+count !== ids.length) {
			throw new Error('Invalid ids')
		}
		return ids
	}

	const handles = (query.handles as string).split(',')
	handles.forEach((handle: string, i: number) => {
		if (!handle.endsWith('.lens')) {
			handles[i] = handle + '.lens'
		}
	})

	let records = await db('k3l_profiles').select('profile_id').whereIn('handle', handles)
	if (records.length !== handles.length) {
		throw new Error('Invalid handles')
	}

	return records.map((record: any) => record.profileId)
}


export const getIdFromQueryParams = async (query: any): Promise<number> => {
	if (!query.handle && !query.id) {
		throw Error('Handle or id is required')
	}

	if (query.id) {
		const record = await db('k3l_profiles').select('profile_id').where('profile_id', query.id).first()	
		if (!record) {
			throw new Error('Profile ID does not exist')
		}
		return query.id
	}

	const handle = (query.handle as string).trim()
	let record = await db('k3l_profiles').select('profile_id').where({ handle }).first()
	if (record) return record.profileId

	const handleLens = `${handle}.lens`
	record = await db('k3l_profiles').select('profile_id').where({ handle: handleLens }).first()
	if (record) return record.profileId

	throw new Error('Handle does not exist')
}

export const getStrategyNameFromQueryParams = async (query: any): Promise<string> => {
	if (!query.strategy) {
		throw Error('strategy is required')
	}

	const strategies = await db('globaltrust').distinct('strategy_name')
	const names = strategies.map((strategy: any) => strategy.strategyName)

	if (!names.includes(query.strategy)) {
		throw Error('Invalid strategy')	
	}

	return query.strategy
}

export const isValidDate = (date: string): boolean => {
	return date.match(/^\d{4}-\d{2}-\d{2}$/) !== null
}