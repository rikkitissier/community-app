import React, { memo } from "react";
import { TouchableOpacity, Image } from "react-native";

import { withTheme } from "../../themes";

const QuillToolbarButton = ({ componentStyles, ...props }) => (
	<TouchableOpacity style={[componentStyles.button, props.active ? componentStyles.activeButton : null]} onPress={props.onPress}>
		<Image source={props.icon} style={[componentStyles.image, props.active ? componentStyles.activeImage : null]} />
	</TouchableOpacity>
);

const _componentStyles = styleVars => ({
	button: {
		width: 34,
		height: 34,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		marginLeft: 5,
		borderRadius: 34
	},
	activeButton: {
		backgroundColor: styleVars.accessoryToolbar.activeButtonBackground
	},
	image: {
		tintColor: styleVars.accessoryToolbar.inactiveButtonText,
		width: 20,
		height: 20
	},
	activeImage: {
		tintColor: styleVars.accessoryToolbar.activeButtonText
	}
});

export default withTheme(_componentStyles)(memo(QuillToolbarButton));
