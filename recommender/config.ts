export const config = {
	localtrustStrategies: [
		'existingConnections',
		'f6c3m8enhancedConnections',
		'f6c3m8col12enhancedConnections'
	],
	pretrustStrategies: [
		'pretrustOGs',
		'pretrustFirstFifty',
		'pretrustAllEqually'
	],
	contentStrategies: [
		'viralPosts',
	],
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
	feedStrategies: [{
		name: "engagement-viralPosts",
		feed: "viralFeedWithEngagement",
		limit: 100,
	}, {
		name: "latest",
		feed: "latestFeed",
		limit: 100,
	}],
	personalization: {
		globaltrust: 'followship',
		ltStrategyName: 'existingConnections',
		limitGlobaltrust: 100
	},
	content: {
		strategy: "viralPosts",
		limitUsers: 50,
	},
}