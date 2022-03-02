export default function getUserAgent() {
	if (Expo.Constants.platform.ios) {
		return `InvisionCommunityApp/${Expo.Constants.manifest.version} (${Expo.Constants.manifest.name}) iOS/${Expo.Constants.platform.ios.systemVersion} (${Expo.Constants.platform.ios.platform})`;
	} else {
		return `InvisionCommunityApp/${Expo.Constants.manifest.version} (${Expo.Constants.manifest.name}) Android (${Expo.Constants.deviceName})`;
	}
}
