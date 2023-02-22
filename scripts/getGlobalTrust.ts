import yargs from 'yargs'
import path from 'path'
import fs from 'fs'
import Recommender from '../recommender'
import { getDB } from '../utils'
import { strategies as ptStrategies } from '../recommender/strategies/pretrust'
import { strategies as ltStrategies } from '../recommender/strategies/localtrust'

const db = getDB()

const main = async () => {
	const argv = yargs
		.scriptName("./scripts/getGlobalTrust.ts")
		.usage('$0 [args]')
		.option('pretrust_strategy', {
			alias: 'p',
			describe: 'Strategy that should be used to generate pretrust. The strategy should exist in recommender/strategies/pretrust.ts file and should not be personalized',
			type: 'string',
			default: 'pretrustAllEqually',
		}) 
		.option('localtrust_strategy', {
			alias: 'l',
			describe: 'Strategy that should be used to generate localtrust. The strategy should exist in recommender/strategies/localtrust.ts file',
			type: 'string',
			default: 'existingConnections',
		}) 
		.option('alpha', {
			alias: 'a',
			describe: 'A weight denoting how much the pretrust should affect the global trust',
			type: 'number',
			default: 0.3,
		})
		.help()
		.argv as { pretrust_strategy: string, localtrust_strategy: string, alpha: number }

	if (!ptStrategies[argv.pretrust_strategy]) {
		console.error(`Pretrust strategy: ${argv.pretrust_strategy} does not exist`)
		process.exit(1)
	}
	const pretrustStrategy = ptStrategies[argv.pretrust_strategy]
	console.log('Using pretrust strategy:', argv.pretrust_strategy)

	if (!ltStrategies[argv.localtrust_strategy]) {
		console.error(`Localtrust strategy: ${argv.localtrust_strategy} does not exist`)
		process.exit(1)
	}
	const localtrustStrategy = ltStrategies[argv.localtrust_strategy]
	console.log('Using localtrust strategy:', argv.localtrust_strategy)


	const recommender = new Recommender(pretrustStrategy, localtrustStrategy, argv.alpha)
	await recommender.loadFromDB()
	const globalTrust = recommender.globaltrust

	const handles = await db('profiles').select('handle', 'id');
	const handlesMap: Record<string, number> = {}
	for (const { id, handle } of handles) {
		handlesMap[id] = handle
	}

	let csv = 'id,handle,globalTrust\n'
	csv += Object.entries(globalTrust).map((gt) => `${gt[0]},${handlesMap[gt[0]]},${gt[1]}`).join('\n')
	fs.writeFileSync(path.join(__dirname, '../../globaltrust.csv'), csv)

	console.log('Done! (see globaltrust.csv)')
	process.exit()
}

main()