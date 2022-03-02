import React, { Component } from "react";
import { View, Alert, StyleSheet, AsyncStorage, Platform, AppState } from "react-native";
import { compose } from "react-apollo";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import * as Permissions from "expo-permissions";
import { connect } from "react-redux";
import Toast from "react-native-root-toast";
import _ from "underscore";

import {
	bootSite,
	switchAppView,
	setActiveCommunity,
	resetActiveCommunity,
	resetBootStatus,
	receiveNotification,
	clearCurrentNotification,
	loadCommunities,
	setContentView,
	shiftToast,
	setDarkModeState,
	getUserLanguageFilter,
	logMessage
} from "../../redux/actions/app";
import { refreshToken } from "../../redux/actions/auth";
import MultiCommunityNavigation from "../../navigation/MultiCommunityNavigation";
import { PromptModal, LocalNotification } from "../../ecosystems/PushNotifications";
import CommunityRoot from "./CommunityRoot";
import AppLoading from "../../atoms/AppLoading";
import NavigationService from "../../utils/NavigationService";
import NotificationChannels from "../../NotificationChannels.json";
import { withTheme } from "../../themes";

class AppRoot extends Component {
	constructor(props) {
		super(props);

		this._isSingleApp = !Expo.Constants.manifest.extra.multi;
		this._notificationSubscription = null;
		this._alerts = {
			offline: false
		};

		this.state = {
			waitingForClient: this._isSingleApp,
			showNotificationPrompt: false,
			redirectToNotification: null
		};

		this.handleOpenUrl = this.handleOpenUrl.bind(this);
		this.closeNotificationPrompt = this.closeNotificationPrompt.bind(this);
		this.handleNotification = this.handleNotification.bind(this);

		Linking.addEventListener("url", this.handleOpenUrl);
	}

	/**
	 * Mount. If we're in a single-app environment, immediately switch to the
	 * community.
	 *
	 * @return 	void
	 */
	async componentDidMount() {
		this.props.dispatch(
			logMessage({
				message: `AppState is ${AppState.currentState}`
			})
		);

		// Push notification stuff
		await this.setUpNotificationChannels();
		this.maybeDoNotificationPrompt();
		this._notificationSubscription = Notifications.addNotificationReceivedListener(this.handleNotification);

		Notifications.setNotificationHandler({
			handleNotification: async () => ({
				shouldShowAlert: true,
				shouldPlaySound: false,
				shouldSetBadge: false
			})
		});

		// If we're running in single-site mode
		if (this._isSingleApp) {
			this.props.dispatch(
				setActiveCommunity({
					apiUrl: Expo.Constants.manifest.extra.api_url,
					apiKey: Expo.Constants.manifest.extra.oauth_client_id
				})
			);
		}

		// Get user language filter (multi-app)
		if (!this._isSingleApp) {
			this.props.dispatch(getUserLanguageFilter());
		}

		const initialUrl = await Linking.getInitialURL();
		this.checkUrlForAuth(initialUrl);

		// Set the content view setting to the default setting
		this.props.dispatch(setContentView());

		// Dark mode
		try {
			const darkMode = await AsyncStorage.getItem("@darkMode");

			if (darkMode !== null) {
				this.props.dispatch(
					setDarkModeState({
						enableDarkMode: true
					})
				);
			}
		} catch (err) {
			// No dark mode value
		}
	}

	async handleNotification(notification) {
		//console.log(`APP_ROOT: Received notification data`);
		//console.log(notification);

		// This seemed to cause push notifications to not properly redirect to webview,
		// because this method was called twice - the second time with a null notification
		// object.
		if (!notification) {
			return;
		}

		//if (notification.origin == "received" && Platform.OS == "ios") {
		//Alert.alert("In-app notification!", "App was foregrounded", [{ text: "OK", onPress: () => console.log("OK Pressed") }], { cancelable: false });
		//this.refs.notificationToast.show(<LocalNotification title="Just a test" />, 3000);
		//} else {
		await this.props.dispatch(loadCommunities());
		await this.props.dispatch(receiveNotification(notification.data));
		//}
	}

	/**
	 * Unmount; clear up our timer.
	 *
	 * @return 	void
	 */
	componentWillUnmount() {
		clearTimeout(this._notificationPromptTimeout);
	}

