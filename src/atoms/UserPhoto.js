import React, { memo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import _ from "underscore";
import FadeIn from "react-native-fade-in-image";

import getImageUrl from "../utils/getImageUrl";
import { withTheme } from "../themes";

const UserPhoto = props => {
	const size = props.size || 40;
	const { styleVars, componentStyles, styles } = props;
	const photoSize = {
		width: size,
		height: size
	};

	const wrap = {
		borderRadius: size / 2,
		overflow: "hidden"
	};

	let photo;

	if (props.url === null) {
		photo = <View style={[photoSize, componentStyles.photo]} />;
	} else if (props.url.startsWith("{") && props.url.endsWith("}")) {
		// JSON letter photo
		let backgroundColor;
		let letter;
		const fontSize = Math.max(14, Math.round(size * 0.66));

		try {
			const data = JSON.parse(props.url);
			backgroundColor = `#${data.color}`;
			letter = data.letter;
		} catch (err) {
			console.log(err);
			backgroundColor = styleVars.accentColor;
			letter = "?";
		}

		photo = (
			<View style={[styles.flexRow, styles.flexAlignCenter, styles.flexJustifyCenter, componentStyles.letterPhoto, { backgroundColor }, photoSize]}>
				<Text style={[componentStyles.letter, { fontSize }]}>{letter}</Text>
			</View>
		);
	} else {
		photo = (
			<FadeIn>
				<Image
					source={{ uri: getImageUrl(unescape(props.url)) }}
					style={[photoSize, componentStyles.photo, !_.isUndefined(props.anon) && props.anon ? componentStyles.anonymous : null]}
					resizeMode="cover"
					testId="userPhoto"
				/>
			</FadeIn>
		);
	}

	return (
		<View style={props.style || null}>
			<View style={wrap}>{photo}</View>
			{_.isBoolean(props.online) && (
				<View
					testId="onlineIndicator"
					style={[
						componentStyles.onlineBubble,
						{
							backgroundColor: props.online ? styleVars.positive : styleVars.negative
						}
					]}
				/>
			)}
		</View>
	);
};

const _componentStyles = styleVars => ({
	photo: {
		backgroundColor: styleVars.placeholderColors.background
	},
	anonymous: {
		opacity: 0.3
	},
	onlineBubble: {
		position: "absolute",
		bottom: -2,
		right: -2,
		width: 12,
		height: 12,
		borderRadius: 12,
		borderWidth: 2,
		borderStyle: "solid",
		borderColor: styleVars.contentBackground
	},
	letterPhoto: {
		backgroundColor: styleVars.placeholderColors.background
	},
	letter: {
		color: "#fff",
		textAlign: "center"
	}
});

export default withTheme(_componentStyles)(memo(UserPhoto));
