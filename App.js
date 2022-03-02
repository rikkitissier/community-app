import React, { Component } from "react";
import { AppState, UIManager, AsyncStorage } from "react-native";
import { Provider } from "react-redux";
import configureStore from "./src/redux/configureStore";
import { connect } from "react-redux";
import * as Sentry from "sentry-expo";
import { Asset } from "expo-asset";
import { AppLoading } from "expo";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Reactotron from "reactotron-react-native";

if (__DEV__) {
	import("./ReactotronConfig").then(() => {
		console.log("Reactotron Configured");
		Reactotron.clear();
	});
} else {
	console.log = () => {};
	console.tron = { log: console.log };
}

// Note: this caused a crash after auth on android; check for compatibility in future
//seScreens();

global.Buffer = global.Buffer || require("buffer").Buffer;

import AppRoot from "./src/screens/ips/AppRoot";
import icons, { splashImage, illustrations, navigationIcons } from "./src/icons";

const store = configureStore();

/*if (process.env.NODE_ENV !== 'production') {
const {whyDidYouUpdate} = require('why-did-you-update');
whyDidYouUpdate(React, { include: [/^Post/], exclude: /^YellowBox/ });
}*/

// Remove this once Sentry is correctly setup.
//Sentry.enableInExpoDevelopment = true;
Sentry.init({
	dsn: Expo.Constants.manifest.extra.sentryDsn,
	enableInExpoDevelopment: true,
	debug: true
});

export default class App extends Component {
	constructor(props) {
		super(props);
		UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
		this.state = {
			isReady: false
		};
	}

	async cacheResourcesAsync() {
		// Get the key:value icons etc.
		const imagesToCache = [icons, illustrations, navigationIcons].map(obj => Object.values(obj)).flat();

		// Add splash screen
		imagesToCache.push(splashImage);

		// Now download
		const cacheImages = imagesToCache.map(image => {
			return Asset.fromModule(image).downloadAsync();
		});

		return Promise.all(cacheImages);
	}

	render() {
		if (!this.state.isReady) {
			return <AppLoading startAsync={this.cacheResourcesAsync} onFinish={() => this.setState({ isReady: true })} onError={msg => console.log(msg)} />;
		}

		return (
			<Provider store={store}>
				<SafeAreaProvider>
					<AppRoot />
				</SafeAreaProvider>
			</Provider>
		);
	}
}
