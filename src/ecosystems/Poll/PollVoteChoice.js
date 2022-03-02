import React, { Component } from "react";
import { Text, Animated, Easing, Image, View, TouchableWithoutFeedback, StyleSheet } from "react-native";
import _ from "underscore";

import { withTheme } from "../../themes";
import icons from "../../icons";

class PollVoteChoice extends Component {
	constructor(props) {
		super(props);
		this.checkMe = this.checkMe.bind(this);
	}

	checkMe() {
		this.props.toggleChoice(this.props.choiceNumber);
	}

	render() {
		const { styles, componentStyles } = this.props;

		return (
			<View style={styles.mbStandard}>
				<TouchableWithoutFeedback onPress={this.checkMe}>
					<View style={[styles.flexRow, styles.flexJustifyStart, styles.flexAlignCenter]}>
						<View
							style={[
								styles.flexAlignSelfStart,
								styles.flexRow,
								styles.flexAlignCenter,
								styles.flexJustifyCenter,
								componentStyles.baseControl,
								componentStyles[this.props.type],
								this.props.checked ? componentStyles.checked : null,
								styles.mrStandard
							]}
						>
							{Boolean(this.props.checked) && <Image source={icons.CHECKMARK2} resizeMode="contain" style={componentStyles.tick} />}
						</View>
						<Text style={[styles.flexBasisZero, styles.flexGrow, styles.contentText, styles.text, componentStyles.choiceText]}>{this.props.data.title}</Text>
					</View>
				</TouchableWithoutFeedback>
			</View>
		);
	}
}

const _componentStyles = styleVars => ({
	baseControl: {
		borderWidth: 1,
		borderColor: styleVars.accentColor,
		width: 30,
		height: 30
	},
	radio: {
		borderRadius: 30
	},
	checkbox: {
		borderRadius: 4
	},
	checked: {
		backgroundColor: styleVars.accentColor
	},
	tick: {
		width: 16,
		height: 16,
		tintColor: styleVars.reverseText
	}
});

export default withTheme(_componentStyles)(PollVoteChoice);
