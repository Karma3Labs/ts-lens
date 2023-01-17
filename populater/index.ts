import { join } from 'path'
import { getDB } from '../utils'

const main = async () => {
	const db = getDB()

	const edgesFile = join(__dirname, 'edges.csv')
	await db.raw(`copy
		follows(followee,follower)
		from '${edgesFile}'
		delimiter ',';
	`)

	const nodesFile = join(__dirname, 'nodes.csv')
	await db.raw(`copy
		profiles(handle)
		from '${nodesFile}'
		delimiter ',';
	`)
}

main().then(() => console.log('Done'))