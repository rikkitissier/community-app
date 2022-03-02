import React, { Component } from "react";
import { Text, View, StyleSheet } from "react-native";

import UserPhoto from "../../atoms/UserPhoto";
import { withTheme } from "../../themes";
import Time from "../../atoms/Time";

const LastPostInfo = ({ componentStyles, ...props }) => {
	if (Boolean(props.photo) && Boolean(props.timestamp)) {
		return (
			<View style={props.style}>
				<UserPhoto url={props.photo} size={props.photoSize} />
				<Time timestamp={props.timestamp} style={componentStyles.timestamp} />
			</View>
		);
	}

	return null;
};

const _componentStyles = styleVars => ({
	timestamp: {
		fontSize: 12,
		color: styleVars.lightText,
		textAlign: "center",
		marginTop: 3
	}
});

export default withTheme(_componentStyles)(LastPostInfo);
