import React, { Component } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { compose } from "react-apollo";
import { connect } from "react-redux";
import _ from "underscore";

import NavigationService from "../../utils/NavigationService";
import { withTheme } from "../../themes";

const MESSAGE_PREFIX = Expo.Constants.manifest.extra.message_prefix;

class WebViewScreen extends Component {
	static navigationOptions = ({ navigation }) => ({
		headerTitle: navigation.state.params.title || "Loading..."
	});

	constructor(props) {
		super(props);
		this.onMessage = this.onMessage.bind(this);
		this.getInjectedJavascript = this.getInjectedJavascript.bind(this);
		this.onNavigationStateChange = this.onNavigationStateChange.bind(this);
		this.onShouldStartLoadWithRequest = this.onShouldStartLoadWithRequest.bind(this);
		this.renderLoading = this.renderLoading.bind(this);

		if (!_.isUndefined(this.props.navigation.state.params) && !_.isUndefined(this.props.navigation.state.params.title)) {
			this.props.navigation.setParams({
				title: Lang.get("loading")
			});
		}

		this.state = {
			currentUrl: this.props.navigation.state.params.url
		};
	}

	getInjectedJavascript() {
		return `
			function sendTitle() {
				sendMessage('DOCUMENT_TITLE', { title: document.title });
			}

			function sendMessage(message, data = {}) {
				const messageToSend = JSON.stringify({
					message: '${MESSAGE_PREFIX}' + message,
					...data
				});

				if (window.ReactABI33_0_0NativeWebView) {
					window.ReactABI33_0_0NativeWebView.postMessage(messageToSend);
				} else if (window.ReactNativeWebView) {
					window.ReactNativeWebView.postMessage(messageToSend);
				} else {
					throw new Error("No postMessage method available");
				}
			}

			setInterval( sendTitle, 250 );		
			
			function shouldSendLinkToNative(link) {
				if( link.matches('a[data-ipsMenu]') || link.matches('a[data-ipsDialog]') ){
					return false;
				}

				if( link.getAttribute('href') == 'undefined' || link.getAttribute('href').startsWith('#') ){
					return false;
				}

				return true;
			}

			function clickHandler(e) {
				var link = e.target;

				if( !link.matches('a') ){
					link = link.closest('a');

					if( link === null ) {
						return false;
					}
				}

				if( shouldSendLinkToNative( link ) ){
					e.preventDefault();
					e.stopPropagation();

					sendMessage("GO_TO_URL", {
						url: link.getAttribute('href')
					});
				}
			}

			
			document.addEventListener('click', clickHandler);
		`;
	}

	onNavigationStateChange(navState) {
		console.log("state change:");
		console.log(navState);

		if (navState.url.startsWith(this.props.site.settings.base_url)) {
			this.setState({
				currentUrl: navState.url
			});
		}
	}

	onShouldStartLoadWithRequest(request) {
		// Ensure any requests we load are from our base url - no external links.
		if (!request.url.startsWith(this.props.site.settings.base_url)) {
			return false;
		}

		return true;
	}

	onMessage(e) {
		try {
			const messageData = JSON.parse(e.nativeEvent.data);
			const supported = ["DEBUG", "DOCUMENT_TITLE", "GO_TO_URL"];

			if (messageData.hasOwnProperty("message") && messageData.message.startsWith(MESSAGE_PREFIX)) {
				const messageType = messageData.message.replace(MESSAGE_PREFIX, "");

				if (supported.indexOf(messageType) !== -1 && this[messageType]) {
					this[messageType].call(this, messageData);
				}
			}
		} catch (err) {
			/* Ignore */
		}
	}

	DEBUG(data) {
		console.log("DEBUG: " + data.debugMessage);
	}

	DOCUMENT_TITLE(data) {
		// Remove " - <board_name>" from title, no need to show it in-app
		// Remove ❚❚ too
		const fixedTitle = data.title.replace(` - ${this.props.site.settings.board_name}`, "").replace(`❚❚ `, "");

		if (fixedTitle !== this.props.navigation.state.params.title) {
			this.props.navigation.setParams({
				title: fixedTitle
			});
		}
	}

	GO_TO_URL(data) {
		NavigationService.navigate({
			url: data.url.trim()
		});
	}

	renderLoading() {
		const { styles } = this.props;

		return (
			<View style={[styles.absoluteFill, styles.flex, styles.flexJustifyCenter, styles.flexAlignCenter]}>
				<ActivityIndicator size="small" />
			</View>
		);
	}

	render() {
		let headers = {};

		// If this is an internal URL, we set headers to authorize the user inside the webview
		if (NavigationService.isInternalUrl(this.state.currentUrl)) {
			headers["X-IPS-App"] = "true";

			if (this.props.auth.isAuthenticated) {
				headers["X-IPS-AccessTokenMember"] = `${this.props.user.id}`;
				headers["Authorization"] = `Bearer ${this.props.auth.authData.accessToken}`;
			}
		}

		return (
			<View style={{ flex: 1 }}>
				<WebView
					source={{ uri: this.state.currentUrl, headers }}
					style={{ flex: 1 }}
					onMessage={this.onMessage}
					ref={webview => (this.webview = webview)}
					javaScriptEnabled={true}
					cacheEnabled={false}
					cacheMode="LOAD_NO_CACHE"
					injectedJavaScript={this.getInjectedJavascript()}
					mixedContentMode="always"
					onNavigationStateChange={this.onNavigationStateChange}
					onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
					startInLoadingState={true}
					renderLoading={this.renderLoading}
				/>
			</View>
		);
	}
}

export default compose(
	withTheme(),
	connect(state => ({
		auth: state.auth,
		site: state.site,
		user: state.user
	}))
)(WebViewScreen);
