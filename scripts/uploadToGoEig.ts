import { getIds } from '../recommender/utils'
import { config } from '../recommender/config'
import LocaltrustGenerator from '../recommender/LocaltrustGenerator'

const main = async () => {
	const generator = new LocaltrustGenerator()
	const strategies = config.localtrustStrategies
	const ids = await getIds()

	for (const name of strategies) {
		const localtrust = await generator.getLocaltrust(name)
		if (!localtrust.length) {
			console.log(`No localtrust for ${name} found, skipping`)
			continue
		}
		await generator.uploadLocaltrust(name, localtrust, ids)
	}
}

main()