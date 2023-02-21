import { Pretrust } from '../../types'
import { getDB } from '../../utils';

export type PretrustPicker = (id?: number) => Promise<Pretrust>
export type PretrustStrategy = {picker: PretrustPicker, personalized: boolean}

const db = getDB()

const pretrustAllEqually: PretrustPicker = async () => {
	return [] as Pretrust
}

const pretrustSpecificIds: PretrustPicker = async () => {
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

const pretrustFollowsOfId: PretrustPicker = async (id?: number) => {
	const pretrust: Pretrust = []
	const follows = await db('follows')
		.select('profile_id as following_id', 'profiles.id as follower_id')
		.innerJoin('profiles', 'owner_address', 'follower_address')
		.where('following_id', id)

	follows.forEach((follow: number) => {
		pretrust.push({
			i: follow,
			v: 1 / follows.length
		})
	})

	return pretrust
}


export const strategies: Record<string, PretrustStrategy> = {
	pretrustAllEqually: { picker: pretrustAllEqually, personalized: false },
	pretrustSpecificIds: { picker: pretrustSpecificIds, personalized: false },
	pretrustFollowsOfId: { picker: pretrustFollowsOfId, personalized: true },
}