	/**
	 * Add the Android notification channels we need
	 *
	 * @return 	void
	 */
	async setUpNotificationChannels() {
		if (Platform.OS !== "android") {
			return;
		}

		for (const channel of NotificationChannels) {
			await Notifications.setNotificationChannelAsync(channel.id, {
				name: channel.name,
				...(channel.description ? { description: channel.description } : {}),
				...(channel.sound ? { sound: channel.sound } : { sound: false })
			});
		}

		console.log(`Set up ${NotificationChannels.length} Android notification channels`);
	}

	/**
	 * Handles incoming URLs. If it's an authentication url (e.g. post-registering), then
	 * process it.
	 *
	 * @param 	string 		url 	The incoming URL
	 * @return 	void
	 */
	checkUrlForAuth(url) {
		console.log(`APP_ROOT: Initial URL: ${url}`);

		let { path, queryParams } = Linking.parse(url);

		if (_.isUndefined(path) || path !== "auth") {
			return;
		}

		if (!_.isUndefined(queryParams["state"])) {
			// @todo handle incoming validation
			//dispatch(incomingValidation(queryParams));
		}

		// Do we have an authentication token to process?
	}

	/**
	 * Event handling for the 'url' event, passes url to `this.checkUrlForAuth`
	 *
	 * @param 	{url: string} 		url 		The incoming URL
	 * @return 	void
	 */
	handleOpenUrl({ url }) {
		this.checkUrlForAuth(url);
	}

	/**
	 * If necessary, show the notification prompt
	 *
	 * @param 	{url: string} 		url 		The incoming URL
	 * @return 	void
	 */
	async maybeDoNotificationPrompt() {
		// We only need to prompt for this on iOS - android handles notifications
		// on app install.
		if (!Expo.Constants.platform.ios) {
			return;
		}

		// Have we already been granted permission?
		const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
		//console.log(`APP_ROOT: Notification status: ${status}`);

		if (status == "granted") {
			return;
		}

		// Only show the prompt if there's no previous prompt data, or there is and the status is 'later'.
		// We can't show the prompt again if the user previously choose 'enable', even if they didn't actually
		// enable them when asked.
		try {
			const promptData = await AsyncStorage.getItem("@notificationPrompt");
			const promptJson = promptData !== null ? JSON.parse(promptData) : null;

			//console.log(`APP_ROOT: Notification prompt JSON:`);
			//console.log(promptJson);

			if (promptData === null || (promptJson.status == "later" && promptJson.timestamp < Math.floor(Date.now() / 1000) - 604800)) {
				this._notificationPromptTimeout = setTimeout(() => {
					this.setState({
						showNotificationPrompt: true
					});
				}, 3000);
			}
		} catch (err) {
			console.log(`APP_ROOT: Failed to show notification prompt: ${err}`);
		}
	}

	/**
	 * Component update. Handes booting a new community if the URL has changed, and switching
	 * view if we're in the multi-community environment
	 *
	 * @param 	object 		prevProps 		Previous prop values
	 * @return
	 */
	async componentDidUpdate(prevProps) {
		const { dispatch, componentStyles } = this.props;
		const { apiKey, apiUrl } = this.props.app.currentCommunity;
		const prevApiUrl = prevProps.app.currentCommunity.apiUrl;

		// --------------------------------------------------------------------
		// Authentication/site changing stuff
		// If we have a new API url in our store, authorize and boot that community
		// This can happen when a user chooses to launch a community, or when a notification
		// is tapped and we automatically switch community.
		if (prevApiUrl !== apiUrl && apiUrl !== null) {
			await dispatch(refreshToken({ apiKey, apiUrl }));
			await dispatch(bootSite({ apiKey, apiUrl }));

			NavigationService.setBaseUrl(this.props.site.settings.base_url);

			this.setState({
				waitingForClient: this._isSingleApp ? false : null
				//redirectToNotification: null // reset to null in case we loaded this community via a notification
			});
		}

		// If our authenticated state has changed, we need to get a new client and reboot the community
		// We only want to do this if we're still using the same community URL
		if (prevApiUrl === apiUrl && prevProps.auth.isAuthenticated !== this.props.auth.isAuthenticated) {
			console.log("APP_ROOT: Rebooting site after authentication change.");
			await dispatch(bootSite({ apiKey, apiUrl }));
		}

		// --------------------------------------------------------------------
		// Handle incoming notifications
		if (this.props.app.notification !== null) {
			console.log("got notification data in componentDidUpdate");
			this.redirectFromNotification();
		}

		// --------------------------------------------------------------------
		// Multi-community stuff

		if (!this._isSingleApp) {
			// If we were booting a community and that's finished, switch to our community
			if ((!prevProps.app.bootStatus.loaded && this.props.app.bootStatus.loaded) || (!prevProps.app.bootStatus.error && this.props.app.bootStatus.error)) {
				this.multiCommunityCheckStatusAndRedirect();
			}

			// If we've switched back to the multi community, reset stuff
			if (prevProps.app.view !== "multi" && this.props.app.view === "multi") {
				this.props.dispatch(resetActiveCommunity());
				this.props.dispatch(resetBootStatus());
			}
		}

		// --------------------------------------------------------------------
		// Flash messages
		if (prevProps.app.toast !== this.props.app.toast && this.props.app.toast.length) {
			// Get the first item
			const toast = this.props.app.toast[0];

			Toast.show(toast.message, {
				duration: 2000,
				position: -35,
				shadow: false,
				opacity: 1,
				animation: true,
				hideOnPress: true,
				delay: 0,
				containerStyle: componentStyles.toastContainerStyle,
				textStyle: componentStyles.toastTextStyle,
				onHidden: () => {
					this.props.dispatch(shiftToast());
				}
			});
		}
	}

