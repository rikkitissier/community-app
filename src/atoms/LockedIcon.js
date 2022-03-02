import React, { memo } from "react";
import { StyleSheet, Image } from "react-native";

import icons from "../icons";
import { withTheme } from "../themes";

const LockedIcon = ({ componentStyles, ...props }) => <Image style={[props.style, componentStyles.icon]} resizeMode="stretch" source={icons.LOCKED} />;

const _componentStyles = {
	icon: {
		width: 14,
		height: 14
	}
};

export default withTheme(_componentStyles)(memo(LockedIcon));
