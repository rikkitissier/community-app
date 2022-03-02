import React, { Component } from "react";
import { Text, Alert, View, Image, TouchableHighlight, StyleSheet, ActivityIndicator, AsyncStorage, StatusBar } from "react-native";
import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";
import { ApolloProvider } from "react-apollo";
import { connect } from "react-redux";
import gql from "graphql-tag";
import _ from "underscore";

import AppLoading from "../../atoms/AppLoading";
import NavigationService from "../../utils/NavigationService";
import RichTextContent from "../../ecosystems/RichTextContent";
import Lang from "../../utils/Lang";
import { updateNotificationCount } from "../../redux/actions/user";
import { NotificationFragment } from "../../ecosystems/Notification";
import { bootSite } from "../../redux/actions/app";
import { refreshToken } from "../../redux/actions/auth";
import CommunityNavigation from "../../navigation/CommunityNavigation";
import icons from "../../icons";

const NOTIFICATION_TIMEOUT = Expo.Constants.manifest.extra.notification_timeout || 30000;

const NotificationQuery = gql`
	query NotificationQuery {
		core {
			me {
				id
				notificationCount
			}
		}
	}
`;

/* Mutation to mark a notification as read */
const MarkReadMutation = gql`
	mutation MarkNotificationRead($id: Int) {
		mutateCore {
			markNotificationRead(id: $id) {
				...NotificationFragment
			}
		}
	}
	${NotificationFragment}
`;

const SessionStartMutation = gql`
	mutation SessionStartMutation($token: String) {
		mutateCore {
			sessionStart(token: $token) {
				id
			}
		}
	}
`;

class CommunityRoot extends Component {
	constructor(props) {
		super(props);

		this.state = {
			bypassOfflineMessage: false,
			togglingDarkMode: false
		};
		this._notificationTimeout = null;
		this._abortController = null;

		this.tryAfterNetworkError = this.tryAfterNetworkError.bind(this);
		this.bypassOfflineMessage = this.bypassOfflineMessage.bind(this);
		this.launchAuth = this.launchAuth.bind(this);
	}

	/**
	 * Mount point
	 *
	 * @return 	void
	 */
	componentDidMount() {
		if (this.props.auth.isAuthenticated) {
			this.setNotificationTimeout();
			this.maybeSendPushToken();
		}

		if (this.props.redirect !== null) {
			this.handleRedirectProp();
		}
	}

	/**
	 * Called after component update
	 *
	 * @param 	object 		prevProps 		Old props
	 * @param 	object 		prevState 		Old state
	 * @return 	void
	 */
	componentDidUpdate(prevProps, prevState) {
		// If we're now authenticated, and weren't before, start checking notifications
		if (!prevProps.auth.isAuthenticated && this.props.auth.isAuthenticated) {
			this.setNotificationTimeout();
			this.maybeSendPushToken();
		}

		// However, if we were authenticated but aren't now, then *stop* notifications
		if (prevProps.auth.isAuthenticated && !this.props.auth.isAuthenticated) {
			console.tron.log("Clearing notification interval");
			this.stopNotificationTimeout();
		}

		if (prevProps.redirect !== this.props.redirect && this.props.redirect !== null) {
			this.handleRedirectProp();
		}

		if (prevProps.app.darkMode !== this.props.app.darkMode) {
			this.setState({
				togglingDarkMode: this.props.app.darkMode ? "off" : "on"
			});

			setTimeout(() => {
				this.setState({
					togglingDarkMode: false
				});
			}, 10);
		}
	}

	/**
	 * When component unmounts, clear up our intervals
	 *
	 * @return 	void
	 */
	componentWillUnmount() {
		this.stopNotificationTimeout();
		clearTimeout(this._redirectTimeout);
	}

