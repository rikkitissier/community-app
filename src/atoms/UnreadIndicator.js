import React, { memo } from "react";
import { Text, StyleSheet } from "react-native";

import { withTheme } from "../themes";

const UnreadIndicator = ({ styles, componentStyles, ...props }) => {
	if (!props.show) {
		return null;
	}

	return <Text style={[styles.mrTight, componentStyles.dot, props.style]}>{"\u2022" + " "}</Text>;
};

const _componentStyles = styleVars => ({
	dot: {
		color: styleVars.unread.active,
		fontSize: 20
	}
});

export default withTheme(_componentStyles)(memo(UnreadIndicator));
