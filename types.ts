export type Profile = {
	id: number
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
export type GlobalTrust<T> = { i: T, v: number }[]
export type LocalTrust<T> =  { i: T, j: T, v: string | number }[]
export type Entry = [ string, number ] 
export type AdjacencyMap = Record<string, Set<string>>
