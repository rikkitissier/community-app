import React, { memo } from "react";
import { View, Text } from "react-native";

import { withTheme } from "../themes";

const CategoryName = props => {
	const { styles, componentStyles } = props;
	const colorIndicator = props.color ? { backgroundColor: props.color } : null;

	return (
		<View style={[styles.flexRow, styles.flexAlignCenter, props.style]}>
			{props.showColor && <View style={[componentStyles.colorIndicator, styles.mrVeryTight, colorIndicator]} />}
			<Text style={[styles.smallText, styles.text, componentStyles.categoryTitle]} numberOfLines={1}>
				{props.name}
			</Text>
		</View>
	);
};

const _componentStyles = styleVars => ({
	colorIndicator: {
		width: 9,
		height: 9,
		borderRadius: 2,
		backgroundColor: styleVars.accentColor
	}
});

export default withTheme(_componentStyles)(memo(CategoryName));
