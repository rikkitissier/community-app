import React, { Component } from "react";
import { Text, View, StyleSheet, Image, TouchableHighlight } from "react-native";

import getImageUrl from "../../utils/getImageUrl";
import { withTheme } from "../../themes";

const ReactionOverview = props => {
	const { componentStyles } = props;

	// Clone and reverse reaction data so that we can show them layered on top of each other
	// Style uses row-reverse to put them back in the right order
	const reactions = props.reactions.slice(0).reverse();
	const size = props.small ? 18 : 24;

	return (
		<View style={[componentStyles.wrapper, { height: size }, props.style]}>
			{reactions.map((reaction, idx) => (
				<Image
					source={{ uri: getImageUrl(reaction.image) }}
					key={reaction.id}
					style={[componentStyles.reaction, { width: size, height: size }, idx === 0 ? componentStyles.first : null]}
				/>
			))}
		</View>
	);
};

const _componentStyles = {
	wrapper: {
		display: "flex",
		flexDirection: "row-reverse",
		justifyContent: "flex-end"
	},
	reaction: {
		marginVertical: 0,
		marginRight: -7
	},
	first: {
		marginLeft: 0
	}
};

export default withTheme(_componentStyles)(ReactionOverview);
