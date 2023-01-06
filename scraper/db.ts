import { Follow, Profile } from '../types'
import { getDB } from '../utils'

const db = getDB()

export const saveProfiles = (profiles: Profile[]) => {
	if (profiles.length == 0) {
		return
	}
	return db('profiles')
		.insert(profiles)
		.onConflict()
		.ignore()
}

export const saveFollows = (followee: Profile, followers: Profile[]) => {
	if (followers.length == 0) {
		return
	}

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