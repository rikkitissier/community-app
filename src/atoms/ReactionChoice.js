import React, { memo } from "react";
import { Image, Text, View, StyleSheet, TouchableHighlight } from "react-native";

import getImageUrl from "../utils/getImageUrl";
import { withTheme } from "../themes";

const ReactionChoice = ({ styles, componentStyles, ...props }) => (
	<TouchableHighlight activeOpacity={0.8} onPress={props.onPress} style={componentStyles.reaction}>
		<React.Fragment>
			<Image source={{ uri: getImageUrl(props.image) }} style={componentStyles.image} />
			<Text style={[styles.mediumText, styles.contentText, styles.text]}>{props.name}</Text>
		</React.Fragment>
	</TouchableHighlight>
);

const _componentStyles = styleVars => ({
	reaction: {
		backgroundColor: styleVars.greys.medium,
		borderRadius: 50,
		width: 200,
		height: 40,
		display: "flex",
		flexDirection: "row",
		justifyContent: "flex-start",
		alignItems: "center",
		marginBottom: 5,
		padding: 5
	},
	image: {
		width: 30,
		height: 30,
		marginRight: 10
	}
});

export default withTheme(_componentStyles)(memo(ReactionChoice));
