import React, { memo } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import PropTypes from "prop-types";

import { withTheme } from "../themes";

const EndOfComments = props => {
	const { componentStyles, styles } = props;
	return (
		<View style={[styles.flex, styles.flexAlignCenter, styles.flexJustifyCenter, componentStyles.wrapper]}>
			{props.reachedEnd && <Text style={[styles.smallText, componentStyles.text]}>{props.label}</Text>}
		</View>
	);
};

const _componentStyles = styleVars => ({
	wrapper: {
		height: 75
	},
	text: {
		color: styleVars.backgroundLightText
	}
});

export default withTheme(_componentStyles)(memo(EndOfComments));

EndOfComments.defaultProps = {
	label: "You're up to date!",
	reachedEnd: true
};

EndOfComments.propTypes = {
	label: PropTypes.string,
	reachedEnd: PropTypes.bool
};
