export const config = {
	ogs: [
		"yoginth.lens", "christina.lens", "mariariivari.lens",
		"bradorbradley.lens", "wagmi.lens", "levychain.lens", "nicolo.lens",
		"sasicodes.lens", "stani.lens", "davidev.lens" 
	],
	localtrustStrategies: [
		'f1',
		'f6c3m8',
		'f6c3m8col12',
		'f6c3m8col12Price',
		'f1c3m8col12PriceTimed',
		'f1c8m3col12PriceTimed',
	],
	pretrustStrategies: [
		'pretrustOGs',
		'pretrustFirstFifty',
		'pretrustAllEqually',
		'pretrustCurated',
	],
	contentStrategies: [
		'viralPosts',
	],
	rankingStrategies: [{
			strategyName: 'followship',
			pretrust: 'pretrustOGs',
			localtrust: 'f1',
			alpha: 0.5
		}, {
			strategyName: 'engagement',  //WARNING: this feed is used by Feeds including Popular, HnA, ML
			pretrust: 'pretrustOGs',
			localtrust: 'f6c3m8',
			alpha: 0.5
		}, {
			strategyName: 'influencer',
			pretrust: 'pretrustOGs',
			localtrust: 'f6c3m8col12',
			alpha: 0.1
		}, {
			strategyName: 'creator',
			pretrust: 'pretrustOGs',
			localtrust: 'f1c8m3col12PriceTimed',
			alpha: 0.5
		},
	],
	sqlFeedStrategies: [{
		name: "popular",
		feed: "viralFeedWithEngagement",
		limit: 100,
	}, {
		name: "recent",
		feed: "latestFeed",
		limit: 100,
	}],
	algoFeedStrategies: [{
		name: "recommended",
		feed: "ml-xgb-followship",
		limit: 100,
	},{
		name: "crowdsourced",
		feed: "hubs-and-authorities",
		limit: 100,
	}],
	personalFeedStrategies: [{
		name: "following",
		feed: "followingViralFeedWithEngagement",
		limit: 100,
	}],
	personalization: { // for personalized EigenTrust
		globaltrust: 'followship',
		ltStrategyName: 'existingConnections',
		limitGlobaltrust: 100
	},
	content: {
		strategy: "viralPosts",
		limitUsers: 50,
	},
}