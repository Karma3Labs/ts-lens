export const config = {
	ogs: [
		"yoginth", "christina", "mariariivari",
		"bradorbradley", "wagmi", "levychain", "nicolo",
		"sasicodes", "stani", "davidev" 
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
		'pretrustPhotoArt',
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
		}, {
			strategyName: 'photoart',
			pretrust: 'pretrustPhotoArt',
			localtrust: 'f1c8m3col12PriceTimed',
			alpha: 0.8
		},
	],
	sqlFeedStrategies: [{
			name: "popular",
			feed: "viralFeedWithEngagement",
			ranking: "engagement",
			limit: 100,
		}, {
			name: "recent",
			feed: "latestFeed",
			ranking: undefined,
			limit: 100,
		}, {
			name: "photoart",
			feed: "viralFeedWithPhotoArt",
			ranking: "photoart",
			limit: 100,
		}, {
			name: "spam",
			feed: "spamFeed",
			ranking: "engagement",
			limit: 100,
		}, {
			name: "newcomer",
			feed: "newcomerFeed",
			ranking: undefined,
			limit: 100,
		}
	],
	algoFeedStrategies: [{
		name: "recommended",
		feed: "ml-xgb-followship",
		ranking: undefined,
		limit: 100,
	},{
		name: "crowdsourced",
		feed: "hubs-and-authorities",
		ranking: undefined,
		limit: 100,
	}],
	personalFeedStrategies: [{
		name: "following",
		feed: "followingViralFeedWithEngagement",
		ranking: undefined,
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