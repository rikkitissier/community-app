import React, { Component } from "react";
import { Text, View, Image, TouchableHighlight } from "react-native";

import getImageUrl from "../utils/getImageUrl";
import { withTheme } from "../themes";

class Reaction extends Component {
	constructor(props) {
		super(props);
		this.onPress = this.onPress.bind(this);
	}

	/**
	 * Event handler for tapping this reaction
	 *
	 * @return 	void
	 */
	onPress() {
		this.props.onPress({
			id: this.props.id,
			reactionId: this.props.reactionId,
			count: this.props.count,
			image: this.props.image
		});
	}

	render() {
		const { styles, componentStyles } = this.props;
		return (
			<TouchableHighlight onPress={this.props.onPress ? this.onPress : null} key={this.props.id} style={[this.props.style, componentStyles.reactionWrapper]}>
				<View style={[styles.pVeryTight, styles.flexRow, styles.flexGrowZero, styles.flexJustifyCenter, componentStyles.reaction]}>
					<Image source={{ uri: getImageUrl(this.props.image) }} style={componentStyles.reactionImage} resizeMode="cover" />
					<Text style={[styles.smallText, styles.mediumText, styles.phVeryTight, componentStyles.reactionCount]}>{this.props.count}</Text>
				</View>
			</TouchableHighlight>
		);
	}
}

const _componentStyles = styleVars => ({
	reactionWrapper: {
		borderRadius: 4
	},
	reaction: {
		backgroundColor: styleVars.postControl.selectedBackground,
		borderRadius: 4,
		height: 26
	},
	reactionImage: {
		width: 16,
		height: 16
	},
	reactionCount: {
		color: styleVars.postControl.selectedText
	}
});

export default withTheme(_componentStyles)(Reaction);
