import React, { memo } from "react";
import { TouchableOpacity, Text } from "react-native";

import { withTheme } from "../themes";

const DummyTextInput = props => {
	const { styles, componentStyles } = props;
	return (
		<TouchableOpacity style={[styles.phWide, styles.flex, styles.flexJustifyCenter, componentStyles.textbox]} onPress={props.onPress}>
			<Text style={componentStyles.placeholder}>{props.placeholder}</Text>
		</TouchableOpacity>
	);
};

const _componentStyles = styleVars => ({
	textbox: {
		backgroundColor: "#fff",
		height: 38,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.075)",
		borderRadius: 20,
		width: "100%"
	},
	placeholder: {
		color: styleVars.greys.placeholder
	}
});

export default withTheme(_componentStyles)(memo(DummyTextInput));
