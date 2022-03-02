import React, { Component } from "react";
import { Text, View, TextInput, Image, SectionList, AsyncStorage, TouchableOpacity, Dimensions } from "react-native";
import { connect } from "react-redux";
import _ from "underscore";
import gql from "graphql-tag";
import { compose, withApollo } from "react-apollo";
import { TabView, TabBar } from "react-native-tab-view";

import Lang from "../../utils/Lang";
import CustomHeader from "../../ecosystems/CustomHeader";
import { PlaceholderElement, PlaceholderContainer, PlaceholderRepeater } from "../../ecosystems/Placeholder";
import SectionHeader from "../../atoms/SectionHeader";
import MemberRow from "../../ecosystems/MemberRow";
import ErrorBox from "../../atoms/ErrorBox";
import ContentRow from "../../ecosystems/ContentRow";
import SearchBox from "../../ecosystems/SearchBox";
import { SearchContentPanel, SearchMemberPanel, SearchResultFragment, SearchResult } from "../../ecosystems/Search";
import { withTheme } from "../../themes";
import icons from "../../icons";

const OverviewSearchQuery = gql`
	query OverviewSearchQuery($term: String) {
		core {
			search {
				types {
					key
					lang
				}
			}
			content: search(term: $term, limit: 3, orderBy: relevancy) {
				count
				results {
					... on core_ContentSearchResult {
						...SearchResultFragment
					}
				}
			}
			members: search(term: $term, type: core_members, limit: 3) {
				count
				results {
					... on core_Member {
						id
						photo
						name
						group {
							name
						}
					}
				}
			}
		}
	}
	${SearchResultFragment}
`;

// @todo replace tabs
class SearchScreen extends Component {
	static navigationOptions = {
		header: null
	};

	constructor(props) {
		super(props);
		this._textInput = null;
		this.state = {
			// main search stuff
			index: 0,
			searchTerm: "",
			loadingSearchResults: false,
			currentTab: "",
			overviewSearchResults: {},
			noResults: false,
			searchSections: {},
			showingResults: false,
			textInputActive: false,

			// initial screen
			recentSearches: [],
			loadingRecentSearches: true,
			loadingTrendingSearches: true
		};

		this.searchEmptyTextBox = this.searchEmptyTextBox.bind(this);
		this.searchOnCancel = this.searchOnCancel.bind(this);
		this.onRef = this.onRef.bind(this);
		this.renderTabBar = this.renderTabBar.bind(this);
		this.renderScene = this.renderScene.bind(this);
	}

	/**
	 * On mount, load our recent searches from storage then update state
	 *
	 * @return 	void
	 */
	async componentDidMount() {
		try {
			const recentSearchData = await AsyncStorage.getItem(`@recentSearches:${this.props.app.currentCommunity.apiUrl}`);
			const recentSearches = this.transformRecentSearchData(recentSearchData);

			this.setState({
				recentSearches,
				loadingRecentSearches: false
			});
		} catch (err) {
			this.setState({
				loadingRecentSearches: false
			});
		}
	}

	/**
	 * Takes raw recent search data  (e.g. from AsyncStorage) and returns a simple list of terms
	 *
	 * @return 	array
	 */
	transformRecentSearchData(recentSearchData) {
		const recentSearches = [];

		if (recentSearchData !== null) {
			const searchData = JSON.parse(recentSearchData);
			const timeNow = Date.now() / 1000;
			const cutoff = timeNow - 5184000; // 3 months

			searchData.forEach(result => {
				if (result.time >= cutoff) {
					recentSearches.push(result.term);
				}
			});
		}

		return recentSearches;
	}

	/**
	 * onFocus event handler
	 *
	 * @return 	void
	 */
	onFocusTextInput = () => {
		this.setState({
			textInputActive: true,
			showingResults: false
		});
	};

	/**
	 * onBlur event handler
	 *
	 * @return 	void
	 */
	onBlurTextInput = () => {
		this.setState({
			textInputActive: false
		});
	};

	/**
	 * Handler for tapping the X in the search field
	 *
	 * @return 	void
	 */
	searchEmptyTextBox() {
		this.setState({
			textInputActive: this.state.searchFocus,
			searchTerm: "",
			showingResults: false
		});
	}

	/**
	 * Handler for cancel event on search box
	 *
	 * @return 	void
	 */
	searchOnCancel() {
		this.setState({
			searchTerm: "",
			textInputActive: false,
			showingResults: false
		});
	}

	/**
	 * Receive a reference to the text input in the search box
	 *
	 * @return 	void
	 */
	onRef(textInput) {
		this._textInput = textInput;
	}

