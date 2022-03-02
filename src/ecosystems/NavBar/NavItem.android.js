import React, { memo } from "react";
import { View, TouchableOpacity, Image, Text } from "react-native";

import { withTheme } from "../../themes";

const NavItem = ({ componentStyles, styles, ...props }) => (
	<TouchableOpacity style={componentStyles.navItem} onPress={props.onPress}>
		<View style={[styles.flexRow, styles.flexAlignCenter, styles.flexJustifyCenter, styles.pvStandard, styles.mlWide, styles.mrStandard]}>
			<Image source={props.icon} resizeMode="contain" style={[styles.mrTight, componentStyles.navItemIcon]} />
			<Text style={[styles.smallText, componentStyles.navItemText]} allowFontScaling={false}>
				{props.title}
			</Text>
		</View>
	</TouchableOpacity>
);

const _componentStyles = styleVars => ({
	navItem: {},
	navItemText: {
		color: styleVars.navBar.itemText,
		textTransform: "uppercase",
		fontWeight: "500"
	},
	navItemIcon: {
		width: 16,
		height: 16,
		tintColor: styleVars.navBar.itemText
	}
});

export default withTheme(_componentStyles)(NavItem);
