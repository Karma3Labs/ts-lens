export const config = {
	localtrustStrategies: {
		1: 'existingConnections',
		2: 'f6c3m8enhancedConnections',
		3: 'f6c3m8col12enhancedConnections'
	},
	pretrustStrategies: {
		1: 'pretrustOGs',
		2: 'pretrustFirstFifty',
		3: 'pretrustAllEqually'
	},
	contentStrategies: {
		1: 'viralPosts',
	},
	rankingStrategies: [{
			name: 'followship',
			pretrust: 'pretrustOGs',
			localtrust: 'existingConnections',
			alpha: 0.5
		}, {
			name: 'engagement',
			pretrust: 'pretrustOGs',
			localtrust: 'f6c3m8enhancedConnections',
			alpha: 0.5
		}, {
			name: 'influencer',
			pretrust: 'pretrustOGs',
			localtrust: 'f6c3m8col12enhancedConnections',
			alpha: 0.5
		}
	],
	personalization: {
		globaltrust: 'followship',
		ltStrategyName: 'existingConnections',
		limitGlobaltrust: 100
	},
	content: {
		strategy: "viralPosts",
		limitUsers: 50,
	},
	feed: {
		strategy: "viralPosts",
		globaltrust: "followship",
		globaltrustSize: 100,
	}
}