	/**
	 * Handles redirecting the app to the correct community, loading it
	 * if it isn't the currently-loaded one. Then sets the notification in state
	 * which will be passed into CommunityRoot to do the redirect.
	 *
	 * @return void
	 */
	async redirectFromNotification() {
		this.props.dispatch(clearCurrentNotification());

		// If we're in the multi-app, we need to figure out which community this notification is for,
		// and then boot it if it isn't already loaded.
		if (Expo.Constants.manifest.extra.multi) {
			const {
				community: { url }
			} = this.props.app.notification;
			// We need to find the community info associated with this notification
			const communityToLoad = _.find(this.props.app.communities.data, current => {
				return current.url === url;
			});

			// If we didn't find a matching community, let the user know
			if (_.isUndefined(communityToLoad)) {
				Alert.alert(
					"Couldn't Load Content",
					"Sorry, we aren't able to load this content right now.",
					[
						{
							text: "OK",
							style: "default",
							onPress: () => {}
						}
					],
					{
						cancelable: false
					}
				);

				return;
			}

			const { client_id: apiKey, url: apiUrl } = communityToLoad;

			// Is this community already loaded?
			if (this.props.app.currentCommunity.apiUrl === apiUrl) {
				console.log("This community is already loaded");
			} else {
				// Otherwise, we can load the community
				console.log("APP_ROOT: Switching community...");
				this.props.dispatch(resetBootStatus());
				this.props.dispatch(resetActiveCommunity());
				await this.props.dispatch(setActiveCommunity({ apiKey, apiUrl }));
				// From here, componentDidUpdate will see the change and load the community
			}
		}

		console.log("Setting redirectToNotification");
		// Set the notification data in state so we can pass it into CommunityRoot
		this.setState({
			redirectToNotification: {
				...this.props.app.notification
			}
		});
	}

