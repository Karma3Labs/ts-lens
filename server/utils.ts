import { getDB } from "../utils"

const db = getDB()

// Newly defined mapping of strategy names to numeric strategy IDs
const strategyNameToId: Record<string, number> = {
	'followship' : 6,
	'engagement' : 3,
	'influencer' : 6,
	'creator'    : 7
}

export const getProfilesFromIdsOrdered = async (ids: number[], hex = false): Promise<{id: number, handle: string}[]> => {
	const profiles = await db('profiles')
		.select('id', 'handle', 'count as followers_count')
		.innerJoin('follower_counts', 'follower_counts.profile_id', 'profiles.id')
		.whereIn('id', ids)
	
	profiles.sort((a: any, b: any) => ids.indexOf(+a.id) - ids.indexOf(+b.id))

	if (hex) {
		profiles.forEach((profile: any) => {
			profile.id = '0x' + (+profile.id).toString(16)
		})
	}

	return profiles
}

export const getIdsFromQueryParams = async (query: any): Promise<number[]> => {
	console.log(query)
	if (!query.handles && !query.ids) {
		throw Error('Ids or handles is required')
	}

	if (query.ids) {
		let ids = query.ids
		if (typeof ids === 'string') {
			ids = ids.split(',')
		}

		ids = ids.map((id: string) => {
			if (id.startsWith('0x')) {
				return parseInt(id.slice(2), 16)
			}
			return id
		})

		const records = await db('profiles').select('id').whereIn('id', ids)
		if (records.length !== ids.length) {
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

	let records = await db('profiles').select('id').whereIn('handle', handles)
	if (records.length !== handles.length) {
		throw new Error('Invalid handles')
	}

	return records.map((record: any) => record.id)
}


export const getIdFromQueryParams = async (query: any): Promise<number> => {
	if (!query.handle && !query.id) {
		throw Error('Handle or id is required')
	}

	if (query.id) {
		if (Number.isNaN(parseInt(query.id))) {
			throw Error('Invalid id')
		}

		let id = query.id
		if (query.id.startsWith('0x')) {
			id = parseInt(query.id.slice(2), 16)	
		}

		const record = await db('profiles').select('id').where('id', id).first()	
		if (!record) {
			throw new Error('Id does not exist')
		}
		return record.id
	}

	const handle = (query.handle as string).trim()
	let record = await db('profiles').select('id').where({ handle }).first()
	if (record) {
		return record.id
	}

	const handleLens = `${handle}.lens`
	record = await db('profiles').select('id').where({ handle: handleLens }).first()
	if (record) return record.id

	throw new Error('Handle does not exist')
}

export const getStrategyIdFromQueryParams = async (query: any): Promise<number> => {
	// Able to take in either string "strategy" or numeric "strategy_id"
	if (!query.strategy && !query.strategy_id) {
		throw Error('"strategy" or "strategy_id" is required')
	}

	let strategyId = +query.strategy_id;
	if (query.strategy) {
		query.strategy = query.strategy.toString().toLowerCase()
		if (strategyNameToId.hasOwnProperty(query.strategy)) {
			strategyId = strategyNameToId[query.strategy]
		}
	}

	if (isNaN(strategyId)) {
		if (query.strategy) 
			throw new Error(`Invalid strategy ${query.strategy}`)
		else
			throw new Error(`Invalid strategy_id ${query.strategy_id}`)
	}

	const record = await db('strategies').select('id').where('id', strategyId).first()
	if (!record) {
		if (query.strategy) 
			throw new Error(`No results for strategy ${query.strategy}`)
		else
			throw new Error(`No results for strategy_id ${query.strategy_id}`)
	}

	return strategyId
}

export const isValidDate = (date: string): boolean => {
	return date.match(/^\d{4}-\d{2}-\d{2}$/) !== null
}