import React, { memo } from "react";
import { Text, View, Image, Switch, StyleSheet, TouchableOpacity } from "react-native";
import _ from "underscore";

import { withTheme } from "../themes";

const ToggleRow = ({ styles, componentStyles, styleVars, ...props }) => (
	<View style={[styles.row, props.lastRow && styles.lastRow, styles.flexRow, styles.flexAlignCenter, styles.pvStandard, styles.phWide]}>
		<View style={[styles.flex]}>
			<Text style={[styles.text, styles.contentText]}>{props.title}</Text>
			{Boolean(props.subText) && <Text style={componentStyles.metaText}>{props.subText}</Text>}
		</View>
		<Switch
			trackColor={styleVars.toggle}
			value={props.value}
			disabled={!_.isUndefined(props.enabled) ? !props.enabled : false}
			style={styles.mlStandard}
			onValueChange={props.onToggle || null}
		/>
	</View>
);

const _componentStyles = styleVars => ({
	icon: {
		width: 24,
		height: 24,
		tintColor: styleVars.lightText,
		marginRight: 12
	},
	metaText: {
		color: styleVars.veryLightText,
		fontSize: 12
	}
});

export default withTheme(_componentStyles)(memo(ToggleRow));
