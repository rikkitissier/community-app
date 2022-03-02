const baseConfig = require("../baseConfig");

module.exports = baseConfig({
	expo: {
		extra: {
			multi: false,
			oauth_client_id: "",
			api_url: "",
			sentryDsn: "",
			experienceId: "invision-community"
		},
		name: "Invision Community",
		slug: "invision-community",
		scheme: "invision-community",
		ios: {
			bundleIdentifier: "com.invisioncommunity.app"
		},
		android: {
			googleServicesFile: "./config/ips/assets/google-services.json",
			package: "com.invisioncommunity.app"
		},
		primaryColor: "#3370AA"
	}
});
