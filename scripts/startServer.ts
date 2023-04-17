import serve from '../server/index'
import { getDB } from '../utils'

const db = getDB()

const main = async () => {
	serve()
}

main()