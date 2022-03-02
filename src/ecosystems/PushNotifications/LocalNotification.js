import React, { Component } from "react";
import { Text, View, StyleSheet, TouchableHighlight } from "react-native";

import styles, { styleVars } from "../../styles";

const LocalNotification = props => {
	return (
		<View style={componentStyles.notification}>
			<Text>{props.title}</Text>
		</View>
	);
};

export default LocalNotification;

const componentStyles = StyleSheet.create({});
