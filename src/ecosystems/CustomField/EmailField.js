import React from "react";
import { Text, TouchableOpacity } from "react-native";
import * as Linking from "expo-linking";
import isEmail from "validator/lib/isEmail";

import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";

const EmailField = ({ styles, ...props }) => {
	if (props.value.trim() === "") {
		return <Text style={[props.textStyles, styles.lightText]}>{Lang.get("no_email")}</Text>;
	}

	return (
		<TouchableOpacity onPress={isEmail(props.value) ? () => Linking.openURL(`mailto:${props.value}`) : null}>
			<Text style={props.textStyles}>{props.value}</Text>
		</TouchableOpacity>
	);
};

export default withTheme()(EmailField);
