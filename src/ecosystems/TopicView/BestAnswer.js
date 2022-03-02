import React, { memo } from "react";
import { Text, Image, View, StyleSheet, TouchableOpacity } from "react-native";

import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";
import icons from "../../icons";

const BestAnswer = props => {
	const { componentStyles } = props;

	if (props.setBestAnswer == null) {
		return (
			<View style={[componentStyles.wrapper, componentStyles.bestAnswer]}>
				<Image source={icons.CHECKMARK} resizeMode="contain" style={[componentStyles.bestAnswerIcon, componentStyles.bestAnswerIconActive]} />
			</View>
		);
	}

	return (
		<TouchableOpacity onPress={props.setBestAnswer} style={[componentStyles.wrapper, props.isBestAnswer ? componentStyles.bestAnswer : null]}>
			<Image
				source={icons.CHECKMARK}
				resizeMode="contain"
				style={[componentStyles.bestAnswerIcon, props.isBestAnswer ? componentStyles.bestAnswerIconActive : null]}
			/>
		</TouchableOpacity>
	);
};

const _componentStyles = styleVars => ({
	wrapper: {
		width: 34,
		height: 34,
		borderRadius: 34,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: styleVars.veryLightText
	},
	bestAnswer: {
		backgroundColor: styleVars.positive,
		borderColor: "transparent"
	},
	bestAnswerIcon: {
		width: 18,
		height: 18,
		tintColor: styleVars.veryLightText
	},
	bestAnswerIconActive: {
		tintColor: "#fff"
	}
});

export default withTheme(_componentStyles)(memo(BestAnswer));
