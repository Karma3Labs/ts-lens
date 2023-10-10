export const config = {
	ogs: [
		"yoginth.lens", "christina.lens", "mariariivari.lens",
		"bradorbradley.lens", "wagmi.lens", "levychain.lens", "nicolo.lens",
		"sasicodes.lens", "stani.lens", "davidev.lens" 
	],
	localtrustStrategies: [
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
			name: 'og01f1c8m3col12PriceTimed',
			pretrust: 'pretrustOGs',
			localtrust: 'f1c8m3col12PriceTimed',
			alpha: 0.1
		}, {
			name: 'og05f1c8m3col12PriceTimed',
			pretrust: 'pretrustOGs',
			localtrust: 'f1c8m3col12PriceTimed',
			alpha: 0.5
		}, {
			name: 'cur01f1c8m3col12PriceTimed',
			pretrust: 'pretrustCurated',
			localtrust: 'f1c8m3col12PriceTimed',
			alpha: 0.1
		}, {
			name: 'cur05f1c8m3col12PriceTimed',
			pretrust: 'pretrustCurated',
			localtrust: 'f1c8m3col12PriceTimed',
			alpha: 0.5
		}, {
			name: 'og01f1c3m8col12PriceTimed',
			pretrust: 'pretrustOGs',
			localtrust: 'f1c3m8col12PriceTimed',
			alpha: 0.1
		}, {
			name: 'og05f1c3m8col12PriceTimed',
			pretrust: 'pretrustOGs',
			localtrust: 'f1c3m8col12PriceTimed',
			alpha: 0.5
		}, {
			name: 'cur01f1c3m8col12PriceTimed',
			pretrust: 'pretrustCurated',
			localtrust: 'f1c3m8col12PriceTimed',
			alpha: 0.1
		}, {
			name: 'cur05f1c3m8col12PriceTimed',
			pretrust: 'pretrustCurated',
			localtrust: 'f1c3m8col12PriceTimed',
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