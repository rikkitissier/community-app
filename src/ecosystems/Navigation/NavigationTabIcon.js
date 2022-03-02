import React, { memo } from "react";
import { View, Image, Platform, Text, StyleSheet } from "react-native";

import { withTheme } from "../../themes";

const NavigationTabIcon = ({ styles, ...props }) => {
	return (
		<View>
			<Image style={[styles.tabIcon, { tintColor: props.tintColor }]} source={props.focused || Platform.OS === "android" ? props.active : props.inactive} />
			{props.children}
		</View>
	);
};

export default withTheme()(NavigationTabIcon);
