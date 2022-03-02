import React, { Component } from "react";
import { Text, View, SectionList, Alert, Image, TouchableOpacity } from "react-native";
import { connect } from "react-redux";
import { compose } from "react-apollo";
import ActionSheet from "react-native-actionsheet";
import _ from "underscore";

import { setActiveCommunity, loadCommunities, toggleFavoriteCommunity, toggleSavedCommunity, _devStoreCommunities } from "../../redux/actions/app";
import { CommunityBox } from "../../ecosystems/MultiCommunity";
import { PlaceholderRepeater } from "../../ecosystems/Placeholder";
import ErrorBox from "../../atoms/ErrorBox";
import LargeTitle from "../../atoms/LargeTitle";
import { withTheme } from "../../themes";
import icons, { illustrations } from "../../icons";

class MyCommunitiesScreen extends Component {
	static navigationOptions = ({ navigation }) => {
		return {
			title: "My Communities"
			//headerRight: <HeaderButton icon={icons.PLUS_CIRCLE} onPress={navigation.getParam("onPressAddCommunity")} />
		};
	};

	constructor(props) {
		super(props);

		this.state = {
			loading: true,
			hasMissingCommunities: false
		};

		this._hasMultipleTypes = false;

		this._typeTitles = {
			favorites: "Favorites",
			others: "Others"
		};

		this._pressHandlers = {};
		this.pressCommunity = this.pressCommunity.bind(this);

		this._actionSheetRefs = {};
		this._actionSheetHandlers = {};
		this.toggleFavorite = this.toggleFavorite.bind(this);
		this.reportCommunity = this.reportCommunity.bind(this);
		this.removeFromList = this.removeFromList.bind(this);

		this.props.navigation.setParams({
			onPressAddCommunity: this.onPressAddCommunity.bind(this)
		});
	}

	/**
	 * Mount point. Dispatch action to load our saved community list
	 *
	 * @return void
	 */
	componentDidMount() {
		//this.props.dispatch(_devStoreCommunities());
		this.props.dispatch(loadCommunities());
	}

	/**
	 * Component update.
	 *
	 * @param  	object 		prevProps 		Previous property values
	 * @return 	void
	 */
	componentDidUpdate(prevProps) {
		if (this.props.app.communities.data !== prevProps.app.communities.data) {
			this.checkForMissingCommunities();
		}
	}

	/**
	 * Checks whether we have any Unavailable communities in our data. If so, set state
	 * so we can show a footer message.
	 *
	 * @return array
	 */
	checkForMissingCommunities() {
		const communities = this.props.app.communities.data;

		if (!_.isUndefined(_.find(communities, community => community.status !== "active"))) {
			this.setState({
				hasMissingCommunities: true
			});
		}
	}

	/**
	 * Modifies data coming in from redux to filter only communities we can currently
	 * load in the app.
	 *
	 * @return array
	 */
	getListData() {
		const communities = this.props.app.communities.data;
		const returnData = [];

		const types = {
			favorites: _.filter(communities, community => community.status === "active" && community.isFavorite),
			others: _.filter(communities, community => community.status === "active" && !community.isFavorite)
		};

		// Track whether we have both types to show - we'll use this to show section headers later.
		this._hasMultipleTypes = types.favorites.length && types.others.length;

		for (let k in types) {
			if (!types[k].length) {
				continue;
			}

			returnData.push({
				title: k,
				data: types[k]
			});
		}

		return returnData;
	}

	/**
	 * Render a community in the flatlist
	 *
	 * @param  	object 		item 		Object containing item data to render
	 * @return 	Component
	 */
	renderCommunity(item) {
		const { styles, componentStyles } = this.props;
		const { id, logo, url: apiUrl, client_id: apiKey, name, description, isFavorite } = item;
		const actionSheetOptions = [isFavorite ? "Unset favorite" : "Set as favorite", "Remove from my list", "Cancel"];
		const actionSheetDestructiveIndex = 1;
		const actionSheetCancelIndex = 2;
		const actionSheetOnPress = this.getActionSheetHandler(id);

		return (
			<CommunityBox
				onPress={this.pressCommunity({ apiUrl, apiKey })}
				name={name}
				logo={logo}
				description={description}
				apiKey={apiKey}
				apiUrl={apiUrl}
				actionSheetOptions={actionSheetOptions}
				actionSheetCancelIndex={actionSheetCancelIndex}
				actionSheetDestructiveIndex={actionSheetDestructiveIndex}
				actionSheetOnPress={actionSheetOnPress}
				communityLoading={!this.props.app.bootStatus.loaded && this.props.app.currentCommunity.apiUrl == apiUrl}
				rightComponent={
					<React.Fragment>
						<TouchableOpacity
							onPress={() => this._actionSheetRefs[id].show()}
							style={[styles.plStandard, styles.flexJustifyCenter]}
							hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
						>
							<Image source={icons.DOTS} resizeMode="contain" style={componentStyles.dots} />
						</TouchableOpacity>
						<ActionSheet
							ref={o => (this._actionSheetRefs[id] = o)}
							title={name}
							options={actionSheetOptions}
							cancelButtonIndex={actionSheetCancelIndex}
							destructiveButtonIndex={actionSheetDestructiveIndex}
							onPress={actionSheetOnPress}
						/>
					</React.Fragment>
				}
			/>
		);
	}

