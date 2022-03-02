import React, { memo } from "react";
import { TouchableOpacity, StyleSheet, Image } from "react-native";

import HeaderButton from "./HeaderButton";

//@todo image refs
const FollowButton = props => {
	const imageToUse = props.followed ? require("../../resources/bookmark_active.png") : require("../../resources/bookmark.png");
	return <HeaderButton icon={imageToUse} onPress={props.onPress} style={props.style} size={props.size} />;
};

export default memo(FollowButton);
