import React, { memo } from "react";
import { View, StyleSheet } from "react-native";

import { withTheme } from "../themes";

const TagList = ({ styles, ...props }) => (
	<View style={[styles.flexRow, styles.flexWrap, styles.flexAlignCenter, props.centered ? styles.flexJustifyCenter : null, props.style]}>{props.children}</View>
);

export default withTheme()(memo(TagList));
