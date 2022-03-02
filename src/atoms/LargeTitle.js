import React, { memo } from "react";
import { Text, View, StyleSheet } from "react-native";

import { withTheme } from "../themes";

const LargeTitle = props => {
	const { styles } = props;
	return (
		<View style={[styles.flexRow, styles.flexAlignCenter, styles.flexJustifyStart, styles.mhWide, styles.mtVeryWide, styles.mbWide]}>
			<Text style={[styles.largeTitle]}>{props.children}</Text>
		</View>
	);
};

export default withTheme()(memo(LargeTitle));
