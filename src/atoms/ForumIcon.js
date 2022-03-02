import React, { memo } from "react";
import { StyleSheet, Image } from "react-native";

import { withTheme } from "../themes";
import icons from "../icons";

const ForumIcon = props => {
	const { styles, componentStyles } = props;

	if (props.type == "redirect") {
		return <Image style={[props.style, componentStyles.forumIcon, componentStyles.inactiveIcon]} source={icons.FORUM_REDIRECT} />;
	} else if (props.unread) {
		return <Image style={[props.style, componentStyles.forumIcon, componentStyles.activeIcon]} source={icons.FORUM_UNREAD} />;
	} else {
		return <Image style={[props.style, componentStyles.forumIcon, componentStyles.inactiveIcon]} source={icons.FORUM_READ} />;
	}
};

const _componentStyles = styleVars => ({
	forumIcon: {
		width: 20,
		height: 19
	},
	activeIcon: {
		tintColor: styleVars.unread.active
	},
	inactiveIcon: {
		tintColor: styleVars.unread.inactive
	}
});

export default withTheme(_componentStyles)(memo(ForumIcon));
