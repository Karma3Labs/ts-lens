import { saveComments, saveMirrors, savePosts, saveProfiles } from './db'
import { getProfilesBatch, getPostsBatch, getCommentsBatch, getMirrorsBatch, getStats } from './graphql'

const main = async () => {
	const stats = await getStats()
	const BATCH_SIZE = 100

	let profiles = []
	let posts = []
	let comments = []
	let mirrors = []

	let offset = 0
	do {
		console.log("[PROFILES] Batch", offset, offset + BATCH_SIZE, "of", stats.totalProfiles)
		profiles = await getProfilesBatch(offset, BATCH_SIZE)
		await saveProfiles(profiles)
		offset += BATCH_SIZE
	}
	while (profiles.length == BATCH_SIZE)

	offset = 0
	do {
		console.log("[POSTS] Batch", offset, offset + BATCH_SIZE, "of", stats.totalPosts)
		posts = await getPostsBatch(offset, BATCH_SIZE)
		await savePosts(posts)
		offset += BATCH_SIZE
	}
	while (posts.length == BATCH_SIZE)

	offset = 0
	do {
		console.log("[COMMENTS] Batch", offset, offset + BATCH_SIZE, "of", stats.totalComments)
		comments = await getCommentsBatch(offset, BATCH_SIZE)
		await saveComments(comments)
		offset += BATCH_SIZE
	}
	while (comments.length == BATCH_SIZE)

	offset = 0
	do {
		console.log("[COMMENTS] Batch", offset, offset + BATCH_SIZE, "of", stats.totalMirror)
		mirrors = await getMirrorsBatch(offset, BATCH_SIZE)
		await saveMirrors(mirrors)
		offset += BATCH_SIZE
	}
	while (mirrors.length == BATCH_SIZE)
}

main().then(() => console.log('Done'))