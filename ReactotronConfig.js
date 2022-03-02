import { AsyncStorage } from "react-native";
import Reactotron, { networking, asyncStorage, trackGlobalErrors } from "reactotron-react-native";
import { reactotronRedux } from "reactotron-redux";

const reactotron = Reactotron.setAsyncStorageHandler(AsyncStorage) // AsyncStorage would either come from `react-native` or `@react-native-community/async-storage` depending on where you get it from
	.configure({ host: "192.168.1.10", port: 9999 }) // controls connection & communication settings
	.useReactNative() // add all built-in react native plugins
	.use(
		networking({
			ignoreUrls: /\/(logs|symbolicate)$/
		})
	)
	.use(reactotronRedux())
	.use(
		trackGlobalErrors({
			veto: frame => frame.fileName.indexOf("/node_modules/react-native/") >= 0
		})
	)
	.use(asyncStorage());

//if (__DEV__) {
reactotron.connect(); // let's connect!
console.tron = Reactotron;
//}

export default reactotron;
