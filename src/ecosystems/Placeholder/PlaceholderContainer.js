import React, { PureComponent, memo } from "react";
import { View, StyleSheet } from "react-native";

const PlaceholderContainer = props => (
	<View style={props.style || {}}>
		<View style={{ height: props.height || 50 }}>{props.children}</View>
	</View>
);

export default memo(PlaceholderContainer);
