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
export type Pretrust = { i: number, v: number }[]
export type GlobalTrust = { i: number, v: number }[]
export type LocalTrust =  { i: number, j: number, v: number }[]
export type GlobalTrustEntries = [number, number][]
export type Entry = [ number, number ] 
export type AdjacencyMap = Record<number, Set<number>>
