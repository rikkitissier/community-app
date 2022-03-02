const merge = require("deepmerge");

const VERSION = "1.0.1";
const BUILD_NO = "1003"; // String for iOS, int for Android

const _base = {
	expo: {
		sdkVersion: "38.0.0",
		orientation: "portrait",
		privacy: "unlisted",
		hooks: {
			postPublish: [
				{
					file: "sentry-expo/upload-sourcemaps",
					config: {
						organization: "ips-inc-s7"
					}
				}
			]
		},
		assetBundlePatterns: ["web/dist/index.html", "./resources/splash.png"],
		platforms: ["android", "ios"],
		extra: {
			refresh_token_advance: 300000,
			notification_timeout: 10000,
			message_prefix: "__IPS__",
			per_page: 20,
			remoteServicesUrl: "",
			privacyPolicyUrl: "",
			max_image_dim: 1000
		},
		version: VERSION,
		description: "",
		notification: {
			iosDisplayInForeground: true
		},
		ios: {
			buildNumber: BUILD_NO,
			supportsTablet: true,
			infoPlist: {
				NSCameraUsageDescription: "This app uses the camera to allow attaching photos to comments.",
				NSPhotoLibraryUsageDescription: "This app accesses your Photo Library to allow attaching photos to comments."
			}
		},
		android: {
			versionCode: parseInt(BUILD_NO),
			useNextNotificationsApi: true,
			permissions: [
				"ACCESS_COARSE_LOCATION",
				"ACCESS_FINE_LOCATION",
				"CAMERA",
				"MANAGE_DOCUMENTS",
				"READ_EXTERNAL_STORAGE",
				"WRITE_EXTERNAL_STORAGE",
				"com.google.android.c2dm.permission.RECEIVE"
			]
		},
		splash: {
			image: "./resources/splash.png",
			resizeMode: "cover"
		},
		icon: "./resources/icon.png"
	}
};

const combineMerge = (target, source, options) => {
	const destination = target.slice();

	source.forEach((item, index) => {
		if (typeof destination[index] === "undefined") {
			destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
		} else if (options.isMergeableObject(item)) {
			destination[index] = merge(target[index], item, options);
		} else if (target.indexOf(item) === -1) {
			destination.push(item);
		}
	});
	return destination;
};

const baseConfig = _custom => merge(_base, _custom, { arrayMerge: combineMerge });

module.exports = baseConfig;
