const baseConfig = require("../baseConfig");

module.exports = baseConfig({
	expo: {
		extra: {
			multi: true,
			oauth_client_id: "",
			api_url: "",
			sentryDsn: "",
			experienceId: "invision-communities"
		},
		name: "Communities",
		slug: "invision-communities",
		scheme: "invisioncommunities",
		ios: {
			bundleIdentifier: "com.invisioncommunity.communities"
		},
		android: {
			googleServicesFile: "./config/multi/assets/google-services.json",
			package: "com.invisioncommunity.communities"
		},
		primaryColor: "#3370AA"
	}
});
