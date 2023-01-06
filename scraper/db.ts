import { Follow, Profile } from '../types'
import { getDB } from '../utils'

const db = getDB()

export const saveProfiles = (profiles: Profile[]) => {
	return db('profiles')
		.insert(profiles)
		.onConflict()
		.ignore()
}

export const saveFollows = (followee: Profile, followers: Profile[]) => {
	const follows = followers.map((follower) => {
		return {
			follower: follower.id,
			followee: followee.id
		 }

	}) as Follow[]

	return db('follows')
		.insert(follows)
		.onConflict()
		.ignore()
}