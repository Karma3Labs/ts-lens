import { chunk } from 'lodash'
import { Follow, Profile } from '../types'
import { getDB } from '../utils'

const db = getDB()

export const getFollowees = async (): Promise<string[]> => {
	const records = await db.select('followee').distinctOn('followee').from('follows')
	return records.map((f: { followee: string }) => f.followee)
}

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

	const chunks = chunk(follows, 1000)
	for (const chunk of chunks) {
		return db('follows')
			.insert(chunk)
			.onConflict()
			.ignore()
	}
}