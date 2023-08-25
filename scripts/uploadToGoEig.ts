import { getIds } from '../recommender/utils'
import { config } from '../recommender/config'
import LocaltrustGenerator from '../recommender/LocaltrustGenerator'

const main = async () => {
	const generator = new LocaltrustGenerator()
	const strategies = config.localtrustStrategies
	const ids = await getIds()
	const args = process.argv.slice(2);
	const schema = args[0] || "public"; // Default to "public" if no argument is given

	for (const name of strategies) {
		const localtrust = await generator.getLocaltrust(name, schema)
		if (!localtrust.length) {
			console.log(`No localtrust for ${name} found, skipping`)
			continue
		}
		await generator.uploadLocaltrust(name, localtrust, ids)
	}
}

main()