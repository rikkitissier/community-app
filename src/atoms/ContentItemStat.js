import React, { memo } from "react";
import { Text, View } from "react-native";

import { withTheme } from "../themes";

const ContentItemStat = props => {
	const { styles } = props;
	return (
		<View style={[styles.phStandard, styles.flexBasisZero, styles.flexGrow, props.style]}>
			<Text style={[styles.largeText, styles.mediumText, styles.centerText]}>{props.value}</Text>
			<Text style={[styles.tinyText, styles.lightText, styles.centerText]}>{props.name}</Text>
		</View>
	);
};

export default withTheme()(memo(ContentItemStat));
