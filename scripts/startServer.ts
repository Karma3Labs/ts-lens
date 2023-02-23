import yargs from 'yargs'
import Recommender from '../recommender'
import serve from '../server/index'
import { strategies as ptStrategies } from '../recommender/strategies/pretrust'
import { strategies as ltStrategies } from '../recommender/strategies/localtrust'
import { strategies as psStrategies } from '../recommender/strategies/personalization'

const main = async () => {
	const argv = yargs
		.scriptName("./scripts/start-server.ts")
		.usage('$0 [args]')
		.option('pretrust', {
			describe: 'Strategy that should be used to generate pretrust. The strategy should exist in recommender/strategies/pretrust.ts file',
			type: 'string',
			default: 'pretrustAllEqually',
		}) 
		.option('localtrust', {
			describe: 'Strategy that should be used to generate localtrust. The strategy should exist in recommender/strategies/localtrust.ts file',
			type: 'string',
			default: 'existingConnections',
		}) 
		.option('personalization', {
			describe: 'Strategy that should be used to generate personalized results from the global trust.',
			type: 'string',
			default: 'useFollows',
		}) 
		.option('alpha', {
			describe: 'A weight denoting how much the pretrust should affect the global trust',
			type: 'number',
			default: 0.5,
		})
		.help()
		.argv as { pretrust: string, localtrust: string, personalization: string, alpha: number }

	if (!ptStrategies[argv.pretrust]) {
		console.error(`Pretrust strategy: ${argv.pretrust} does not exist`)
		process.exit(1)
	}
	const pretrustStrategy = ptStrategies[argv.pretrust]
	console.log('Using pretrust strategy:', argv.pretrust)

	if (!ltStrategies[argv.localtrust]) {
		console.error(`Localtrust strategy: ${argv.localtrust} does not exist`)
		process.exit(1)
	}
	const localtrustStrategy = ltStrategies[argv.localtrust]
	console.log('Using localtrust strategy:', argv.localtrust)

	if (!psStrategies[argv.personalization]) {
		console.error(`Personalization strategy: ${argv.personalization} does not exist`)
		process.exit(1)
	}
	const personalizationStrategy = psStrategies[argv.personalization]
	console.log('Using personalization strategy:', argv.personalization)

	const recommender = new Recommender(pretrustStrategy, localtrustStrategy, argv.alpha, personalizationStrategy)
	await recommender.loadFromDB(argv.pretrust, argv.localtrust, argv.alpha)

	serve(recommender)
}

main()