	/**
	 * Called once a community has loaded; checks whether we're actually able to access it,
	 * and shows an alert if need be. If all is well, redirect to the community screen.
	 *
	 * @return 	void
	 */
	multiCommunityCheckStatusAndRedirect() {
		const { apiUrl, apiKey, name, logo, description } = this.props.app.currentCommunity;

		// Did we have an error loading this community?
		if (this.props.app.bootStatus.error) {
			this.multiCommunityShowAlert(
				"error",
				{ title: "Error", body: this.props.app.bootStatus.error }, //`Sorry, there was a problem loading ${this.props.site.settings.board_name}.`
				"Try Again",
				() => {
					this.props.dispatch(resetBootStatus());
					this.props.dispatch(resetActiveCommunity());
					this.props.dispatch(
						setActiveCommunity({
							apiKey,
							apiUrl,
							name,
							logo,
							description
						})
					);
				},
				true
			);
			return;
		}

		// If we can't access this community, we might either be banned or need to log in to see it
		if (!this.props.user.group.canAccessSite) {
			if (this.props.user.group.groupType !== "GUEST") {
				this.multiCommunityShowAlert(
					"banned",
					{
						title: "No Permission",
						body: `Sorry, you do not have permission to access ${this.props.site.settings.board_name}.`
					},
					"OK",
					() => {
						this.props.dispatch(resetBootStatus());
						this.props.dispatch(resetActiveCommunity());
					}
				);
				return;
			} else {
				this.multiCommunityShowAlert(
					"login",
					{
						title: "Sign In Required",
						body: `${this.props.site.settings.board_name} requires you to sign in to view the community.`
					},
					"Sign In",
					() => {
						NavigationService.launchAuth();
					},
					true
				);
				return;
			}
		}

		// If the site is offline, and we don't have permission to access it...
		// @future Right now we don't give them to option to sign in in this situation
		if (!this.props.site.settings.site_online) {
			if (!this.props.user.group.canAccessOffline) {
				this.multiCommunityShowAlert(
					"offline",
					{
						title: "Community Offline",
						body: `${this.props.site.settings.board_name} is currently offline. Please try again later.`
					},
					"OK",
					() => {
						this.props.dispatch(resetBootStatus());
						this.props.dispatch(resetActiveCommunity());
					}
				);
				return;
			}
		}

		this.multiCommunitySwitchToCommunity();
	}

	/**
	 * Show an alert to the user with the specific message
	 *
	 * @param 	string 		type 			The type of message. Used to prevent multiples of the same type appearing at once.
	 * @param 	object 		message 		Object containing `title`: title of the alert, and `body`: message to show in it
	 * @param 	boolean 	enabledButtons	Pass a button config object. Merged with defaults.
	 * @return 	void
	 */
	multiCommunityShowAlert(type, message, primaryText = "OK", primaryAction = () => {}, showCancel = false) {
		// If the alert is already showing, don't show it again.
		if (!_.isUndefined(this._alerts[type]) && this._alerts[type] === true) {
			return;
		}

		this._alerts[type] = true;

		const buttons = [];

		// Cancel goes first since it should be on the left
		if (showCancel) {
			buttons.push({
				text: "Cancel",
				style: "cancel",
				onPress: () => {
					this._alerts[type] = false;
					this.props.dispatch(resetBootStatus());
					this.props.dispatch(resetActiveCommunity());
				}
			});
		}

		buttons.push({
			text: primaryText,
			style: "default",
			onPress: () => {
				primaryAction();
				this._alerts[type] = false;
			}
		});

		Alert.alert(message.title, message.body, buttons, {
			cancelable: false
		});
	}

	/**
	 * Switch the app status to show the community screen
	 *
	 * @return 	void
	 */
	multiCommunitySwitchToCommunity() {
		this.props.dispatch(
			switchAppView({
				view: "community"
			})
		);
	}

	/**
	 * Close the prompt for notifications
	 *
	 * @return 	void
	 */
	closeNotificationPrompt() {
		this.setState({
			showNotificationPrompt: false
		});
	}

	render() {
		if (this.state.waitingForClient) {
			return <AppLoading loading />;
		}

		return (
			<View style={{ flex: 1 }}>
				{Expo.Constants.manifest.extra.multi && this.props.app.view === "multi" ? (
					<MultiCommunityNavigation />
				) : (
					<CommunityRoot redirect={this.state.redirectToNotification} />
				)}
				<PromptModal isVisible={this.state.showNotificationPrompt} close={this.closeNotificationPrompt} />
			</View>
		);
	}
}

/*
<Toast
	ref="notificationToast"
	position="top"
	positionValue={0}
	style={{ backgroundColor: "#fff", position: "absolute", left: 10, right: 10, top: 10 }}
/>*/

const _componentStyles = styleVars => ({
	toastContainerStyle: {
		padding: styleVars.spacing.wide,
		backgroundColor: styleVars.toast.background,
		borderRadius: 5
	},
	toastTextStyle: {
		fontSize: styleVars.fontSizes.standard,
		color: styleVars.toast.text
	}
});

export default compose(
	connect(state => ({
		auth: state.auth,
		app: state.app,
		site: state.site,
		user: state.user
	})),
	withTheme(_componentStyles)
)(AppRoot);
