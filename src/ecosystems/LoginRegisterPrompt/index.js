import React, { PureComponent } from "react";
import { Text, Image, View, Animated, Easing, AsyncStorage, TouchableOpacity, StyleSheet } from "react-native";

import NavigationService from "../../utils/NavigationService";
import ShadowedArea from "../../atoms/ShadowedArea";
import Button from "../../atoms/Button";
import ViewMeasure from "../../atoms/ViewMeasure";
import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";

class LoginRegisterPrompt extends PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			hiding: false,
			showPopup: false
		};
		this._origHeight = 0;
		this._wrapper = null;
		this._animatedValue = new Animated.Value(1);
		this.onWrapperLayout = this.onWrapperLayout.bind(this);
		this.onLoginPress = this.onLoginPress.bind(this);
		this.onRegisterPress = this.onRegisterPress.bind(this);
		this.closeLoginBox = this.closeLoginBox.bind(this);
	}

	/**
	 * Check if we have a
	 *
	 * @return 	void
	 */
	async componentDidMount() {
		try {
			//const lastClosed = await AsyncStorage.getItem("@settingStore:loginPopupShown");
			const lastClosed = null;
			// If the time we last closed it is more than a day ago...
			if (lastClosed == null || JSON.parse(lastClosed) + 86400 < Date.now() / 1000) {
				this.setState({
					showPopup: true
				});
			}
		} catch (err) {
			this.setState({
				showPopup: true
			});
		}
	}

	/**
	 * Handles tapping the X to close the prompt
	 * Starts the animation that'll move it off screen
	 * Also stores a flag in local storage so we don't show it again for some period of time
	 *
	 * @return 	void
	 */
	async closeLoginBox() {
		this._animation = Animated.timing(this._animatedValue, {
			toValue: 0,
			duration: 350,
			easing: Easing.bezier(0.42, 0, 1, 1),
			useNativeDriver: false
		});

		this.setState({
			hiding: true
		});

		this._animation.start();

		// Store timestamp in local storage
		try {
			await AsyncStorage.setItem(
				"@settingStore:loginPopupShown",
				JSON.stringify(Date.now() / 1000) // seconds
			);
		} catch (err) {
			console.log("Couldn't store a loginPopupShown value");
			console.log(err);
		}
	}

	/**
	 * Event handler for the wrapper's onLayout callback
	 * We use this to capture the wrapper's height, which is later used in animation
	 *
	 * @param 	object 		e 		Event object
	 * @return 	void
	 */
	onWrapperLayout(e) {
		this._origHeight = e.nativeEvent.layout.height;
	}

	/**
	 * Handle tapping the sign in button
	 * Send them to the login modal
	 *
	 * @return 	void
	 */
	onLoginPress() {
		//this.props.navigation.navigate('LoginModal');
		NavigationService.launchAuth();
	}

	/**
	 * Handle tapping the register button
	 * Send them to the register flow, or to webview if there's external registration set up
	 *
	 * @return 	void
	 */
	onRegisterPress() {
		if (this.props.registerUrl) {
			this.props.navigation.navigate("WebView", {
				url: this.props.registerUrl
			});
		} else {
			console.log("REGISTER");
		}
	}

	/**
	 * Render
	 *
	 * @return 	Component
	 */
	render() {
		const { componentStyles, styles } = this.props;

		const height = this._animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0, this._origHeight]
		});
		const opacity = this._animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0.5, 1]
		});

		if (height === 0 || !this.state.showPopup) {
			return null;
		}

		// @todo image refs

		return (
			<ViewMeasure onLayout={this.props.onLayout} id="loginPrompt">
				<ShadowedArea style={[styles.row, this.props.style]} onLayout={this.onWrapperLayout}>
					<Animated.View style={[componentStyles.outerWrapper, this.state.hiding ? { height, opacity } : null]}>
						<View style={[styles.pWide, componentStyles.innerWrapper, this.state.hiding ? { position: "absolute", left: 0, right: 0, bottom: 0 } : null]}>
							<View style={[styles.flexRow, styles.flexAlignStart, styles.flexJustifyCenter, this.props.closable ? componentStyles.loginBoxClosable : null]}>
								<Image source={require("../../../resources/register_prompt.png")} style={componentStyles.loginIcon} resizeMode="contain" />
								<View style={componentStyles.loginInner}>
									<Text style={[styles.text, styles.standardText]}>{this.props.message}</Text>
								</View>
								{Boolean(this.props.closable) && (
									<TouchableOpacity onPress={this.closeLoginBox} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
										<Image source={require("../../../resources/close.png")} style={[styles.lightImage, componentStyles.closeButton]} />
									</TouchableOpacity>
								)}
							</View>
							<View style={[styles.flexRow, styles.mtStandard]}>
								<Button
									type="primary"
									filled
									rounded
									size="medium"
									title={Lang.get("register")}
									onPress={this.onRegisterPress}
									style={[styles.flexBasisZero, styles.flexGrow, styles.mrTight]}
								/>
								<Button
									type="primary"
									filled
									rounded
									size="medium"
									title={Lang.get("sign_in")}
									onPress={this.onLoginPress}
									style={[styles.flexBasisZero, styles.flexGrow, this.props.register ? styles.mlTight : null]}
								/>
							</View>
						</View>
					</Animated.View>
				</ShadowedArea>
			</ViewMeasure>
		);
	}
}

const _componentStyles = styleVars => ({
	wrapper: {},
	outerWrapper: {
		overflow: "hidden"
	},
	loginBoxClosable: {
		paddingRight: 20
	},
	loginInner: {
		paddingLeft: styleVars.spacing.wide,
		flexBasis: 0,
		flexGrow: 1
	},
	loginIcon: {
		width: 40,
		height: 40
	},
	closeButton: {
		width: 20,
		height: 20,
		position: "absolute",
		right: -20,
		top: 0
	}
});

export default withTheme(_componentStyles)(LoginRegisterPrompt);
