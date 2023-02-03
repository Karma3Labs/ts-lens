import { getSubgraphDB } from "./utils"
import { getDB } from "../utils"

const main = async () => {
	const subgraphDB = await getSubgraphDB()
	const db = await getDB()

	const BATCH_SIZE = 1000
	let offset = 0
	
	// migrate all profiles		
	let profiles: any[] = []
	do {
		profiles = await subgraphDB.select('profile_id', 'handle', 'followings', 'created_at').from('sgd1.profile').offset(offset).limit(100)
		await db('profiles').insert(profiles).onConflict().ignore()
		offset += BATCH_SIZE
	}
	while (profiles.length == BATCH_SIZE)

	// migrate all posts		
	let posts: any[] = []
	offset = 0
	do {
		posts = await subgraphDB.select('id', 'pub_id', 'from_profile', 'timestamp').from('sgd1.post').offset(offset).limit(100)
		await db('posts').insert(posts).onConflict().ignore()
	}
	while (posts.length == BATCH_SIZE)

	// migrate all comments		
	let comments: any[] = []
	offset = 0
	do {
		comments = await subgraphDB.select('id', 'pub_id', 'from_profile', 'profile_id_pointed', 'pub_id_pointed', 'timestamp').from('sgd1.comment').offset(offset).limit(100)
		await db('comments').insert(comments).onConflict().ignore()
	}
	while (comments.length == BATCH_SIZE)

	// migrate all mirrors		
	let mirrors: any[] = []
	offset = 0
	do {
		mirrors = await subgraphDB.select('id', 'pub_id', 'from_profile', 'profile_id_pointed', 'pub_id_pointed', 'timestamp').from('sgd1.mirror').offset(offset).limit(100)
		await db('mirrors').insert(mirrors).onConflict().ignore()
	}
	while (mirrors.length == BATCH_SIZE)
}