	/**
	 * Event handler for submitting the search field. Sends the overview query.
	 *
	 * @return 	void
	 */
	onSubmitTextInput = async () => {
		this.setState({
			loadingSearchResults: true
		});

		this._textInput.blur();

		try {
			const { data } = await this.props.client.query({
				query: OverviewSearchQuery,
				variables: {
					term: this.state.searchTerm
				},
				fetchPolicy: "no-cache"
			});

			// Add the All Content tab to the start
			const searchSections = [
				{
					key: "overview",
					title: Lang.get("overview")
				},
				{
					key: "all",
					title: Lang.get("content")
				},
				...data.core.search.types.map((type, index) => ({
					key: type.key,
					title: type.lang
				}))
			];

			const recentSearches = await this.addToRecentSearches(this.state.searchTerm);

			this.setState({
				currentTab: "overview",
				noResults: !data.core.content.results.length && !data.core.members.results.length,
				overviewSearchResults: {
					content: data.core.content,
					members: data.core.members
				},
				showingResults: true,
				searchSections,
				recentSearches
			});
		} catch (err) {
			console.log(err);
		}

		this.setState({
			loadingSearchResults: false
		});
	};

	/**
	 * Add a new term to the recent searches list, tidying it up and removing dupes too
	 *
	 * @param 	string 		term 	The term to add to the recent search list
	 * @return 	void
	 */
	async addToRecentSearches(term) {
		let recentSearchData = await AsyncStorage.getItem(`@recentSearches:${this.props.app.currentCommunity.apiUrl}`);

		if (recentSearchData === null) {
			recentSearchData = [];
		} else {
			recentSearchData = JSON.parse(recentSearchData);
		}

		// First, add our new search to the top of the list
		recentSearchData.unshift({
			term: term,
			time: Date.now()
		});

		// Now remove any dupes
		recentSearchData = _.uniq(recentSearchData, false, data => data.term);

		// Now check the length
		if (recentSearchData.length > 5) {
			recentSearchData = recentSearchData.slice(0, 4);
		}

		// AsyncStorage requires a string
		recentSearchData = JSON.stringify(recentSearchData);

		// Store it back in storage
		await AsyncStorage.setItem(`@recentSearches:${this.props.app.currentCommunity.apiUrl}`, recentSearchData);

		// Now transform it and return
		return this.transformRecentSearchData(recentSearchData);
	}

	/**
	 * Build the sectionlist for the search home screen
	 *
	 * @return 	Component
	 */
	getSearchHomeScreen() {
		const sectionData = [
			{
				title: Lang.get("recent_searches"),
				key: "recent",
				data: this.state.recentSearches
			}
			/*{
				title: "Trending Searches",
				key: "trending",
				data: [
					"Fusce Ornare Purus",
					"Commodo Ipsum",
					"Tristique Nibh Quam Parturient",
					"Inceptos Nibh"
				]
			}*/
		];

		return (
			<SectionList
				renderItem={({ item }) => this.renderShortcutItem(item)}
				renderSectionFooter={({ section }) => this.renderShortcutFooter(section)}
				renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
				sections={sectionData}
				keyExtractor={item => item}
				keyboardShouldPersistTaps="always"
			/>
		);
	}

	/**
	 * Render a footer component for the search home screen. Used to render
	 * Loading or None text in empty sections.
	 *
	 * @param 	object 		section 	Section data
	 * @return 	Component|null
	 */
	renderShortcutFooter(section) {
		if (section.data.length) {
			return null;
		}

		let text = `${Lang.get("loading")}...`;

		if (section.key === "recent" && !this.state.loadingRecentSearches) {
			text = Lang.get("no_recent_searches");
		} else if (section.key === "trending" && !this.state.loadingTrendingSearches) {
			text = Lang.get("no_trending_searches");
		}

		const { styles } = this.props;

		return (
			<ContentRow style={[styles.pvStandard, styles.phWide, styles.flexRow, styles.flexAlignCenter, styles.flexJustifyBetween]}>
				<Text numberOfLines={1} style={[styles.contentText, styles.veryLightText]}>
					{text}
				</Text>
			</ContentRow>
		);
	}

	/**
	 * Event handler for tapping on a search shortcut row
	 *
	 * @param 	string 		term 	The search term tapped
	 * @return 	void
	 */
	recentSearchClick(term) {
		// Since search relies on the searchterm being in state, we need to
		// run the search as a callback in setState
		this.setState(
			{
				searchTerm: term
			},
			() => {
				this.onSubmitTextInput();
			}
		);
	}

