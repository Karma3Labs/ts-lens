export type Profile = {
	handle: string
    id: string
}

export type Follow = {
	follower: string
	followee: string
}

export type EthAddress = string
export type Pretrust<T> = { i: T, v: number }[]
export type GlobalTrust<T> = { i: T, v: number }[]
export type LocalTrust<T> =  { i: T, j: T, v: string | number }[]
export type Entry = [ string, number ] 
export type AdjacencyMap = Record<string, Set<string>>
