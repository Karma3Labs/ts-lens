import { AdjacencyMap, Follow }  from '../types'
import { getDB } from "../utils" 

export const getGraphFromFollowsTable = async () => {
	const adjacencyMap: AdjacencyMap = {}
	const follows = await getAllFollows()
	const edges = follows.map(({follower, followee}: Follow) => [follower, followee])

	for (const [src, dest] of edges) {
		adjacencyMap[src] = adjacencyMap[src] || new Set()
		adjacencyMap[src].add(dest)
	}

	return adjacencyMap
}

/**
 * Pruning takes place! 
 * This query will select the follows that have followers in the top 80 followees by popularity
 * (i.e. the followees with the most followers). 
*/
export const getAllFollows = async (): Promise<Follow[]> => {
	// const TOP_USERS = 80
	const db = getDB()

	return db('follows')
		.select()
		.whereIn('follower', (t: any) => {
			t.select('followee')
				.from('follows')
				.groupBy('followee')
				.orderByRaw('count(follower) desc')
				.limit(80)
		})

	// const res = await db.raw(`
	// 	WITH data AS (
	// 		SELECT follower, followee, p.num_followers,
	// 		rank() over (PARTITION BY followee ORDER BY num_followers DESC) as rank
	// 		FROM follows f
	// 		JOIN popularity p
	// 		ON f.follower = p.user
	// 	)
	// 	SELECT follower, followee, rank
	// 	FROM data
	// 	WHERE rank <= ${TOP_USERS}
	// `)
	// return res.rows
}

export const getFollowsOfHandle = async (handle: string): Promise<Set<string>> => {
	const db = getDB()
	const follows = await db('follows')
		.where('followee', handle)
		.select()

	return new Set(follows.map((f: Follow) => f.follower))
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