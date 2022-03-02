import React, { Component } from "react";
import { StyleSheet, Image, TouchableOpacity, Text, ViewPropTypes } from "react-native";
import PropTypes from "prop-types";
import _ from "underscore";

import Button from "./Button";
import styles, { styleVars } from "../styles";

const LoginButton = (props) => {
	const icons = {
		google: require("../../resources/login/google.png"),
		"facebook-official": require("../../resources/login/facebook.png"),
		linkedin: require("../../resources/login/linkedin.png"),
		twitter: require("../../resources/login/twitter.png")
	};

	let icon;

	if (props.icon && !_.isUndefined(icons[props.icon])) {
		icon = icons[props.icon];
	} else if (props.icon && !props.icon.startsWith("http")) {
		icon = { source: props.icon };
	}

	return (
		<TouchableOpacity onPress={props.onPress} style={[componentStyles.wrapper, props.style, { backgroundColor: props.color || styleVars.darkButton.mainColor }]}>
			<Image source={icon} resizeMode='contain' style={componentStyles.icon} />
		</TouchableOpacity>
	);
};

export default LoginButton;

const componentStyles = StyleSheet.create({
	wrapper: {
		width: 50,
		height: 50,
		borderRadius: 50,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center'
	},
	icon: {
		width: 25,
		height: 25,
		tintColor: '#fff'
	}
});

LoginButton.defaultProps = {
	color: "#000",
	onPress: null,
	icon: null,
	style: {}
};

LoginButton.propTypes = {
	title: PropTypes.string.isRequired,
	color: PropTypes.string,
	icon: PropTypes.string,
	onPress: PropTypes.func,
	style: ViewPropTypes.style
};
