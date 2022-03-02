import React, { Component } from "react";
import { Text, View, Image, ImageBackground, StyleSheet, TouchableHighlight, TouchableOpacity, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { connect } from "react-redux";
import { graphql, compose } from "react-apollo";
import FadeIn from "react-native-fade-in-image";
import _ from "underscore";

import configureStore from "../../redux/configureStore";
import parseUri from "../../utils/parseUri";
import Lang from "../../utils/Lang";
import ShadowedArea from "../../atoms/ShadowedArea";
import { PlaceholderContainer, PlaceholderElement } from "../../ecosystems/Placeholder";
import styles, { styleVars, categoryStyles } from "../../styles";
import { categoryIcons, categoryImages } from "../../categories";

const CategoryBox = props => {
	if (props.loading) {
		return (
			<ShadowedArea style={[styles.flexGrow, componentStyles.categoryBox, props.style]}>
				<PlaceholderContainer style={{ width: "100%", height: "100%" }}>
					<PlaceholderElement style={{ height: 120, width: "100%" }} />
				</PlaceholderContainer>
			</ShadowedArea>
		);
	}

	const background = !_.isUndefined(categoryImages[props.id]) ? categoryImages[props.id] : categoryImages["_default"];
	const icon = !_.isUndefined(categoryIcons[props.id]) ? categoryIcons[props.id] : categoryIcons["_default"];
	const color = !_.isUndefined(categoryStyles[props.id]) ? categoryStyles[props.id] : categoryStyles["_default"];

	return (
		<ShadowedArea style={[styles.flexGrow, componentStyles.categoryBox, props.style]}>
			<TouchableOpacity style={[componentStyles.touchableBox]} onPress={props.onPress}>
				<FadeIn style={componentStyles.image}>
					<ImageBackground source={background} style={componentStyles.image} resizeMode="cover">
						<LinearGradient
							colors={["rgba(58,69,81,0.2)", "rgba(58,69,81,1)"]}
							start={[0, 0]}
							end={[1, 1]}
							style={[styles.flex, styles.flexGrow, styles.flexAlignCenter, styles.flexJustifyCenter, styles.phWide, componentStyles.innerBox]}
						>
							<Image source={icon} resizeMode="contain" style={[componentStyles.icon, styles.mbTight]} />
							<Text style={[styles.centerText, componentStyles.categoryTitle]}>{props.name}</Text>
						</LinearGradient>
					</ImageBackground>
				</FadeIn>
			</TouchableOpacity>
		</ShadowedArea>
	);
};

export default CategoryBox;

const componentStyles = StyleSheet.create({
	categoryBox: {
		height: 120,
		overflow: "hidden",
		borderRadius: 4,
		backgroundColor: "rgba(58,69,81,0.8)"
	},
	image: {
		height: "100%",
		width: "100%"
	},
	touchableBox: {
		...StyleSheet.absoluteFillObject
	},
	innerBox: {
		...StyleSheet.absoluteFillObject
	},
	icon: {
		width: 40,
		height: 40,
		tintColor: "#fff"
	},
	categoryTitle: {
		color: "#fff",
		fontWeight: "500",
		fontSize: 16
	}
});
