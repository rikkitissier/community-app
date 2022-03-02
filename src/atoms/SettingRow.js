import React, { memo } from "react";
import { Text, View, Image, TouchableOpacity } from "react-native";

import { withTheme } from "../themes";

// @todo image refs
const SettingRow = ({ styles, componentStyles, ...props }) => (
	<TouchableOpacity style={[styles.row, componentStyles.menuItemWrap]} onPress={props.data.onPress || null}>
		<View style={componentStyles.menuItem}>
			<Text style={componentStyles.label}>{props.data.title}</Text>
			<Text style={componentStyles.value}>{props.data.value}</Text>
		</View>
		<Image source={require("../../resources/row_arrow.png")} style={componentStyles.arrow} resizeMode="cover" />
	</TouchableOpacity>
);

const _componentStyles = styleVars => ({
	menuItemWrap: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: styleVars.spacing.standard,
		paddingHorizontal: styleVars.spacing.wide
	},
	icon: {
		width: 24,
		height: 24,
		tintColor: styleVars.lightText,
		marginRight: styleVars.spacing.standard
	},
	menuItem: {
		flex: 1
	},
	label: {
		fontSize: 17,
		color: styleVars.text,
		fontWeight: "500"
	},
	value: {
		color: styleVars.lightText,
		fontSize: 15,
		marginTop: 2
	},
	arrow: {
		width: 11,
		height: 17,
		tintColor: styleVars.lightText,
		marginLeft: styleVars.spacing.standard
	}
});

export default withTheme(_componentStyles)(memo(SettingRow));