	/**
	 * Render a shortcut row
	 *
	 * @param 	object 		item 		Row item data
	 * @return 	Component
	 */
	renderShortcutItem(item) {
		const { styles } = this.props;
		return (
			<ContentRow
				style={[styles.pvStandard, styles.phWide, styles.flexRow, styles.flexAlignCenter, styles.flexJustifyBetween]}
				onPress={() => this.recentSearchClick(item)}
			>
				<Text numberOfLines={1} style={[styles.text, styles.contentText]}>
					{item}
				</Text>
				<Image source={icons.SEARCH} style={[styles.normalImage, styles.tinyImage]} resizeMode="contain" />
			</ContentRow>
		);
	}

	/**
	 * Render combined results for the overview tab
	 *
	 * @return 	Component
	 */
	renderOverviewTab() {
		const overviewData = [];

		if (this.state.overviewSearchResults.content.results.length) {
			overviewData.push({
				title: Lang.get("top_content"),
				key: "all",
				count: this.state.overviewSearchResults.content.count,
				data: this.state.overviewSearchResults.content.results
			});
		}

		if (this.state.overviewSearchResults.members.results.length) {
			overviewData.push({
				title: Lang.get("top_members"),
				key: "core_members",
				count: this.state.overviewSearchResults.members.count,
				data: this.state.overviewSearchResults.members.results
			});
		}

		return (
			<SectionList
				renderItem={({ item }) => this.renderOverviewItem(item)}
				renderSectionFooter={({ section }) => this.renderOverviewSectionFooter(section)}
				renderSectionHeader={({ section }) => Boolean(section.data.length) && <SectionHeader title={section.title} />}
				sections={overviewData}
				stickySectionHeadersEnabled={false}
				keyExtractor={item => (item["__typename"] == "core_Member" ? "m" + item.id : "c" + item.indexID)}
				ListEmptyComponent={() => <ErrorBox message={Lang.get("no_results")} showIcon={false} />}
			/>
		);
	}

	/**
	 * Render a row on the Overview search screen - either a member or a stream card
	 *
	 * @param 	object 		item 		Object of item data from search
	 * @return 	Component
	 */
	renderOverviewItem(item) {
		if (item["__typename"] == "core_Member") {
			return <MemberRow id={parseInt(item.id)} name={item.name} photo={item.photo} groupName={item.group.name} />;
		} else {
			return <SearchResult data={item} term={this.state.searchTerm} />;
		}
	}

	/**
	 * Render a footer for the overview search screen sections. Shows a See All link
	 * if there are additional results
	 *
	 * @param 	object 		section 	Object containing section data
	 * @return 	Component|null
	 */
	renderOverviewSectionFooter(section) {
		const { styles, componentStyles } = this.props;
		if (section.data.length) {
			if (section.count > section.data.length) {
				return (
					<ContentRow
						style={[styles.pvStandard, styles.phWide]}
						onPress={() => {
							console.log(`here ${section.key}`);
							console.log(this.state.searchSections);
							console.log(_.findIndex(this.state.searchSections, s => s.key == section.key));

							this.setState({
								index: _.findIndex(this.state.searchSections, s => s.key == section.key)
							});
						}}
					>
						<Text numberOfLines={1} style={[styles.centerText, styles.mediumText, styles.contentText, styles.text]}>
							{Lang.get("see_all")} ({Lang.formatNumber(section.count)})
						</Text>
					</ContentRow>
				);
			}
		}

		return null;
	}

	/**
	 * Render a custom tab bar. Uses the normal tab bar, but wraps it in an animated view so that
	 * the translateY pos can be animated to create a sticky header
	 *
	 * @return 	Component
	 */
	renderTabBar(props) {
		const { styles, styleVars } = this.props;

		return (
			<View>
				<TabBar
					{...props}
					scrollEnabled
					bounces
					tabStyle={{ minWidth: 50 }}
					style={styles.tabBar}
					indicatorStyle={styles.tabBarIndicator}
					activeColor={styleVars.tabBar.active}
					inactiveColor={styleVars.tabBar.inactive}
					getLabelText={({ route }) => route.title}
					labelStyle={styles.tabBarLabelStyle}
				/>
			</View>
		);
	}

	/**
	 * Given a particular route, return the component that will render the tab panel
	 *
	 * @param 	object
	 * @return 	Component
	 */
	renderScene({ route }) {
		const routes = this.state.searchSections;
		const thisIndex = routes.findIndex(r => r.key === route.key);

		if (route.key === "overview") {
			return this.renderOverviewTab();
		}

		const PanelComponent = route.key === "core_members" ? SearchMemberPanel : SearchContentPanel;

		return <PanelComponent type={route.key} typeName={route.title} term={this.state.searchTerm} showResults={true} />;
	}

