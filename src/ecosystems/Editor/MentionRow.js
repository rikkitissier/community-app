import React, { memo } from "react";
import { Text, View } from "react-native";

import UserPhoto from "../../atoms/UserPhoto";
import ContentRow from "../../ecosystems/ContentRow";
import { PlaceholderElement, PlaceholderContainer } from "../../ecosystems/Placeholder";

import { withTheme } from "../../themes";

const MentionRow = props => {
	const { styleVars, styles, componentStyles } = props;

	if (props.loading) {
		return (
			<ContentRow rowStyle={componentStyles.rowStyle}>
				<PlaceholderContainer height={30}>
					<PlaceholderElement circle radius={18} top={8} left={styleVars.spacing.standard} />
					<PlaceholderElement width={200} height={15} top={8} left={40} />
				</PlaceholderContainer>
			</ContentRow>
		);
	}

	return (
		<ContentRow style={componentStyles.row} rowStyle={componentStyles.rowStyle} onPress={props.onPress}>
			<UserPhoto url={props.photo} size={18} />
			<View style={componentStyles.container}>
				<Text style={[styles.standardText]}>{props.name}</Text>
			</View>
		</ContentRow>
	);
};

const _componentStyles = styleVars => ({
	row: {
		display: "flex",
		flexDirection: "row",
		paddingVertical: styleVars.spacing.tight,
		paddingHorizontal: styleVars.spacing.standard
	},
	rowStyle: {
		backgroundColor: "transparent"
	},
	container: {
		marginLeft: styleVars.spacing.standard
	}
});

export default withTheme(_componentStyles)(memo(MentionRow));
