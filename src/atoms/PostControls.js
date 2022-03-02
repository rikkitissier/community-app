import React from "react";
import { View, Platform } from "react-native";

import { withTheme } from "../themes";

const PostControls = ({ styles, componentStyles, ...props }) => {
	return (
		<View
			style={[
				Platform.OS === "ios" ? styles.flexJustifyCenter : styles.flexJustifyStart,
				styles.flexRow,
				styles.flexGrow,
				styles.flexAlignStretch,
				componentStyles.postControls,
				props.style
			]}
		>
			{props.children}
		</View>
	);
};

const _componentStyles = styleVars => ({
	postControls: {
		borderTopWidth: 1,
		borderTopColor: styleVars.borderColors.medium
	}
});

export default withTheme(_componentStyles)(PostControls);
