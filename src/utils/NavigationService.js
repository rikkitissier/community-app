import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { NavigationActions } from "react-navigation";
import _ from "underscore";
import isURL from "validator/lib/isURL";
import queryString from "query-string";

import parseUri from "./parseUri";
import configureStore from "../redux/configureStore";
import supported from "../supportedTypes";
import { resetModalWebview } from "../redux/actions/app";
import { launchAuth } from "../redux/actions/auth";

const store = configureStore();

class NavigationService {
	construct() {
		this._navigator = null;
	}

	/**
	 * Allows us to pass our navigatior component into this class
	 *
	 * @param 	object 		navigatorRef 		Reference to top-level navigator component
	 * @return 	void
	 */
	setTopLevelNavigator(navigatorRef) {
		this._navigator = navigatorRef;
	}

	/**
	 * Allows us to pass our community's base url
	 *
	 * @param 	string 		baseUrl 		Base URL for this community
	 * @return 	void
	 */
	setBaseUrl(baseUrl) {
		this._baseUrl = baseUrl;
		this._parsedBaseUrl = parseUri(this._baseUrl);
	}

	/**
	 * Launch an authorization webview
	 *
	 * @return 	void
	 */
	async launchAuth() {
		store.dispatch(launchAuth());
	}

	/**
	 * Generic method to trigger navigatation within the app.
	 * By default, will determine whether the provided URL/route components are supported by the app and
	 * navigate to the appropriate screen, or show a WebBrowser/WebView if not. Behavior can be overriden by
	 * the options object.
	 *
	 * @param 	string|object 		url 		A string url, or an object containing route components (app/module/controller) or a 'full' key
	 * @param 	object				params 		Params to be passed into loaded screen
	 * @param 	object 				options 	Options to configure behavior of this method. {
	 *		forceBrowser: bypass app screens and show in browser,
	 *		forceInteral: if shown in browser, show in 'internal' webview so it appears seamless
	 * }
	 * @return 	void
	 */
	navigate(url, params = {}, options = { forceBrowser: false, forceInternal: false }) {
		// If we're still here, make sure we have a correct URL
		if (_.isObject(url)) {
			// We might have 'url' or 'full' keys we can use
			if (!_.isUndefined(url.url)) {
				url = url.url;
			} else if (!_.isUndefined(url.full)) {
				url = url.full;
			} else {
				url = url.toString();
			}
		}

		// If we're still here, we don't have a screen to show for this URL, so we'll either
		// open it in an external browser or in a webview screen
		if ((this.isInternalUrl(url) && !options.forceBrowser) || options.forceInternal) {
			const urlToCheck = url.replace(this._baseUrl, "");
			const parsedUrl = parseUri(urlToCheck);

			// Loop through each url pattern we have and see if any match
			for (let i = 0; i < supported.urls.length; i++) {
				const urlType = supported.urls[i];

				if (urlType.test.test(urlToCheck)) {
					// URL matches, so feed it into .match to get the screen and params, if any
					const result = urlType.matchCallback(urlToCheck.match(urlType.test), urlToCheck, parsedUrl);

					if (result) {
						return this.navigateToScreen(result.routeName, Object.assign({}, params, result.params));
					}
				}
			}

			// If we make it here, load in our webview screen
			this.navigateToScreen("WebView", {
				...params,
				url
			});
		} else {
			this.openInBrowser(url);
		}
	}

	/**
	 * Determine whether the provided url is part of the app owner's site
	 *
	 * @param 	string 		url 	URL to check
	 * @return 	boolean
	 */
	isInternalUrl(url) {
		if (!this.isValidUrl(url)) {
			return false;
		}

		const thisUrl = parseUri(url);
		return thisUrl.host === this._parsedBaseUrl.host && thisUrl.path.startsWith(this._parsedBaseUrl.path);
	}

	/**
	 * Determine whether the provided string is a valid URL
	 *
	 * @param 	string 		url 	URL to check
	 * @return 	boolean
	 */
	isValidUrl(url) {
		return isURL(url);
	}

	/**
	 * Given app/module/controller components, returns the app screen that can be navigated to to show the content
	 *
	 * @param 	string 		app 		The app name
	 * @param 	string		module 		The module name
	 * @param 	string 		controller	The controller name
	 * @return 	string|boolean		Route name if available, false otherwise
	 */
	getScreenFromUrlComponents(app, module, controller) {
		let currentPiece = supported.appComponents;
		let renderComponent = false;
		let url = [app, module, controller];

		for (let i = 0; i < url.length; i++) {
			if (!_.isUndefined(currentPiece[url[i]]) && currentPiece[url[i]] !== false) {
				if (_.isObject(currentPiece[url[i]])) {
					currentPiece = currentPiece[url[i]];
					continue;
				} else {
					renderComponent = currentPiece[url[i]];
					break;
				}
			}
			return false;
		}

		return renderComponent;
	}

	/**
	 * Construct a local URL
	 *
	 * @param 	string 		routeName 		The screen name to navigate to
	 * @param 	object		params 			Params to pass into the screen
	 * @param 	string 		key 			A unique key, needed in case we're navigating to the same screen but e.g. with a different id. Auto-generated if not provided.
	 * @return 	void
	 */
	constructInternalUrl(params = {}) {
		const additionalParams = _.pairs(params).map(paramSet => `${paramSet[0]}=${encodeURIComponent(paramSet[1])}`);

		let outURL = `${this._baseURL}index.php?_webview=true&`;

		if (additionalParams.length) {
			outURL += additionalParams.join("&");
		}

		return outURL;
	}

	/**
	 * Navigate to the provided route (screen) name
	 *
	 * @param 	string 		routeName 		The screen name to navigate to
	 * @param 	object		params 			Params to pass into the screen
	 * @param 	string 		key 			A unique key, needed in case we're navigating to the same screen but e.g. with a different id. Auto-generated if not provided.
	 * @return 	void
	 */
	navigateToScreen(routeName, params = {}, key = null) {
		if (!key) {
			key = `${routeName}-${Math.floor(Math.random() * 100000)}`;
		}

		this._navigator.dispatch(
			NavigationActions.navigate({
				routeName,
				params,
				key
			})
		);
	}

	/**
	 * Open the provided url in the external WebBrowser. Does not check for internal/external url.
	 *
	 * @param 	string 		url 		URL to open
	 * @return 	Promise
	 */
	async openInBrowser(url) {
		let result = await WebBrowser.openBrowserAsync(url);
	}
}

let navigationService = new NavigationService();
export default navigationService;
