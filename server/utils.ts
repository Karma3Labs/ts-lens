import { getDB } from "../utils"

const db = getDB()

export const getProfilesFromIdsOrdered = async (ids: number[], hex = false): Promise<{id: number, handle: string}[]> => {
	const profiles = await db('profiles')
		.select('id', 'handle', 'count as followers_count')
		.innerJoin('follower_counts', 'follower_counts.profile_id', 'profiles.id')
		.whereIn('id', ids)
	
	profiles.sort((a: any, b: any) => ids.indexOf(a.id) - ids.indexOf(b.id))

	if (hex) {
		profiles.forEach((profile: any) => {
			profile.id = '0x' + (+profile.id).toString(16)
		})
	}

	return profiles
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

export const isValidDate = (date: string): boolean => {
	return date.match(/^\d{4}-\d{2}-\d{2}$/) !== null
}