import React, { Component } from "react";
import { Text, Animated, Easing, Image, View } from "react-native";
import * as Animatable from "react-native-animatable";
import _ from "underscore";

import { withTheme } from "../../themes";
import icons from "../../icons";

class PollResultsChoice extends Component {
	constructor(props) {
		super(props);
		this._pollBar = null;
		this._animatedWidth = new Animated.Value(0);
		this._animatedOpacity = new Animated.Value(0);
	}

	componentDidMount() {
		this._timer = setTimeout(() => this.startAnimation(), 700);
	}

	componentWillUnmount() {
		clearTimeout(this._timer);
	}

	getPercentage() {
		if (this.props.data.votes === 0 || parseInt(this.props.totalVotes) === 0) {
			return 0;
		}

		return Math.round((this.props.data.votes / parseInt(this.props.totalVotes)) * 100);
	}

	/**
	 * Set up animations for the poll bar
	 *
	 * @return 	void
	 */
	startAnimation() {
		const percentage = this.getPercentage();
		const animations = [];

		if (percentage > 0) {
			animations.push(
				Animated.timing(this._animatedWidth, {
					toValue: 1,
					duration: percentage * 6, // == 600ms for 100%, 300ms for 50% etc.
					easing: Easing.elastic(),
					useNativeDriver: false
				})
			);
		}

		animations.push(
			Animated.timing(this._animatedOpacity, {
				toValue: 1,
				duration: 500,
				easing: Easing.elastic(),
				useNativeDriver: false
			})
		);

		Animated.sequence(animations).start();
	}

	/**
	 * Get a style object for the percentage text, positioning it depending
	 * on the size of the poll bar
	 *
	 * @return 	object
	 */
	percentageTextStyle() {
		const { styleVars } = this.props;
		const percentage = this.getPercentage();

		if (percentage < 15) {
			return {
				left: "100%",
				marginLeft: 7,
				color: styleVars.lightText
			};
		}

		return {
			right: 7,
			color: styleVars.reverseText
		};
	}

	render() {
		const { styles, componentStyles } = this.props;
		const percentage = this.getPercentage();
		const width = this._animatedWidth.interpolate({
			inputRange: [0, 1],
			outputRange: ["0%", `${percentage}%`]
		});

		return (
			<View style={styles.mbStandard}>
				<View style={[styles.flexRow, styles.flexJustifyBetween, styles.flexAlignEnd]}>
					<Text style={[styles.contentText, styles.text]}>{this.props.data.title}</Text>
					{Boolean(this.props.data.votedFor) && (
						<Image source={icons.CHECKMARK_CIRCLE_SOLID} resizeMode="contain" style={[componentStyles.checkmark, styles.mlTight]} />
					)}
				</View>
				<View style={componentStyles.pollBar}>
					<Animatable.View ref={ref => (this._pollBar = ref)} style={[componentStyles.pollInner, { width }]}>
						<Animated.Text style={[componentStyles.pollPercentage, styles.mediumText, this.percentageTextStyle(), { opacity: this._animatedOpacity }]}>
							{percentage}%
						</Animated.Text>
					</Animatable.View>
				</View>
			</View>
		);
	}
}

const _componentStyles = styleVars => ({
	pollBar: {
		height: 22,
		borderRadius: 4,
		backgroundColor: styleVars.greys.medium,
		marginTop: 2,
		overflow: "hidden"
	},
	pollInner: {
		height: 22,
		borderRadius: 4,
		backgroundColor: styleVars.accentColor
	},
	pollPercentage: {
		position: "absolute",
		lineHeight: 22,
		fontSize: 11
	},
	checkmark: {
		tintColor: styleVars.altAccentColor,
		width: 20,
		height: 20
	}
});

export default withTheme(_componentStyles)(PollResultsChoice);
