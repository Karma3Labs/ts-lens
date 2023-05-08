export type Profile = {
	profileid: string
	handle: string
	followings: number[]
	createdAt: number
}

export type Post = {
	id: string,
	pubId: number
	fromProfile: number
	timestamp: Date
}

export type Comment = {
	id: string,
	pubId: number
	fromProfile: number
	profileIdPointed: number
	pubIdPointed: number
	timestamp: Date
}

export type Mirror = {
	id: string,
	pubId: number
	fromProfile: number
	profileIdPointed: number
	timestamp: Date
}

export type EthAddress = string
export type Pretrust<T> = { i: T, v: number }[]
export type GlobalTrust<T> = { i: T, v: number, rank?: number }[]
export type LocalTrust<T> =  { i: T, j: T, v: number }[]
export type GlobalTrustEntries = [string, number][]
export type Entry = [ number, number ] 
export type AdjacencyMap = Record<number, Set<number>>
