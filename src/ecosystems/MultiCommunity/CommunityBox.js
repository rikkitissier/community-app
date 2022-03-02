import React, { Component } from "react";
import { Text, View, Image, StyleSheet, TouchableHighlight, TouchableOpacity, ActivityIndicator } from "react-native";
import { connect } from "react-redux";
import { graphql, compose } from "react-apollo";
import FadeIn from "react-native-fade-in-image";
import _ from "underscore";

import configureStore from "../../redux/configureStore";
import parseUri from "../../utils/parseUri";
import Lang from "../../utils/Lang";
import ShadowedArea from "../../atoms/ShadowedArea";
import { PlaceholderContainer, PlaceholderElement } from "../../ecosystems/Placeholder";
import highlightTerms from "../../utils/highlightTerms";
import styles, { styleVars } from "../../styles";
import icons from "../../icons";

class CommunityBox extends Component {
	constructor(props) {
		super(props);
	}

	/**
	 * Return the URL to display for this community. Returns just the subdomain/domain,
	 * and excludes www.
	 *
	 * @return 	string
	 */
	getDisplayUrl() {
		const parsedUri = parseUri(this.props.apiUrl);
		const authority = parsedUri.authority;

		// Split by . to get the subdomain
		const split = authority.split(".");

		// Don't show www in domains; remove and return if it's there.
		if (split[0] === "www") {
			split.shift();
			return split.join(".");
		}

		return authority;
	}

	/**
	 * Highlight the given text if our highlight property contains some text
	 *
	 * @param 	string 		text 		The text to highlight
	 * @return 	Component|string
	 */
	maybeDoHighlight(text) {
		// For now, don't do highlighting since it won't do partial word matches
		/*if (this.props.highlight) {
			return highlightTerms(text, this.props.highlight, styles.highlightedText);
		}*/

		return text;
	}

	render() {
		if (this.props.loading) {
			return (
				<ShadowedArea style={[componentStyles.communityBox, styles.mbStandard, this.props.style]}>
					<PlaceholderContainer style={[styles.flex, styles.pStandard]} onPress={this.props.onPress}>
						<PlaceholderElement width={50} height={50} left={0} top={0} />
						<PlaceholderElement width={200} height={17} left={62} top={8} />
						<PlaceholderElement width={150} height={13} left={62} top={30} />
					</PlaceholderContainer>
				</ShadowedArea>
			);
		}

		const displayUrl = this.getDisplayUrl();
		const RightComponent = this.props.rightComponent;

		return (
			<ShadowedArea style={[componentStyles.communityBox, styles.mbTight, this.props.style]}>
				<TouchableOpacity style={[styles.flex, styles.pWide]} onPress={this.props.onPress}>
					<View style={[styles.flexRow, componentStyles.communityInfo]}>
						<View style={[styles.mrStandard, componentStyles.image]}>
							{this.props.logo && (
								<FadeIn>
									<Image source={{ uri: this.props.logo }} resizeMode="contain" style={componentStyles.communityLogo} />
								</FadeIn>
							)}
							{this.props.communityLoading && (
								<View style={[styles.flex, styles.flexJustifyCenter, styles.flexAlignCenter, styles.absoluteFill, componentStyles.loadingWrap]}>
									<ActivityIndicator size="small" color="#ffffff" />
								</View>
							)}
						</View>
						<View style={[styles.flex, styles.flexJustifyCenter]}>
							<Text style={[styles.itemTitle]}>{this.maybeDoHighlight(this.props.name)}</Text>
							<Text style={[styles.smallText, styles.lightText]}>{this.maybeDoHighlight(displayUrl)}</Text>
						</View>
						{this.props.rightComponent && <View>{RightComponent}</View>}
					</View>
					{this.props.description && (
						<View style={[styles.ptStandard, styles.mtStandard, componentStyles.communityDescription]}>
							<Text numberOfLines={3}>
								{this.props.categoryName && <Text style={[styles.lightText, componentStyles.categoryNameText]}>({this.props.categoryName}) </Text>}
								{this.maybeDoHighlight(this.props.description)}
							</Text>
						</View>
					)}
				</TouchableOpacity>
			</ShadowedArea>
		);
	}
}

export default compose(
	connect(state => ({
		app: state.app
	}))
)(CommunityBox);

const componentStyles = StyleSheet.create({
	communityBox: {
		minHeight: 74
	},
	communityDescription: {
		borderTopWidth: 1,
		borderTopColor: styleVars.greys.medium
	},
	communityLogo: {
		width: 40,
		height: 40
	},
	image: {
		width: 40,
		height: 40,
		borderRadius: 4,
		overflow: "hidden"
	},
	loadingWrap: {
		backgroundColor: "rgba(0,0,0,0.3)"
	},
	categoryName: {
		/*backgroundColor: styleVars.greys.medium,
		borderRadius: 20,
		paddingVertical: 4,
		paddingHorizontal: 8*/
	},
	categoryNameText: {
		/*fontSize: 11*/
	}
});
