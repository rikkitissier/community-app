import React, { Component, Fragment } from "react";
import { Text, Image, View, TextInput, Switch, StyleSheet, TouchableOpacity, ActivityIndicator, AsyncStorage } from "react-native";
import { withApollo, compose } from "react-apollo";
import { LinearGradient } from "expo-linear-gradient";
import { connect } from "react-redux";
import _ from "underscore";
import { transparentize } from "polished";

import NavigationService from "../../../utils/NavigationService";
import Lang from "../../../utils/Lang";
import { isIphoneX } from "../../../utils/isIphoneX";
import Button from "../../../atoms/Button";
import LoginButton from "../../../atoms/LoginButton";
import ToFormData from "../../../utils/ToFormData";
import styles, { styleVars } from "../../../styles";

class LoginScreen extends Component {
	static navigationOptions = {
		title: "Sign In",
		header: null,
		headerMode: "screen"
	};

	constructor(props) {
		super(props);
		this.state = {
			username: "",
			password: "",
			anonymous: false
		};
	}

	/**
	 * Dispatch a login action containing our credentials
	 * We also need to pass our ApolloClient instance into the action, so that it can
	 * reset the store after logging in.
	 *
	 * @return 	void
	 */
	_login() {
		const { dispatch } = this.props;
		//dispatch(logIn(this.props.app.currentCommunity, this.state.username, this.state.password, this.props.client));
	}

	close = () => {
		this.props.navigation.goBack(null);
	};

	/**
	 * If we're now authenticated, redirect to our Root component
	 *
	 * @param 	object 	nextProps 	New props
	 * @return 	void
	 */
	componentWillUpdate(nextProps) {
		if (nextProps.auth.authenticated) {
			this.props.navigation.navigate("Root");
		}
	}

	/**
	 * Go to the registration screen
	 * EVentually we'll support simple registration in-app, but for now all registration goes
	 * to a webview
	 *
	 * @return 	void
	 */
	goToRegistration = () => {
		// For simple registration, just go to the reg screen
		// @future
		/*if (this.props.site.settings.allow_reg == "NORMAL") {
			this.props.navigation.navigate("RegisterScreen");
			return;
		}
		*/
		// More complex registration options - full form or third-party URL
		let url;

		if (this.props.site.settings.allow_reg !== "REDIRECT") {
			url = NavigationService.constructInternalUrl({
				app: "core",
				module: "system",
				controller: "register"
			});
		} else {
			url = this.props.site.settings.allow_reg_target;
		}

		this.props.navigation.navigate({
			routeName: "AuthWebView",
			params: { url },
			key: "register_full"
		});
	};

	/**
	 * Build the component to show the Registration link, if it's enabled
	 *
	 * @return 	Component|null
	 */
	buildRegistrationLink() {
		if (this.props.site.settings.allow_reg === "DISABLED") {
			return null;
		}

		return (
			<TouchableOpacity onPress={this.goToRegistration}>
				<Text style={[styles.reverseText, styles.standardText, styles.centerText, styles.mtStandard]}>
					Don't have an account? Register now{" "}
					<Image source={require("../../../../resources/row_arrow.png")} resizeMode="contain" style={componentStyles.registerLinkArrow} />
				</Text>
			</TouchableOpacity>
		);
	}

	/**
	 * Update state with Anon toggle value
	 *
	 * @return 	void
	 */
	toggleAnonymous = value => {
		this.setState({
			anonymous: value
		});
	};

	/**
	 * Handle tapping the Forgot Password link
	 *
	 * @return 	void
	 */
	forgotPasswordPress = () => {
		this.props.navigation.navigate({
			routeName: "AuthWebView",
			params: {
				url: NavigationService.constructInternalUrl({
					app: "core",
					module: "system",
					controller: "lostpass"
				})
			},
			key: "lost_pass"
		});
	};

	/**
	 * Return a memoized press handler for a social login button that navigates to our WebView
	 *
	 * @return 	function
	 */
	handlerPresses = {};
	getLoginButtonHandler(handler) {
		if (_.isUndefined(this.handlerPresses[handler.id])) {
			this.handlerPresses[handler.id] = () => {
				this.props.navigation.navigate({
					routeName: "AuthWebView",
					params: { url: NavigationService.constructInternalUrl({}) },
					key: `handler_${handler.id}`
				});
			};
		}

		return this.handlerPresses[handler.id];
	}

