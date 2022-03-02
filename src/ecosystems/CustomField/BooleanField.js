import React, { memo } from "react";
import { Text, View, Image, StyleSheet } from "react-native";

import Lang from "../../utils/Lang";
import icons from "../../icons";
import { withTheme } from "../../themes";

const BooleanField = ({ styles, componentStyles, ...props }) => (
	<View style={[styles.flexRow, styles.flexAlignStart]}>
		<Image source={Boolean(props.value) ? icons.CHECKMARK2 : icons.CROSS} resizeMode="contain" style={[componentStyles.icon, styles.mrTight]} />
		<Text style={props.textStyles}>{Boolean(props.value) ? Lang.get("yes") : Lang.get("no")}</Text>
	</View>
);

const _componentStyles = styleVars => ({
	icon: {
		width: 20,
		height: 20,
		tintColor: styleVars.text
	}
});

export default withTheme(_componentStyles)(memo(BooleanField));
