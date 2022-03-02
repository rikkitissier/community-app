import React, { memo } from "react";
import { Text, Image, TouchableOpacity } from "react-native";

import { withTheme } from "../themes";

const MenuItem = ({ componentStyles, ...props }) => (
	<TouchableOpacity onPress={props.data.onPress || null} style={componentStyles.menuItemWrap}>
		{Boolean(props.data.icon) && <Image source={props.data.icon} style={componentStyles.icon} />}
		<Text style={componentStyles.menuItem}>{props.data.text}</Text>
	</TouchableOpacity>
);

const _componentStyles = styleVars => ({
	menuItemWrap: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 9
	},
	icon: {
		width: 24,
		height: 24,
		tintColor: styleVars.lightText,
		marginRight: 12
	},
	menuItem: {
		fontSize: 15,
		color: styleVars.text
	}
});

export default withTheme(_componentStyles)(memo(MenuItem));