	/**
	 * If a `redirect` prop is passed to this component, this method will redirect
	 * the nav to the appropriate screen
	 *
	 * @return 	void
	 */
	async handleRedirectProp() {
		const { app, module, controller, url, notificationId } = this.props.redirect;

		// Do we have a notification ID to mark as read?
		if (notificationId !== null) {
			try {
				const { data } = await this.props.auth.client.mutate({
					query: MarkReadMutation,
					variables: {
						id: notificationId
					}
				});

				console.log(`COMMUNITY_ROOT: Marked notification ${notificationId} read`);
			} catch (err) {
				console.log(`COMMUNITY_ROOT: Couldn't mark notification ${notificationId} read`);
			}
		}

		// Update the notification count and reset the interval
		this.stopNotificationTimeout();
		this.runNotificationQuery();
		this.setNotificationTimeout();

		// Prepare to redirect
		const params = {};

		["id", "findComment", "findReview"].forEach(param => {
			if (!_.isUndefined(this.props.redirect[param])) {
				params[param] = this.props.redirect[param];
			}
		});

		console.log("In CommunityRoot mount, we'll redirect");
		this._redirectTimeout = setTimeout(() => {
			NavigationService.navigate(
				{
					app,
					module,
					controller,
					url
				},
				params
			);
		}, 1000);
	}

	/**
	 * Start checking for notifications
	 *
	 * @return 	void
	 */
	setNotificationTimeout() {
		this.stopNotificationTimeout();
		this._notificationTimeout = setTimeout(() => this.runNotificationQuery(), NOTIFICATION_TIMEOUT);
	}

	/**
	 * Stop checking for notifications
	 *
	 * @return 	void
	 */
	stopNotificationTimeout() {
		if (this._abortController !== null) {
			try {
				this._abortController.abort();
			} catch (err) {
				console.tron.log(`Couldn't abort notification query: ${err}`);
			}

			this._abortController = null;
		}

		clearTimeout(this._notificationTimeout);
	}

	/**
	 * Run a query to check our notification count
	 *
	 * @return 	void
	 */
	async runNotificationQuery() {
		this._abortController = new AbortController();

		try {
			const { data } = await this.props.auth.client.query({
				query: NotificationQuery,
				fetchPolicy: "network-only",
				options: {
					signal: this._abortController
				}
			});

			//console.log(`COMMUNITY_ROOT: Ran notification update, got count ${data.core.me.notificationCount}`);

			if (parseInt(data.core.me.notificationCount) !== parseInt(this.props.user.notificationCount)) {
				this.props.dispatch(updateNotificationCount(data.core.me.notificationCount));
			}

			this.setNotificationTimeout();
		} catch (err) {
			// If this failed for some reason, stop checking from now on
			console.log(`COMMUNITY_ROOT: Error running notification update: ${err}`);
			this.stopNotificationTimeout();
		}
	}

	/**
	 * Sends the user's push token to the community if they're logged in,
	 * and have accepted notifications.
	 *
	 * @return 	void
	 */
	async maybeSendPushToken() {
		if (!this.props.auth.isAuthenticated) {
			return;
		}

		const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
		const isMulti = Expo.Constants.manifest.extra.multi;
		const activeCommunity = this.props.app.currentCommunity;

		let token = null;
		let isSaved = false;

		if (isMulti) {
			isSaved = _.find(this.props.app.communities.data, community => community.url === activeCommunity.apiUrl);
		}

		// Only send token if this is single-community app, or we've saved this community
		if (!isMulti || (isMulti && isSaved)) {
			// If they haven't granted access then we don't need to do anything here
			if (status === "granted" && Expo.Constants.isDevice) {
				try {
					token = await Notifications.getExpoPushTokenAsync({
						experienceId: Expo.Constants.manifest.extra.experienceId
					});

					token = token.data;
				} catch (err) {}
			}
		}

		// Get the token that uniquely identifies this device
		try {
			console.tron.log(`COMMUNITY_ROOT: Starting session with token ${token}...`);
			const { data } = await this.props.auth.client.mutate({
				mutation: SessionStartMutation,
				variables: {
					token
				}
			});
			console.tron.log(`COMMUNITY_ROOT: Session start sent.`);
		} catch (err) {
			console.tron.log(`COMMUNITY_ROOT: Couldn't send push token: ${err}`);
			return;
		}
	}