	/**
	 * Memoization function for the action sheet handler functions
	 *
	 * @param  	string 		id 		ID of the community to cache functions for
	 * @return 	function
	 */
	getActionSheetHandler(id) {
		if (_.isUndefined(this._actionSheetHandlers[id])) {
			this._actionSheetHandlers[id] = i => {
				switch (i) {
					case 0:
						this.toggleFavorite(id);
						break;
					case 1:
						this.removeFromList(id);
						break;
					/*case 2:
						this.removeFromList(id);
						break;*/
				}
			};
		}

		return this._actionSheetHandlers[id];
	}

	/**
	 * Handler for toggling a community to/from favorites list
	 *
	 * @param  	string 		id 		Community ID to set as (un)favorite
	 * @return 	void
	 */
	toggleFavorite(id) {
		this.props.dispatch(toggleFavoriteCommunity(id));
	}

	/**
	 * Handler for removing community from saved list. Shows alert to confirm actions.
	 *
	 * @param  	string 		id 		Community ID to remove from list
	 * @return 	void
	 */
	removeFromList(id) {
		const community = _.find(this.props.app.communities.data, community => community.id === id);

		Alert.alert(
			"Confirm",
			`Are you sure you want to remove ${community.name} from your saved communities list?`,
			[
				{
					text: "Cancel",
					onPress: () => {},
					style: "cancel"
				},
				{
					text: "Remove",
					onPress: () => this.props.dispatch(toggleSavedCommunity(community)),
					style: "destructive"
				}
			],
			{ cancelable: false }
		);
	}

	reportCommunity(id) {}

	/**
	 * Handler for tapping the + button to add a new community to the app
	 *
	 * @return void
	 */
	onPressAddCommunity() {}

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
	 * Render the list footer - shows a message indicating some communities are missing, if we
	 * didn't get data for them from our API
	 *
	 * @return 	Component|null
	 */
	renderListFooter() {
		const { styles } = this.props;
		if (this.state.hasMissingCommunities) {
			return (
				<View style={[styles.flexRow, styles.mhWide, styles.mtStandard]}>
					<Text style={[styles.centerText, styles.smallText, styles.veryLightText, styles.flexBasisZero, styles.flexGrow]}>
						One or more of your saved communities are currently unavailable. They'll show up here again if they are re-added to our directory.
					</Text>
				</View>
			);

			//<Image source={icons.INFO_SOLID} resizeMode="contain" style={[styles.smallImage, styles.veryLightImage, styles.mrTight]} />
		}

		return null;
	}

	/**
	 * Render a section header in the sectionlist
	 *
	 * @param  	object 		section 		Data for this section
	 * @return 	Component|null
	 */
	renderSectionHeader(section) {
		if (section.title === "favorites" || this._hasMultipleTypes) {
			return <LargeTitle>{this._typeTitles[section.title]}</LargeTitle>;
		}

		return null;
	}

	/**
	 * Render a component to show if there's no items to display
	 *
	 * @return 	Component
	 */
	renderEmptyList() {
		const { styles, componentStyles } = this.props;
		return (
			<View style={[styles.flex, styles.flexAlignCenter, styles.flexJustifyCenter]}>
				<Image source={illustrations.COMMUNITY} resizeMode="contain" style={componentStyles.emptyImage} />

				<Text style={[styles.mtExtraWide, styles.centerText, styles.itemTitle]}>No Saved Communities</Text>
				<Text style={[styles.mhExtraWide, styles.mtStandard, styles.lightText, styles.centerText, styles.contentText]}>
					When you save your favorite communities, we'll show them here for easy access.
				</Text>
			</View>
		);
	}

	render() {
		const { styles } = this.props;
		if (this.props.app.communities.loading) {
			return (
				<View style={styles.mtWide}>
					<PlaceholderRepeater repeat={4}>
						<CommunityBox loading />
					</PlaceholderRepeater>
				</View>
			);
		} else if (this.props.app.communities.error) {
			return <ErrorBox message="Sorry, we can't load your saved communities right now. Please try again later." />;
		} else {
			// @todo empty list
			const listData = this.getListData();

			return (
				<View style={[styles.flex]}>
					<SectionList
						sections={listData}
						keyExtractor={item => item.id}
						stickySectionHeadersEnabled={false}
						renderSectionHeader={({ section }) => this.renderSectionHeader(section)}
						renderItem={({ item }) => this.renderCommunity(item)}
						ListFooterComponent={this.renderListFooter()}
						ListEmptyComponent={this.renderEmptyList()}
						style={styles.flex}
					/>
				</View>
			);
		}
	}
}

const _componentStyles = styleVars => ({
	dots: {
		width: 20,
		height: 20
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
)(MyCommunitiesScreen);
