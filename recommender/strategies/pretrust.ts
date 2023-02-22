import { Pretrust } from '../../types'
import { getDB } from '../../utils';

export type PretrustStrategy = () => Promise<Pretrust>

const db = getDB()

const pretrustAllEqually: PretrustStrategy = async () => {
	return [] as Pretrust
}

const pretrustSpecificIds: PretrustStrategy = async () => {
	const pretrustedHandles = ['lensprotocol', 'aaveaave.lens']
	const ids = await db('profiles').select('id').whereIn('handle', pretrustedHandles)

	const pretrust: Pretrust = []

	ids.forEach(({ id }: { id: number }) => {
		pretrust.push({
			i: id,
			v: 1 / ids.length
		})
	})

	return pretrust
}

export const strategies: Record<string, PretrustStrategy> = {
	pretrustAllEqually,
	pretrustSpecificIds
}
