import React, { memo } from "react";
import { View, Text } from "react-native";

import { withTheme } from "../themes";
import Lang from "../utils/Lang";

const Badge = props => {
	const { componentStyles } = props;
	return (
		<View style={[componentStyles.notificationBadge, props.style]}>
			<Text style={componentStyles.notificationBadgeText}>{Lang.formatNumber(props.count)}</Text>
		</View>
	);
};

const _componentStyles = styleVars => ({
	notificationBadge: {
		height: 19,
		minWidth: 19,
		borderRadius: 19,
		paddingHorizontal: 4,
		backgroundColor: styleVars.badgeBackground,
		display: "flex",
		alignItems: "center",
		justifyContent: "center"
	},
	notificationBadgeText: {
		color: styleVars.badgeText,
		fontSize: 10,
		fontWeight: "bold"
	}
});

export default withTheme(_componentStyles)(memo(Badge));
