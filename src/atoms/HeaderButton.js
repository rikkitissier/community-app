import React, { memo } from "react";
import { Text, TouchableOpacity, StyleSheet, Image, Platform } from "react-native";
import _ from "underscore";

import { withTheme } from "../themes";

const HeaderButton = props => {
	const { styles, componentStyles } = props;
	let showIcon = false;
	let showLabel = false;

	if (props.icon) {
		if (Platform.OS === "android" || props.alwaysShowIcon || !props.label) {
			showIcon = true;
		}
	}

	if (props.label) {
		if (Platform.OS === "ios" || !props.icon) {
			showLabel = true;
		}
	}

	return (
		<TouchableOpacity
			style={[componentStyles.wrapper, props.position == "left" ? styles.mlWide : styles.mrWide, props.style]}
			onPress={props.onPress || null}
			hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
		>
			{showIcon && (
				<Image source={props.icon} style={[styles.headerIcon, props.size ? { width: props.size, height: props.size } : componentStyles.defaultSize]} />
			)}
			{showLabel && <Text style={[styles.headerTitle]}>{props.label}</Text>}
		</TouchableOpacity>
	);
};

const _componentStyles = {
	defaultSize: {
		...Platform.select({
			ios: {
				width: 26,
				height: 26
			},
			android: {
				width: 22,
				height: 22
			}
		})
	}
};

export default withTheme(_componentStyles)(memo(HeaderButton));
