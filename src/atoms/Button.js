import React, { memo } from "react";
import { View, Image, TouchableOpacity, Text, ViewPropTypes, ActivityIndicator } from "react-native";
import PropTypes from "prop-types";

import { withTheme } from "../themes";

const Button = props => {
	const { styles, componentStyles } = props;
	const buttonStyle = props.filled ? "Filled" : "Outlined";
	const buttonType = props.type + buttonStyle;
	const textType = buttonType + "Text";
	const textSize = props.size + "Text";
	const rounded = props.rounded ? componentStyles.rounded : null;
	const imageType = buttonType + "Image";
	const colorStyle = props.color ? { backgroundColor: props.color } : null;
	const disabledStyle = props.disabled ? { opacity: 0.4 } : null;
	const fullWidth = props.fullWidth ? [styles.flexRow, styles.flexAlignCenter, styles.flexJustifyCenter] : null;

	return (
		<TouchableOpacity
			style={[componentStyles.button, componentStyles[buttonType], componentStyles[props.size], fullWidth, rounded, colorStyle, disabledStyle, props.style]}
			onPress={!props.disabled ? props.onPress : null}
			disabled={props.disabled}
		>
			<View style={[styles.flexRow, styles.flexAlignCenter, styles.flexJustifyCenter]}>
				{Boolean(props.icon) && <Image style={[componentStyles.icon, componentStyles[imageType]]} resizeMode="stretch" source={props.icon} />}
				{Boolean(props.showActivity) && <ActivityIndicator size="small" color="#fff" />}
				{props.title && (
					<View style={componentStyles.textWrapper}>
						<Text style={[componentStyles[textType], componentStyles.text, componentStyles[textSize]]} numberOfLines={1}>
							{props.title}
						</Text>
					</View>
				)}
			</View>
		</TouchableOpacity>
	);
};

const _componentStyles = styleVars => ({
	button: {
		borderRadius: 3
	},
	rounded: {
		borderRadius: 50
	},
	icon: {
		width: 18,
		height: 18
	},
	textWrapper: {
		flexGrow: 1
	},

	// Sizes
	small: {
		paddingHorizontal: styleVars.spacing.standard,
		paddingVertical: styleVars.spacing.veryTight
	},
	medium: {
		paddingHorizontal: styleVars.spacing.wide,
		paddingVertical: styleVars.spacing.tight
	},
	large: {
		paddingHorizontal: styleVars.spacing.wide,
		paddingVertical: styleVars.spacing.standard
	},

	// Text styles
	text: {
		fontWeight: "500",
		textAlign: "center"
	},
	smallText: {
		fontSize: styleVars.fontSizes.small
	},
	mediumText: {
		fontSize: styleVars.fontSizes.content
	},
	largeText: {
		fontSize: styleVars.fontSizes.content
	},

	// Primary button
	primaryOutlined: {
		borderWidth: 1,
		borderColor: styleVars.primaryButton.mainColor
	},
	primaryOutlinedText: {
		color: styleVars.primaryButton.mainColor
	},
	primaryOutlinedImage: {
		tintColor: styleVars.primaryButton.mainColor
	},
	primaryFilled: {
		backgroundColor: styleVars.primaryButton.mainColor
	},
	primaryFilledText: {
		color: styleVars.primaryButton.inverseColor
	},
	primaryFilledImage: {
		tintColor: styleVars.primaryButton.inverseColor
	},

	// Light button
	lightOutlined: {
		borderWidth: 1,
		borderColor: styleVars.lightButton.mainColor
	},
	lightOutlinedText: {
		color: styleVars.lightButton.mainColor
	},
	lightOutlinedImage: {
		tintColor: styleVars.lightButton.mainColor
	},
	lightFilled: {
		backgroundColor: styleVars.lightButton.mainColor
	},
	lightFilledText: {
		color: styleVars.lightButton.inverseColor
	},
	lightFilledImage: {
		tintColor: styleVars.lightButton.inverseColor
	},

	// Dark button
	darkOutlined: {
		borderWidth: 1,
		borderColor: styleVars.darkButton.mainColor
	},
	darkOutlinedText: {
		color: styleVars.darkButton.mainColor
	},
	darkOutlinedImage: {
		tintColor: styleVars.darkButton.mainColor
	},
	darkFilled: {
		backgroundColor: styleVars.darkButton.mainColor
	},
	darkFilledText: {
		color: styleVars.darkButton.inverseColor
	},
	darkFilledImage: {
		tintColor: styleVars.darkButton.inverseColor
	},

	// Warning button
	warningOutlined: {
		borderWidth: 1,
		borderColor: styleVars.warningButton.mainColor
	},
	warningOutlinedText: {
		color: styleVars.warningButton.mainColor
	},
	warningOutlinedImage: {
		tintColor: styleVars.warningButton.mainColor
	},
	warningFilled: {
		backgroundColor: styleVars.warningButton.mainColor
	},
	warningFilledText: {
		color: styleVars.warningButton.inverseColor
	},
	warningFilledImage: {
		tintColor: styleVars.warningButton.inverseColor
	}
});

export default withTheme(_componentStyles)(memo(Button));

Button.defaultProps = {
	filled: false,
	size: "medium",
	type: "primary",
	fullWidth: true,
	onPress: null
};

Button.propTypes = {
	title: PropTypes.string,
	icon: PropTypes.any,
	size: PropTypes.oneOf(["small", "medium", "large"]),
	type: PropTypes.oneOf(["primary", "light", "warning", "dark"]),
	onPress: PropTypes.func,
	filled: PropTypes.bool,
	fullWidth: PropTypes.bool,
	style: ViewPropTypes.style
};