	/**
	 * Build the tab panels for our results screen
	 *
	 * @return 	Component
	 */
	getResultsViews() {
		const { styles, componentStyles, styleVars } = this.props;

		return (
			<React.Fragment>
				<TabView
					navigationState={{
						index: this.state.index,
						routes: this.state.searchSections
					}}
					onIndexChange={index => {
						this.setState({
							index,
							currentTab: this.state.searchSections[index].key
						});
					}}
					renderScene={this.renderScene}
					renderTabBar={this.renderTabBar}
					initialLayout={{
						width: Dimensions.get("window").width
					}}
					lazy
				/>
			</React.Fragment>
		);
	}

	/**
	 * Returns the placeholder elements for the overview screen
	 *
	 * @return 	Component
	 */
	getResultsPlaceholder() {
		const { componentStyles } = this.props;
		return (
			<View style={{ flex: 1 }}>
				<PlaceholderContainer height={48} style={componentStyles.loadingTabBar}>
					<PlaceholderElement width={70} height={14} top={17} left={13} />
					<PlaceholderElement width={80} height={14} top={17} left={113} />
					<PlaceholderElement width={90} height={14} top={17} left={225} />
					<PlaceholderElement width={70} height={14} top={17} left={345} />
				</PlaceholderContainer>
				<PlaceholderRepeater repeat={2}>
					<SearchResult loading={true} />
				</PlaceholderRepeater>
				<PlaceholderRepeater repeat={3}>
					<MemberRow loading={true} />
				</PlaceholderRepeater>
			</View>
		);
	}

	render() {
		const { componentStyles } = this.props;
		const searchBox = (
			<SearchBox
				placeholder={Lang.get("search_site", {
					siteName: this.props.site.settings.board_name
				})}
				onChangeText={searchTerm => this.setState({ searchTerm })}
				value={this.state.searchTerm}
				onFocus={this.onFocusTextInput}
				onBlur={this.onBlurTextInput}
				onCancel={this.searchOnCancel}
				emptyTextBox={this.searchEmptyTextBox}
				onSubmitTextInput={this.onSubmitTextInput}
				onRef={this.onRef}
			/>
		);

		let content;
		if (this.state.loadingSearchResults) {
			content = this.getResultsPlaceholder();
		} else if (this.state.showingResults) {
			content = this.getResultsViews();
		} else {
			content = this.getSearchHomeScreen();
		}

		return (
			<View style={{ flex: 1 }}>
				<CustomHeader content={searchBox} />
				{content}
			</View>
		);
	}
}

const _componentStyles = styleVars => ({
	searchWrap: {
		paddingHorizontal: styleVars.spacing.tight,
		paddingBottom: styleVars.spacing.tight,
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		paddingHorizontal: styleVars.spacing.tight,
		display: "flex",
		flexDirection: "row",
		alignItems: "center"
	},
	searchBox: {
		backgroundColor: "rgba(255,255,255,0.1)",
		paddingVertical: styleVars.spacing.tight,
		paddingHorizontal: styleVars.spacing.tight,
		borderRadius: 5,
		flex: 1,
		flexDirection: "row",
		alignItems: "center"
	},
	searchBoxActive: {
		backgroundColor: "rgba(0,0,0,0.2)"
	},
	textInput: {
		color: "#fff",
		flex: 1
	},
	searchIcon: {
		width: 14,
		height: 14,
		tintColor: "rgba(255,255,255,0.6)",
		marginRight: styleVars.spacing.veryTight
	},
	cancelLink: {
		marginLeft: styleVars.spacing.standard
	},
	cancelLinkText: {
		color: styleVars.headerText,
		fontSize: styleVars.fontSizes.content
	},
	tabBarText: {
		fontWeight: "bold",
		fontSize: 13
	},
	activeTabUnderline: {
		backgroundColor: styleVars.accentColor,
		height: 2
	},
	tab: {
		flex: 1,
		backgroundColor: styleVars.appBackground
	},
	loadingTabBar: {
		backgroundColor: styleVars.tabBar.background,
		borderBottomWidth: 1,
		borderBottomColor: styleVars.tabBar.border
	}
});

export default compose(
	connect(state => ({
		app: state.app,
		site: state.site
	})),
	withApollo,
	withTheme(_componentStyles)
)(SearchScreen);
