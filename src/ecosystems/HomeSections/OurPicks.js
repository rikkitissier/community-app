import React, { Component } from "react";
import { Text, Image, View, FlatList, StyleSheet, TouchableHighlight } from "react-native";
import _ from "underscore";
import FadeIn from "react-native-fade-in-image";

import NavigationService from "../../utils/NavigationService";
import LargeTitle from "../../atoms/LargeTitle";
import ContentCard from "../../ecosystems/ContentCard";
import { ReactionOverview } from "../../ecosystems/Reaction";
import getImageUrl from "../../utils/getImageUrl";
import getSuitableImage from "../../utils/getSuitableImage";
import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";

class OurPicks extends Component {
	constructor(props) {
		super(props);
		this.pressHandlers = {};
	}

	getDummyData() {
		return _.range(5).map(idx => ({ key: idx.toString() }));
	}

	/**
	 * Build and return the card component for the given data
	 *
	 * @param 	object 		data 		The item data
	 * @return 	Component
	 */
	getItemCard(data) {
		const { styleVars, componentStyles, styles } = this.props;

		if (this.props.loading) {
			return (
				<ContentCard
					style={{
						width: this.props.cardWidth,
						marginLeft: styleVars.spacing.wide
					}}
					loading={this.props.loading}
				/>
			);
		}

		const imageToUse = getImageUrl(getSuitableImage(data.images || null));
		const cardPieces = {
			image: imageToUse ? (
				<FadeIn style={[componentStyles.imageContainer, styles.mbStandard]} placeholderStyle={{ backgroundColor: styleVars.placeholderColors.from }}>
					<Image style={componentStyles.image} source={{ uri: imageToUse }} resizeMode="cover" />
				</FadeIn>
			) : (
				<View style={componentStyles.imageContainer} />
			),
			content: (
				<React.Fragment>
					<View style={styles.flexRow}>
						<View style={componentStyles.streamItemInfoInner}>
							<Text style={[styles.itemTitle]} numberOfLines={2}>
								{data.title}
							</Text>
						</View>
					</View>
					<View style={[styles.mtTight, styles.flexGrow]}>
						<Text style={[styles.text, styles.standardText, styles.standardLineHeight]} numberOfLines={3}>
							{data.description}
						</Text>
					</View>
					{data.reputation && (Boolean(data.reputation.reactions.length) || (Boolean(data.dataCount) && Boolean(data.dataCount.count))) && (
						<View
							style={[
								styles.flexRow,
								styles.flexAlignCenter,
								styles.flexJustifyBetween,
								styles.mtStandard,
								styles.ptVeryTight,
								styles.tBorder,
								styles.lightBorder
							]}
						>
							{Boolean(data.reputation.reactions.length) && (
								<ReactionOverview style={[styles.mtTight, styles.mlStandard]} reactions={data.reputation.reactions} />
							)}
							{Boolean(data.dataCount) && Boolean(data.dataCount.count) && <Text style={[styles.mtVeryTight, styles.lightText]}>{data.dataCount.words}</Text>}
						</View>
					)}
				</React.Fragment>
			)
		};

		return (
			<ContentCard
				style={{
					width: this.props.cardWidth,
					marginLeft: styleVars.spacing.wide
				}}
				onPress={this.getPressHandler(data.id, data)}
				image={cardPieces.image}
				content={cardPieces.content}
			/>
		);
	}

	/**
	 * Memoization function that returns a press handler for an item
	 *
	 * @param 	int 	id 		ID of item to be fetched
	 * @param 	object	data 	Card data to be passed into handler
	 * @return 	function
	 */
	getPressHandler(id, data) {
		if (_.isUndefined(this.pressHandlers[id])) {
			this.pressHandlers[id] = () => this.onPressItem(data);
		}

		return this.pressHandlers[id];
	}

	/**
	 * Press event handoer
	 *
	 * @param 	object 		The item data
	 * @return 	void
	 */
	onPressItem(data) {
		let params;

		// Figure out if we support this type of view, based on the itemType
		// @todo support review
		if (data.itemType == "COMMENT") {
			params = {
				id: data.item.item.id,
				findComment: parseInt(data.item.id)
			};
		} else {
			params = {
				id: data.item.id
			};
		}

		NavigationService.navigate(data.itemType === "COMMENT" ? data.item.item.url : data.item.url, params);
	}

	render() {
		const { styleVars, componentStyles } = this.props;
		return (
			<FlatList
				horizontal
				snapToInterval={this.props.cardWidth + styleVars.spacing.wide}
				snapToAlignment="start"
				decelerationRate="fast"
				showsHorizontalScrollIndicator={false}
				style={componentStyles.feed}
				data={this.props.loading ? this.getDummyData() : this.props.data.ourPicks}
				keyExtractor={item => (this.props.loading ? item.key : item.id)}
				renderItem={({ item }) => this.getItemCard(item)}
			/>
		);
	}
}

const _componentStyles = styleVars => ({
	imageContainer: {
		height: 135,
		width: "100%",
		backgroundColor: styleVars.placeholderColors.from
	},
	image: {
		flex: 1,
		width: "100%"
	},
	dataCount: {
		marginTop: 6
	}
});

export default withTheme(_componentStyles)(OurPicks);
