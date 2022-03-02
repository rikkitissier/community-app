import React, { memo } from "react";
import { StyleSheet, StatusBar, ActivityIndicator, View, Text, Image, Dimensions } from "react-native";

import Button from "./Button";
import { withTheme } from "../themes";
import { splashImage } from "../icons";

const AppLoading = props => {
	const { styles, componentStyles } = props;

	// If we're in a single community app and *just* loading, nothing else, then show the splash screen
	if (props.loading && !props.title && !props.message && !props.children && !props.buttonText && !Expo.Constants.manifest.extra.multi) {
		return (
			<View style={[styles.flex, componentStyles.wrapper]}>
				<StatusBar barStyle="light-content" />
				<Image source={splashImage} resizeMode="cover" style={componentStyles.splash} />
				<ActivityIndicator size="large" color="#ffffff" style={componentStyles.splashActivity} />
			</View>
		);
	}

	return (
		<View style={[styles.flex, styles.flexAlignCenter, styles.flexJustifyCenter, componentStyles.wrapper]}>
			<StatusBar barStyle="light-content" />
			{props.loading && <ActivityIndicator size="large" color="#ffffff" style={styles.mbStandard} />}
			{props.icon && <Image source={props.icon} resizeMode="contain" style={[componentStyles.icon, styles.mbExtraWide]} />}
			{props.title && <Text style={[styles.reverseText, styles.mediumText, styles.extraLargeText]}>{props.title}</Text>}
			{props.message && (
				<Text style={[styles.reverseText, styles.contentText, styles.mtVeryTight, styles.centerText, componentStyles.message]}>{props.message}</Text>
			)}
			{props.children && <View style={[styles.mvVeryWide, styles.mhWide]}>{props.children}</View>}
			{props.buttonText && props.buttonOnPress && (
				<Button
					filled
					rounded
					large
					type="light"
					title={props.buttonText}
					fullWidth={false}
					onPress={props.buttonOnPress}
					style={[styles.mtExtraWide, componentStyles.button]}
				/>
			)}
		</View>
	);
};

const _componentStyles = styleVars => ({
	wrapper: {
		backgroundColor: styleVars.accentColor
	},
	message: {
		maxWidth: "75%"
	},
	button: {
		minWidth: "50%"
	},
	icon: {
		width: 60,
		height: 60,
		tintColor: styleVars.reverseText,
		opacity: 0.3
	},
	tryAgainText: {
		color: "rgba(255,255,255,0.5)",
		fontSize: 15
	},
	splash: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		width: Dimensions.get("screen").width,
		height: Dimensions.get("screen").height
	},
	splashActivity: {
		position: "absolute",
		top: "60%",
		left: "50%",
		marginLeft: -18
	}
});

export default withTheme(_componentStyles)(memo(AppLoading));
