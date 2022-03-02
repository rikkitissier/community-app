import React, { Component } from "react";
import { View } from "react-native";

import RichTextContent from "../../ecosystems/RichTextContent";
import { withTheme } from "../../themes";

const ProfileEditorField = props => {
	if (!props.isActive) {
		return <View />;
	}

	const { styles, style } = props;
	let value;

	try {
		value = JSON.parse(props.content);
	} catch (err) {
		console.log(`Invalid JSON in Editor field`);
		return null;
	}

	return (
		<View style={[style, styles.flex, styles.pWide]}>
			<RichTextContent>{value}</RichTextContent>
		</View>
	);
};

export default withTheme()(ProfileEditorField);
