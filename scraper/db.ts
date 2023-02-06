import { chunk } from 'lodash'
import { Post, Profile } from '../types'
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

export const savePosts = (posts: Post[]) => {
	if (posts.length == 0) {
		return
	}

	return db('posts')
		.insert(posts)
		.onConflict()
		.ignore()
}

export const saveComments = (comments: Comment[]) => {
	if (comments.length == 0) {
		return
	}

	return db('comments')
		.insert(comments)
		.onConflict()
		.ignore()
}

export const saveMirrors = (mirrors: Comment[]) => {
	if (mirrors.length == 0) {
		return
	}

	return db('mirrors')
		.insert(mirrors)
		.onConflict()
		.ignore()
}
