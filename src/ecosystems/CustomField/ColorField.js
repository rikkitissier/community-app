import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";

import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";

const ColorField = props => {
	const { styles, componentStyles } = props;
	const backgroundColor = !props.value.startsWith("#") ? `#${props.value}` : props.value;

	if (props.value.trim() === "" || props.value === "#") {
		return <Text style={[props.textStyles, styles.lightText]}>{Lang.get("no_color")}</Text>;
	}

	return (
		<View style={[styles.flexRow, styles.flexAlignCenter]}>
			<View style={[componentStyles.colorSwatch, styles.mrTight, { backgroundColor }]} />
			<Text style={props.textStyles}>{props.value}</Text>
		</View>
	);
};

const _componentStyles = {
	colorSwatch: {
		width: 16,
		height: 16,
		borderRadius: 3
	}
};

export default withTheme(_componentStyles)(memo(ColorField));
