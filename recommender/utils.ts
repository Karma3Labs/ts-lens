import { getDB } from "../utils" 

const db = getDB()

/**
 * Get ids
 */
export const getIds = async (): Promise<string[]> => {
	console.time('Getting ids')
	const res = await db('k3l_profiles').select('profile_id')
	const ids =  res.map((r: { profileId: string }) => r.profileId)
	console.timeEnd('Getting ids')

	return ids
}

export const objectFlip = (obj: Record<number, string>): Record<string, number> => {
	const ret: Record<string, number> = {}
	Object.keys(obj).forEach(key => {
	  //@ts-expect-error
	  ret[obj[key]] = key
	})
	return ret
}

/**
 * Set operations
*/
export function union<T>(setA: Set<T>, setB: Set<T>): Set<T> {
	const _union = new Set<T>(setA)
	for (const elem of setB) {
	  _union.add(elem)
	}
	return _union
}
  
export function intersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
	const _intersection = new Set<T>()
	for (const elem of setB) {
	  if (setA.has(elem)) {
		_intersection.add(elem)
	  }
	}
	return _intersection
  }

export function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
	const _difference = new Set(setA)
	for (const elem of setB) {
	  _difference.delete(elem)
	}
	return _difference
}