	/**
	 * Try loading the community again
	 *
	 * @return 	void
	 */
	async tryAfterNetworkError() {
		const { apiKey, apiUrl } = this.props.app.currentCommunity;
		const { dispatch } = this.props;

		this.setState({
			loading: true
		});

		await dispatch(refreshToken({ apiKey, apiUrl, forceRefresh: true }));
		await dispatch(bootSite({ apiKey, apiUrl }));
	}

	/**
	 * Show the auth browser
	 *
	 * @return 	void
	 */
	launchAuth() {
		NavigationService.launchAuth();
	}

	/**
	 * Bypass the offline message and show community on next render
	 *
	 * @return 	void
	 */
	bypassOfflineMessage() {
		this.setState({
			bypassOfflineMessage: true
		});
	}

	render() {
		let appContent;

		if (this.props.app.bootStatus.loading || this.props.auth.client === null) {
			appContent = <AppLoading loading />;
		} else if (this.props.app.bootStatus.error) {
			appContent = (
				<AppLoading
					icon={icons.OFFLINE}
					title="Network Error"
					message="Sorry, there was a problem loading this community"
					buttonText="Try Again"
					buttonOnPress={this.tryAfterNetworkError}
				/>
			);
		} else if (!this.props.site.settings.site_online && !this.state.bypassOfflineMessage) {
			if (!this.props.user.group.canAccessOffline) {
				// Site is offline and this user cannot access it
				appContent = (
					<AppLoading
						icon={icons.OFFLINE}
						title="Community Unavailable"
						message={
							// Only use this message if there's no offline message - otherwise we'll provide a RichTextContent
							// component a few lines down.
							!Boolean(this.props.site.settings.site_offline_message) &&
							Lang.get("offline", {
								siteName: this.props.site.settings.board_name
							})
						}
						buttonText="Sign In"
						buttonOnPress={!Boolean(this.props.auth.isAuthenticated) ? this.tryAfterNetworkError : null}
					>
						{Boolean(this.props.site.settings.site_offline_message) && <RichTextContent dark>{this.props.site.settings.site_offline_message}</RichTextContent>}
					</AppLoading>
				);
			} else {
				// Site is offline and this user cannot access it
				appContent = (
					<AppLoading
						icon={icons.OFFLINE}
						title="Community Offline"
						message={`${this.props.site.settings.board_name} is offline, but your permissions allow you to access it.`}
						buttonText="Go To Community"
						buttonOnPress={this.bypassOfflineMessage}
					/>
				);
			}
		} else if (!this.props.user.group.canAccessSite) {
			if (this.props.user.group.groupType !== "GUEST") {
				// User is in a banned group
				appContent = (
					<AppLoading
						icon={icons.BANNED}
						title="No Permission"
						message={`Sorry, you do not have permission to access ${this.props.site.settings.board_name}`}
					/>
				);
			} else {
				// User is a guest, so site requires a login to view anything
				appContent = (
					<AppLoading
						icon={icons.LOGIN}
						title="Sign In Required"
						message={`Please sign in to access ${this.props.site.settings.board_name}`}
						buttonText="Sign In"
						buttonOnPress={this.launchAuth}
					/>
				);
			}
		} else if (this.props.auth.swapToken.loading) {
			appContent = <AppLoading loading message={`Logging you in...`} />;
		} else if (this.state.togglingDarkMode !== false) {
			appContent = <AppLoading loading message={`Turning ${this.state.togglingDarkMode} the lights...`} />;
		} else {
			appContent = <CommunityNavigation />;
		}

		return <ApolloProvider client={this.props.auth.client}>{appContent}</ApolloProvider>;
	}
}

export default connect(state => ({
	app: state.app,
	auth: state.auth,
	user: state.user,
	site: state.site
}))(CommunityRoot);
