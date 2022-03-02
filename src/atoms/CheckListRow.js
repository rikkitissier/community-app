import React, { memo } from "react";
import { Text, View, Image, TouchableHighlight } from "react-native";
import _ from "underscore";

import { withTheme } from "../themes";
import icons from "../icons";

const CheckListRow = props => {
	const { styles, componentStyles } = props;

	return (
		<TouchableHighlight onPress={props.onPress || null}>
			<View style={[styles.row, styles.flexRow, styles.flexAlignCenter, styles.flexJustifyBetween, styles.phWide, styles.pvStandard]}>
				<View>
					{_.isString(props.title) ? <Text style={[styles.text, styles.contentText]}>{props.title}</Text> : props.title}
					{props.subText && <Text style={[styles.lightText, styles.smallText]}>{props.subText}</Text>}
				</View>
				<Image source={props.checked ? icons.CHECKMARK : null} style={componentStyles.check} resizeMode="cover" />
			</View>
		</TouchableHighlight>
	);
};

const _componentStyles = styleVars => ({
	check: {
		width: 16,
		height: 13,
		tintColor: styleVars.checkmarkColor
	}
});

export default withTheme(_componentStyles)(memo(CheckListRow));
