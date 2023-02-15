import { getDB } from "../utils" 

const db = getDB()

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
		const { id } = await db('profiles').select('id').where('handle', stripped).first()

		if (!id) {
			throw new Error('Address does not exist')
		}

		return id
	}

	throw new Error('Either handle or id should be provided')
}