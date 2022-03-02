import React, { Component } from "react";
import { Text, View, FlatList, ScrollView, TouchableOpacity, StatusBar, StyleSheet, Image, Animated, Platform } from "react-native";
import { compose } from "react-apollo";
import { connect } from "react-redux";
import _ from "underscore";
import { LinearGradient } from "expo-linear-gradient";
import { Header } from "react-navigation";
import FadeIn from "react-native-fade-in-image";

import { loadCommunityCategory, setActiveCommunity, toggleSavedCommunity } from "../../redux/actions/app";
import { CommunityBox } from "../../ecosystems/MultiCommunity";
import { PlaceholderRepeater } from "../../ecosystems/Placeholder";
import Button from "../../atoms/Button";
import ErrorBox from "../../atoms/ErrorBox";
import CustomHeader from "../../ecosystems/CustomHeader";
import TwoLineHeader from "../../atoms/TwoLineHeader";
import NavigationService from "../../utils/NavigationService";
import icons, { illustrations } from "../../icons";
import { withTheme } from "../../themes";
import { categoryIcons, categoryImages } from "../../categories";

class MultiCategoryScreen extends Component {
	static navigationOptions = ({ navigation }) => ({
		headerTransparent: true,
		header: props => {
			return <Header {...props} />;
		}
		//title: navigation.state.params.categoryName ? navigation.state.params.categoryName : "Loading..."
	});

	constructor(props) {
		super(props);
		this._pressHandlers = {};
		this._togglePressHandlers = {};
		this._offset = 0;

		this.state = {
			fullHeaderHeight: 200
		};

		this._nScroll = new Animated.Value(0);
		this._scroll = new Animated.Value(0);
		this._heights = [];
		this._nScroll.addListener(Animated.event([{ value: this._scroll }], { useNativeDriver: false }));

		this.buildAnimations();

		this.onEndReached = this.onEndReached.bind(this);
	}

	/**
	 * Load items in this category as soon as we mount
	 *
	 * @return 	void
	 */
	componentDidMount() {
		const { categoryID } = this.props.navigation.state.params;

		this.props.dispatch(loadCommunityCategory(categoryID));
		this.setScreenTitle(this.props.app.categories[categoryID].name);
	}

	/**
	 * If our category ID has changed, load new items. In theory this shouldn't happen
	 * because the screen will unmount as we go back to the category listing, but just in case...
	 *
	 * @return 	void
	 */
	componentDidUpdate(prevProps) {
		const { categoryID } = this.props.navigation.state.params;

		if (prevProps.navigation.state.params.categoryID !== categoryID) {
			this._offset = 0;
			this.props.dispatch(loadCommunityCategory(categoryID, this._offset));
			this.setScreenTitle(this.props.app.categories[categoryID].name);
		}
	}

	/**
	 * Set the header title for this screen
	 *
	 * @param 	string 		name 	Category name
	 * @return 	void
	 */
	setScreenTitle(name) {
		this.props.navigation.setParams({
			categoryName: name
		});
	}

	buildAnimations() {
		const HEADER_HEIGHT = Platform.OS === "ios" ? 76 : 50;
		const SCROLL_HEIGHT = this.state.fullHeaderHeight - HEADER_HEIGHT;

		// Interpolate methods for animations
		this.categoryInfoOpacity = this._scroll.interpolate({
			inputRange: [0, SCROLL_HEIGHT / 2, SCROLL_HEIGHT],
			outputRange: [1, 0.1, 0]
		});
		this.headerY = this._nScroll.interpolate({
			inputRange: [0, SCROLL_HEIGHT, SCROLL_HEIGHT + 1],
			outputRange: [0, 0, 1]
		});
		/*this.imgScale = this._nScroll.interpolate({
			inputRange: [-75, 0, 50],
			outputRange: [1, 1, 0.7],
			extrapolateLeft: "clamp"
		});*/
		this.fixedHeaderOpacity = this._scroll.interpolate({
			inputRange: [0, SCROLL_HEIGHT / 2, SCROLL_HEIGHT * 0.8],
			outputRange: [0, 0.1, 1]
		});
	}

	/**
	 * Memoization function that returns an onPress handler for a community
	 *
	 * @param 	object 		Object with apiUrl and apiKey values
	 * @return 	function
	 */
	pressCommunity(apiInfo) {
		const { apiUrl, apiKey, name, logo, description } = apiInfo;

		if (_.isUndefined(this._pressHandlers[apiUrl])) {
			this._pressHandlers[apiUrl] = () => {
				this.props.dispatch(
					setActiveCommunity({
						apiUrl,
						apiKey,
						name,
						logo,
						description
					})
				);
			};
		}

		return this._pressHandlers[apiUrl];
	}

	/**
	 * Memoization function for the onPress handler that will save a community to user's list
	 *
	 * @param 	string 		ID of community to fetch onPress handler for
	 * @return 	function
	 */
	getToggleCommunityHandler(id) {
		if (_.isUndefined(this._togglePressHandlers[id])) {
			this._togglePressHandlers[id] = () => {
				const categoryItems = this.props.app.categories[this.props.navigation.state.params.categoryID];
				const community = _.find(categoryItems.items, item => item.id === id);

				this.props.dispatch(toggleSavedCommunity(community));
				delete this._togglePressHandlers[id];
			};
		}

		return this._togglePressHandlers[id];
	}

