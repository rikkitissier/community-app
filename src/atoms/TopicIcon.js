import React, { memo } from "react";
import { StyleSheet, Image } from "react-native";

import { withTheme } from "../themes";

// @todo image refs
// @todo styles
const TopicIcon = ({ componentStyles, ...props }) => {
	if (props.unread) {
		return (
			<Image
				style={[props.style, componentStyles.topicIcon, componentStyles.activeIcon]}
				resizeMode="contain"
				source={require("../../resources/topic_unread.png")}
			/>
		);
	} else {
		return (
			<Image
				style={[props.style, componentStyles.topicIcon, componentStyles.inactiveIcon]}
				resizeMode="contain"
				source={require("../../resources/topic_read.png")}
			/>
		);
	}
};

const _componentStyles = {
	topicIcon: {
		width: 11,
		height: 11
	},
	activeIcon: {
		tintColor: "#2080A7"
	},
	inactiveIcon: {
		tintColor: "#8F8F8F"
	}
};

export default withTheme(_componentStyles)(memo(TopicIcon));