	render() {
		return (
			<View style={{ flex: 1 }}>
				<LinearGradient start={[0, 0]} end={[1, 0]} colors={styleVars.primaryBrand} style={componentStyles.background}>
					{this.props.auth.loginProcessing || this.props.auth.authenticated ? (
						<View style={componentStyles.pageWrapper}>
							<ActivityIndicator size="large" color={styleVars.reverseText} />
						</View>
					) : (
						<React.Fragment>
							{_.isUndefined(this.props.hideClose) && !Boolean(this.props.hideClose) && (
								<TouchableOpacity onPress={this.close} style={componentStyles.closeButton}>
									<Image source={require("../../../../resources/close.png")} resizeMode="contain" style={componentStyles.closeButtonImage} />
								</TouchableOpacity>
							)}
							<View style={componentStyles.pageWrapper}>
								<View style={componentStyles.logoWrapper}>
									<Image source={require("../../../../resources/logo_light.png")} resizeMode="contain" style={componentStyles.logo} />
								</View>

								<View style={[componentStyles.textInputWrap, styles.mbTight]}>
									<TextInput
										style={componentStyles.textInput}
										autoCorrect={false}
										autoCapitalize="none"
										placeholderTextColor={transparentize(0.7, styleVars.reverseText)}
										placeholder={Lang.get("username")}
										onChangeText={username => this.setState({ username })}
										value={this.state.username}
									/>
								</View>

								<View style={[componentStyles.textInputWrap, styles.mbTight]}>
									<TextInput
										style={componentStyles.textInput}
										autoCorrect={false}
										autoCapitalize="none"
										placeholderTextColor={transparentize(0.7, styleVars.reverseText)}
										placeholder={Lang.get("password")}
										onChangeText={password => this.setState({ password })}
										value={this.state.password}
										secureTextEntry={true}
									/>
									<TouchableOpacity style={styles.mlTight} onPress={this.forgotPasswordPress}>
										<Text style={[styles.standardText, componentStyles.forgotPassword]}>{Lang.get("forgot_password")}</Text>
									</TouchableOpacity>
								</View>

								{!Boolean(this.props.site.settings.disable_anonymous) && (
									<View style={componentStyles.anonWrap}>
										<Switch
											value={this.state.anonymous}
											onTintColor={styleVars.toggleTintInverse}
											onValueChange={this.toggleAnonymous}
											tintColor="rgba(0,0,0,0.1)"
											ios_backgroundColor="rgba(0,0,0,0.1)"
											style={{ transform: [{ scale: 0.8 }, { translateX: -4 }] }}
										/>
										<Text style={[styles.standardText, styles.reverseText]}>{Lang.get("sign_in_anon")}</Text>
									</View>
								)}

								<Button style={styles.mtVeryWide} onPress={() => this._login()} title={Lang.get("sign_in")} rounded filled size="large" type="light" />
								{this.buildRegistrationLink()}
							</View>
							{Boolean(this.props.site.loginHandlers.length) && (
								<LinearGradient start={[0.5, 0]} end={[0.5, 1]} colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.3)"]} style={componentStyles.otherButtonsWrapper}>
									<Text style={[styles.reverseText, styles.standardText, styles.centerText, styles.mbStandard]}>{Lang.get("sign_in_with_social")}</Text>

									<View style={componentStyles.otherButtons}>
										{this.props.site.loginHandlers.map((handler, idx) => (
											<View style={idx > 0 ? styles.mlTight : null} key={handler.id}>
												<LoginButton title={handler.text} icon={handler.icon} color={handler.color} onPress={this.getLoginButtonHandler(handler)} />
											</View>
										))}
									</View>
								</LinearGradient>
							)}
						</React.Fragment>
					)}
				</LinearGradient>
			</View>
		);
	}
}

export default compose(
	withApollo,
	connect(state => ({
		app: state.app,
		site: state.site,
		auth: state.auth
	}))
)(LoginScreen);

const componentStyles = StyleSheet.create({
	background: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		height: "100%"
	},
	pageWrapper: {
		flex: 1,
		backgroundColor: "transparent",
		justifyContent: "center",
		padding: styleVars.spacing.veryWide
	},
	textInputWrap: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.1)",
		padding: styleVars.spacing.standard,
		borderRadius: 5
	},
	textInput: {
		fontSize: 16,
		color: styleVars.reverseText,
		flexGrow: 1
	},
	closeButton: {
		position: "absolute",
		top: isIphoneX() ? 60 : 30,
		right: 10,
		zIndex: 100
	},
	closeButtonImage: {
		width: 30,
		height: 30,
		tintColor: styleVars.reverseText
	},
	smallText: {
		textAlign: "center"
	},
	registerLinkArrow: {
		width: 12,
		height: 14,
		marginTop: -2,
		tintColor: styleVars.reverseText
	},
	otherButtonsWrapper: {
		paddingHorizontal: styleVars.spacing.veryWide,
		paddingTop: styleVars.spacing.veryWide,
		paddingBottom: isIphoneX() ? styleVars.spacing.extraWide * 2 : styleVars.spacing.veryWide
	},
	otherButtons: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		width: "100%"
	},
	logoWrapper: {
		display: "flex",
		alignItems: "center"
	},
	logo: {
		maxWidth: "70%"
	},
	forgotPassword: {
		color: transparentize(0.3, styleVars.reverseText)
	},
	anonWrap: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start"
	}
});
