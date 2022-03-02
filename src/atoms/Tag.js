import React, { memo } from "react";
import { Text, View, StyleSheet } from "react-native";

import { withTheme } from "../themes";

const Tag = ({ componentStyles, styles, ...props }) => (
	<View style={[componentStyles.tagWrapper, styles.phTight, styles.mvVeryTight, styles.mrStandard]}>
		<Text style={[componentStyles.tag, styles.tinyText, props.style]}>{props.children}</Text>
	</View>
);

const _componentStyles = styleVars => ({
	tagWrapper: {
		borderColor: styleVars.accentColor,
		borderWidth: 1,
		borderRadius: 14,
		paddingVertical: 3
	},
	tag: {
		color: styleVars.accentColor
	}
});

export default withTheme(_componentStyles)(memo(Tag));
