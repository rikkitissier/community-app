import React, { PureComponent } from "react";
import { View, TouchableOpacity, Text, Image, Platform } from "react-native";
import _ from "underscore";

import getImageUrl from "../utils/getImageUrl";
import { withTheme } from "../themes";

class PostControl extends PureComponent {
	constructor(props) {
		super(props);
	}

	getIcon() {
		const { componentStyles } = this.props;

		if (!this.props.image) {
			return null;
		}

		if (_.isString(this.props.image)) {
			return <Image source={{ uri: getImageUrl(this.props.image) }} style={componentStyles.image} resizeMode="contain" />;
		}

		return <Image source={this.props.image} style={[componentStyles.image, componentStyles.icon]} resizeMode="contain" />;
	}

	render() {
		const { styles, componentStyles } = this.props;

		return (
			<TouchableOpacity style={[componentStyles.wrapper, this.props.style]} onLongPress={this.props.onLongPress || null} onPress={this.props.onPress || null}>
				<View
					testId={this.props.testId}
					style={[styles.pvTight, styles.flexRow, styles.flexAlignCenter, styles.flexJustifyCenter, this.props.selected ? componentStyles.selected : null]}
				>
					{this.getIcon()}
					<Text
						style={[
							styles.lightText,
							styles.mediumText,
							componentStyles.label,
							this.props.selected ? componentStyles.selectedText : null,
							this.props.textStyle
						]}
					>
						{this.props.label}
					</Text>
				</View>
			</TouchableOpacity>
		);
	}
}

const _componentStyles = styleVars => ({
	wrapper: {
		...Platform.select({
			ios: {
				flex: 1,
				paddingVertical: styleVars.spacing.veryTight
			},
			android: {
				marginRight: styleVars.spacing.extraWide,
				paddingVertical: styleVars.spacing.tight
			}
		})
	},
	selected: {
		backgroundColor: styleVars.postControl.selectedBackground,
		borderRadius: 2
	},
	selectedText: {
		color: styleVars.postControl.selectedText
	},
	image: {
		...Platform.select({
			ios: {
				width: 18,
				height: 18
			},
			android: {
				width: 14,
				height: 14
			}
		}),
		marginRight: 4
	},
	icon: {
		tintColor: styleVars.lightText
	},
	label: {
		...Platform.select({
			ios: {
				fontSize: styleVars.fontSizes.standard
			},
			android: {
				textTransform: "uppercase",
				fontSize: styleVars.fontSizes.small,
				letterSpacing: 0.5
			}
		})
	}
});

export default withTheme(_componentStyles)(PostControl);
