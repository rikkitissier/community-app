import React from "react";
import { Text } from "react-native";

import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";

const TextField = ({ styles, ...props }) => {
	if (String(props.value).trim() === "") {
		return <Text style={[props.textStyles, styles.lightText]}>{Lang.get("no_value")}</Text>;
	}

	return <Text style={props.textStyles}>{String(props.value)}</Text>;
};

export default withTheme()(TextField);