	/**
	 * Render a community item
	 *
	 * @param 	object 		Community data object
	 * @return 	Component
	 */
	renderItem(item) {
		const { id, name, client_id: apiKey, logo, description, url: apiUrl } = item;
		const isSaved = _.find(this.props.app.communities.data, community => community.id === id);

		return (
			<CommunityBox
				onPress={this.pressCommunity({ apiUrl: item.url, apiKey: item.client_id, name, logo, description })}
				name={name}
				logo={logo}
				description={description}
				apiKey={apiKey}
				apiUrl={apiUrl}
				communityLoading={!this.props.app.bootStatus.loaded && this.props.app.currentCommunity.apiUrl == apiUrl}
				rightComponent={
					<View style={{ width: 35 }}>
						{isSaved ? (
							<Button
								onPress={this.getToggleCommunityHandler(id)}
								icon={icons.CHECKMARK2}
								type="light"
								small
								rounded
								filled
								style={{ width: 36, height: 36 }}
							/>
						) : (
							<Button onPress={this.getToggleCommunityHandler(id)} icon={icons.PLUS} type="primary" small rounded style={{ width: 36, height: 36 }} />
						)}
					</View>
				}
			/>
		);
	}

	/**
	 * Handles loading more items when we reach the end of the list. Only does so if the finished/loading flags are false.
	 *
	 * @return 	void
	 */
	onEndReached() {
		const { categoryID } = this.props.navigation.state.params;
		const categoryData = this.props.app.categories[categoryID];

		if (!_.isUndefined(categoryData) && (categoryData.finished || categoryData.loading)) {
			return;
		}

		this.props.dispatch(loadCommunityCategory(categoryID, this.props.app.categories[categoryID].length));
	}

	/**
	 * Emoty category - shouldn't happen in production but might in the early launch stages.
	 *
	 * @return 	Component
	 */
	renderEmptyList() {
		const { styles } = this.props;
		return (
			<View style={[styles.flex, styles.flexAlignCenter, styles.flexJustifyCenter]}>
				<Text style={[styles.mtExtraWide, styles.centerText, styles.itemTitle]}>No Communities</Text>
				<Text style={[styles.mhExtraWide, styles.mtStandard, styles.lightText, styles.centerText, styles.contentText]}>
					There are no communities in this category right now. Check back later!
				</Text>
			</View>
		);
	}

	render() {
		const { styles, componentStyles } = this.props;
		const { categoryID } = this.props.navigation.state.params;
		const thisCategory = this.props.app.categories[categoryID];
		const title = thisCategory.name || "Loading...";

		let ScreenContents;

		if (thisCategory.loading) {
			ScreenContents = (
				<View>
					<PlaceholderRepeater repeat={7}>
						<CommunityBox loading />
					</PlaceholderRepeater>
				</View>
			);
		} else if (thisCategory.error) {
			ScreenContents = <ErrorBox message="Sorry, there was a problem fetching the communities in this category. Please try again later." />;
		} else {
			ScreenContents = (
				<FlatList
					extraData={this.props.app.communities.data}
					data={thisCategory.items}
					keyExtractor={item => item.id}
					renderItem={({ item }) => this.renderItem(item)}
					onEndReached={this.onEndReached}
					ListEmptyComponent={this.renderEmptyList()}
				/>
			);
		}

		return (
			<View style={styles.flex}>
				<StatusBar barStyle="light-content" translucent />
				<Animated.View
					style={[componentStyles.fixedProfileHeader, { opacity: this.fixedHeaderOpacity }]}
					onLayout={e => {
						this.setState({ smallHeaderHeight: e.nativeEvent.layout.height });
					}}
				>
					<CustomHeader
						transparent
						content={
							<View style={[styles.flex, styles.flexAlignCenter, styles.flexJustifyCenter, { paddingTop: 24 }]}>
								<TwoLineHeader title={title} />
							</View>
						}
					/>
				</Animated.View>
				<Animated.ScrollView
					showsVerticalScrollIndicator={false}
					scrollEventThrottle={5}
					style={[styles.flex, { zIndex: 0 }]}
					onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: this._nScroll } } }], { useNativeDriver: true })}
				>
					<Animated.View
						onLayout={e => {
							this.setState({ fullHeaderHeight: e.nativeEvent.layout.height });
						}}
						style={[componentStyles.header, { transform: [{ translateY: this.headerY }] }]}
					>
						<FadeIn style={styles.absoluteFill}>
							<Image source={categoryImages[categoryID]} resizeMode="cover" style={[styles.absoluteFill, componentStyles.headerImage]} />
						</FadeIn>
						<LinearGradient colors={["rgba(58,69,81,0.2)", "rgba(58,69,81,1)"]} start={[0, 0]} end={[1, 1]} style={[styles.absoluteFill]} />
						<Animated.View style={[styles.flex, styles.flexAlignCenter, styles.flexJustifyCenter, styles.absoluteFill, { opacity: this.categoryInfoOpacity }]}>
							<Image source={categoryIcons[categoryID]} resizeMode="contain" style={[styles.mbWide, componentStyles.headerIcon]} />
							<Text style={[styles.centerText, styles.mediumText, styles.extraLargeText, componentStyles.categoryName]}>{title}</Text>
						</Animated.View>
					</Animated.View>
					{ScreenContents}
				</Animated.ScrollView>
			</View>
		);
	}
}

const _componentStyles = styleVars => ({
	fixedProfileHeader: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 100
	},
	header: {
		height: 200,
		zIndex: 1
	},
	headerImage: {
		height: 200
	},
	headerIcon: {
		width: 60,
		height: 60,
		tintColor: styleVars.headerText
	},
	categoryName: {
		color: styleVars.headerText
	},
	emptyImage: {
		width: "100%",
		height: 150,
		marginTop: styleVars.spacing.extraWide * 2
	}
});

export default compose(
	connect(state => ({
		app: state.app
	})),
	withTheme(_componentStyles)
)(MultiCategoryScreen);
