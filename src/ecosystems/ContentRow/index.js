import React, { Component } from "react";
import { Text, View, StyleSheet, Image, TouchableHighlight } from "react-native";
import ShadowedArea from "../../atoms/ShadowedArea";

import icons from "../../icons";
import { withTheme } from "../../themes";

const ContentRow = props => {
	const { styles, componentStyles } = props;

	let rowClass = styles.unreadBackground;

	if (props.hidden) {
		rowClass = styles.moderatedBackground;
	}

	return (
		<TouchableHighlight style={props.withSpace ? componentStyles.outerContentRowWithSpace : componentStyles.outerContentRow} onPress={props.onPress || null}>
			<View style={[styles.flexRow, rowClass, props.rowStyle]}>
				<View style={[styles.flexGrow, props.style]}>{props.children}</View>
				{props.showArrow && (
					<View style={[styles.flexAlignSelfCenter, styles.mrStandard]}>
						<Image source={icons.ROW_ARROW} resizeMode="contain" style={componentStyles.arrow} />
					</View>
				)}
			</View>
		</TouchableHighlight>
	);
};

const _componentStyles = styleVars => ({
	outerContentRow: {
		marginBottom: 1
	},
	outerContentRowWithSpace: {
		marginBottom: 4,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0,0,0,0.05)"
	},
	arrow: {
		width: 18,
		height: 18,
		tintColor: styleVars.rowArrow
	}
});

export default withTheme(_componentStyles)(ContentRow);
