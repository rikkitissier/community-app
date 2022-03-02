import React, { Component } from "react";
import { View, Image, Text, StyleSheet } from "react-native";

import CustomField from "../../ecosystems/CustomField";
import { withTheme } from "../../themes";

const ProfileField = props => {
	const { styles, componentStyles } = props;
	let value;

	try {
		value = JSON.parse(props.value);
	} catch (err) {
		console.log(`Invalid JSON in ${props.type} field`);
		return null;
	}

	return (
		<View style={[styles.row, styles.phWide, styles.pvStandard, styles.flex, styles.flexJustifySpaceBetween, componentStyles.listItemWrap, props.style]}>
			<Text style={[styles.itemTitle, componentStyles.listTitle]} numberOfLines={1}>
				{props.title}
			</Text>
			<CustomField type={props.type} value={value} />
		</View>
	);
};

const _componentStyles = styleVars => ({
	listItemWrap: {
		borderBottomWidth: 1,
		borderBottomColor: styleVars.borderColors.light,
		minHeight: 60
	},
	listTitle: {
		marginBottom: 2
	}
});

export default withTheme(_componentStyles)(ProfileField);
