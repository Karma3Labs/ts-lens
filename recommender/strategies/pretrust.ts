import { id } from 'ethers/lib/utils';
import { Pretrust } from '../../types'
import { getFollowsOfHandle } from '../utils'

export type PretrustPicker = (id?: string) => Promise<Pretrust<string>>
export type PretrustStrategy = {picker: PretrustPicker, personalized: boolean}

const pretrustAllEqually: PretrustPicker = async () => {
	return [] as Pretrust<string>
}

const pretrustSpecificHandles: PretrustPicker = async () => {
	const pretrustedIds = ['lensprotocol', 'aaveaave.lens']
	const pretrust: Pretrust<string> = []

	pretrustedIds.forEach((follower) => {
		pretrust.push({
			i: follower,
			v: 1 / pretrustedIds.length
		})
	})

	return pretrust
}

const pretrustFollowsOfHandle: PretrustPicker = async (startHandle?: string) => {
	const pretrust: Pretrust<string> = []
	const follows = await getFollowsOfHandle(startHandle!)

	follows.forEach((follow) => {
		pretrust.push({
			i: follow,
			v: 1 / follows.size
		})
	})

	return pretrust
}


export const strategies: Record<string, PretrustStrategy> = {
	pretrustAllEqually: { picker: pretrustAllEqually, personalized: false },
	pretrustSpecificHandles: { picker: pretrustSpecificHandles, personalized: false },
	pretrustFollowsOfHandle: { picker: pretrustFollowsOfHandle, personalized: true },
}
