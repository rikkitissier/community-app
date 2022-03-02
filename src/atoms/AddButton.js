import React, { memo } from "react";
import { Image, TouchableOpacity, Text } from "react-native";

import { withTheme } from "../themes";

const AddButton = props => {
	const { componentStyles } = props;

	return (
		<TouchableOpacity style={componentStyles.button} onPress={props.onPress}>
			<React.Fragment>
				<Image style={componentStyles.icon} resizeMode="stretch" source={props.icon} />
				<Text style={componentStyles.text}>{props.title}</Text>
			</React.Fragment>
		</TouchableOpacity>
	);
};

const _componentStyles = styleVars => ({
	button: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center"
	},
	icon: {
		width: 16,
		height: 16,
		tintColor: styleVars.actionBar.darkText
	},
	text: {
		color: styleVars.actionBar.darkText,
		fontSize: 15,
		marginLeft: 6
	}
});

export default withTheme(_componentStyles)(memo(AddButton));
