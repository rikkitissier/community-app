import React, { Component } from "react";
import { Text, View, ScrollView, FlatList, TouchableOpacity, Image, AsyncStorage } from "react-native";
import Modal from "react-native-modal";
import { compose } from "react-apollo";
import { connect } from "react-redux";
import _ from "underscore";

import configureStore from "../../redux/configureStore";
import { loadCommunityCategories, setActiveCommunity, toggleSavedCommunity, loadCommunityLanguages, setUserLanguageFilter } from "../../redux/actions/app";
import { CategoryBox } from "../../ecosystems/MultiCommunity";
import CustomHeader from "../../ecosystems/CustomHeader";
import CheckList from "../../ecosystems/CheckList";
import SearchBox from "../../ecosystems/SearchBox";
import Button from "../../atoms/Button";
import ShadowedArea from "../../atoms/ShadowedArea";
import ErrorBox from "../../atoms/ErrorBox";
import LargeTitle from "../../atoms/LargeTitle";
import { CommunityBox } from "../../ecosystems/MultiCommunity";
import { PlaceholderRepeater } from "../../ecosystems/Placeholder";
import SectionHeader from "../../atoms/SectionHeader";
import SettingRow from "../../atoms/SettingRow";
import getUserAgent from "../../utils/getUserAgent";
import { withTheme } from "../../themes";
import icons, { illustrations } from "../../icons";

const SEARCH_MIN_LEN = 4;

class MultiCategoryListScreen extends Component {
	static navigationOptions = {
		header: null
	};

	constructor(props) {
		super(props);
		this._pressCommunityHandlers = {};
		this._pressCategoryHandlers = {};
		this._togglePressHandlers = {};
		this._textInput = null;
		this.state = {
			searchFocus: false,
			searchActive: false,
			searchTerm: "",
			searchResults: [],
			searchError: false,
			filterModalVisible: false,
			languageFilters: null
		};
		this._searchCache = {};

		this.onChangeSearchText = this.onChangeSearchText.bind(this);
		this.doSearch = this.doSearch.bind(this);
		this.debouncedDoSearch = _.debounce(this.doSearch, 250).bind(this);
		this.searchOnFocus = this.searchOnFocus.bind(this);
		this.searchOnBlur = this.searchOnBlur.bind(this);
		this.searchEmptyTextBox = this.searchEmptyTextBox.bind(this);
		this.searchOnCancel = this.searchOnCancel.bind(this);
		this.toggleFilterModal = this.toggleFilterModal.bind(this);
		this.changeLanguageFilter = this.changeLanguageFilter.bind(this);
		this.clearLanguageFilters = this.clearLanguageFilters.bind(this);
		this.saveLanguageFilters = this.saveLanguageFilters.bind(this);
	}

	/**
	 * Mount point. Dispatch action to fetch categories if we don't have them already
	 *
	 * @return 	void
	 */
	componentDidMount() {
		if (!this.props.app.categoryList.loaded && !this.props.app.categoryList.error) {
			this.props.dispatch(loadCommunityCategories());
		}
		this.props.dispatch(loadCommunityLanguages());
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.state.searchTerm !== prevState.searchTerm && this.state.searchTerm.length >= SEARCH_MIN_LEN) {
			this.debouncedDoSearch();
		}

		if (!this.props.app.languages.loading && prevProps.app.languages.loading) {
			this.setLanguageOptions();
		}
	}

	/**
	 * Actually does the search using the term in state
	 *
	 * @return 	void
	 */
	async doSearch() {
		// Only search if we have enough chars
		if (this.state.searchTerm.length < SEARCH_MIN_LEN) {
			this.setState({
				searchResults: [],
				searchError: false
			});
			return;
		}

		const term = this.state.searchTerm;

		if (!_.isUndefined(this._searchCache[term])) {
			this.setState({
				searchResults: this._searchCache[term],
				searchError: false
			});
			return;
		}

		try {
			const response = await fetch(`${Expo.Constants.manifest.extra.remoteServicesUrl}directory/?search=${encodeURIComponent(term)}`, {
				method: "get",
				headers: {
					"Content-Type": "application/json",
					"User-Agent": getUserAgent()
				}
			});

			// It's possible the term we searched for isn't the current term (e.g. if user types quickly or server was slow).
			// We'll use this const to make sure we only update state if this is the current search term.
			const isStillCurrentTerm = this.state.searchTerm === term;

			if (!response.ok) {
				if (isStillCurrentTerm) {
					this.setState({
						searchError: true
					});
				}
				return;
			}

			const data = await response.json();

			this._searchCache[term] = data;

			if (isStillCurrentTerm) {
				this.setState({
					searchResults: this._searchCache[term],
					searchError: false
				});
			}
		} catch (err) {
			console.warn(`Search failed: ${err}`);
			const isStillCurrentTerm = this.state.searchTerm === term;

			if (isStillCurrentTerm) {
				this.setState({
					searchError: true
				});
			}
		}
	}

	/**
	 * Memoization function that returns an onPress handler for a category
	 *
	 * @param 	string 		Category ID to load on press
	 * @return 	function
	 */
	getCategoryOnPressHandler(categoryID) {
		if (_.isUndefined(this._pressCategoryHandlers[categoryID])) {
			this._pressCategoryHandlers[categoryID] = () => {
				this.props.navigation.navigate("Category", {
					categoryID,
					categoryName: this.props.app.categories[categoryID].name
				});
			};
		}

		return this._pressCategoryHandlers[categoryID];
	}

	/**
	 * Turns an array of category IDs into an array of pairs, e.g. [ [one, two], [three, four] ]
	 * We do this so we can show the categories in rows of two easily
	 *
	 * @param 	object 		Object with apiUrl and apiKey values
	 * @return 	array
	 */
	getDataInPairs() {
		console.tron.log(this.props.app.categories);

		return Object.keys(this.props.app.categories).reduce((result, value, index, array) => {
			if (index % 2 === 0) {
				result.push(array.slice(index, index + 2));
			}
			return result;
		}, []);
	}

	/**
	 * Build the list of categories
	 *
	 * @return 	Component
	 */
	getCategoryList() {
		const { styles } = this.props;

		if (this.props.app.categoryList.loading) {
			return (
				<PlaceholderRepeater repeat={3}>
					<View style={[styles.flexRow, styles.mbWide]}>
						<CategoryBox loading style={styles.mrTight} />
						<CategoryBox loading style={styles.mlTight} />
					</View>
				</PlaceholderRepeater>
			);
		} else if (this.props.app.categoryList.error) {
			return <ErrorBox message="Sorry, we can't load the community directory right now. Please try again later." />;
		} else {
			const categories = this.props.app.categories;
			const pairs = this.getDataInPairs();

			return pairs.map((pair, pairIdx) => (
				<View style={[styles.flexRow, styles.mbWide]} key={pairIdx}>
					{pair.map((category, idx) => (
						<CategoryBox
							name={categories[category].name}
							onPress={this.getCategoryOnPressHandler(category)}
							id={category}
							key={category}
							style={idx == 0 ? styles.mrTight : styles.mlTight}
						/>
					))}
				</View>
			));
		}
	}

	/**
	 * Handler for change event on search box; sets state to control the value of the search field
	 *
	 * @param 	string 		searchTerm 		The current textbox value
	 * @return 	void
	 */
	onChangeSearchText(searchTerm) {
		this.setState({
			searchTerm
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

		if (_.isUndefined(this._pressCommunityHandlers[apiUrl])) {
			this._pressCommunityHandlers[apiUrl] = () => {
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

		return this._pressCommunityHandlers[apiUrl];
	}

	/**
	 * Memoization function that returns an onpress handler for toggling a community's save status
	 *
	 * @param 	objext 		community 		THe community object
	 * @return 	function
	 */
	getToggleCommunityHandler(community) {
		const id = community.id;

		if (_.isUndefined(this._togglePressHandlers[id])) {
			this._togglePressHandlers[id] = () => {
				this.props.dispatch(toggleSavedCommunity(community));
				delete this._togglePressHandlers[id];
			};
		}

		return this._togglePressHandlers[id];
	}

	toggleFilterModal() {
		this.setState({
			filterModalVisible: !this.state.filterModalVisible
		});
	}

	/**
	 * Renders a community row
	 *
	 * @param 	object 		item 		The community item to render
	 * @return 	Component
	 */
	renderItem(item) {
		const { id, name, client_id: apiKey, logo, description, url: apiUrl, category_name } = item;
		const isSaved = _.find(this.props.app.communities.data, community => community.id === id);

		return (
			<CommunityBox
				onPress={this.pressCommunity({ apiUrl: item.url, apiKey: item.client_id, name, logo, description })}
				name={name}
				logo={logo}
				description={description}
				apiKey={apiKey}
				apiUrl={apiUrl}
				categoryName={category_name}
				communityLoading={!this.props.app.bootStatus.loaded && this.props.app.currentCommunity.apiUrl == apiUrl}
				rightComponent={
					<View style={{ width: 35 }}>
						{isSaved ? (
							<Button
								onPress={this.getToggleCommunityHandler(item)}
								icon={icons.CHECKMARK2}
								type="light"
								small
								rounded
								filled
								style={{ width: 36, height: 36 }}
							/>
						) : (
							<Button onPress={this.getToggleCommunityHandler(item)} icon={icons.PLUS} type="primary" small rounded style={{ width: 36, height: 36 }} />
						)}
					</View>
				}
			/>
		);
	}

	/**
	 * Returns the correct component for the search panel, depending on state of searching
	 *
	 * @return 	Component
	 */
	getSearchDisplay() {
		const { styles, componentStyles } = this.props;

		if (this.state.searchResults.length && this.state.searchTerm.length >= SEARCH_MIN_LEN) {
			return (
				<FlatList
					extraData={this.props.app.communities.data}
					data={this.state.searchResults}
					keyExtractor={item => item.id}
					renderItem={({ item }) => this.renderItem(item)}
				/>
			);
		} else if (this.state.searchError) {
			return <ErrorBox message="There was a problem searching the community directory." />;
		} else {
			return (
				<View style={styles.flex}>
					<Image source={illustrations.SEARCH_LIST} resizeMode="contain" style={componentStyles.emptyImage} />
					<Text style={[styles.mtExtraWide, styles.centerText, styles.itemTitle]}>Search Communities</Text>
					<Text style={[styles.mhExtraWide, styles.mtStandard, styles.lightText, styles.centerText, styles.contentText]}>
						Start typing to search for communities in our directory by name, description or URL
					</Text>
				</View>
			);
		}
	}

	/**
	 * Handler for focus event on search box
	 *
	 * @return 	void
	 */
	searchOnFocus() {
		this.setState({
			searchFocus: true,
			searchActive: true
		});
	}

	/**
	 * Handler for blur event on search box
	 *
	 * @return 	void
	 */
	searchOnBlur() {
		if (!this.state.searchTerm.length) {
			this.setState({
				searchActive: false
			});
		}

		this.setState({
			searchFocus: false
		});
	}

	/**
	 * Handler for cancel event on search box
	 *
	 * @return 	void
	 */
	searchOnCancel() {
		this.setState({
			searchActive: false,
			searchResults: [],
			searchTerm: ""
		});
	}

	/**
	 * Handler for tapping the X in the search field
	 *
	 * @return 	void
	 */
	searchEmptyTextBox() {
		this.setState({
			searchActive: this.state.searchFocus,
			searchTerm: "",
			searchResults: []
		});
	}

	/**
	 * Update state with the objects containing our supported languages and the checked state
	 *
	 * @return void
	 */
	setLanguageOptions() {
		const languages = this.props.app.languages.data;
		const languageFilters = Object.keys(languages).map(langKey => {
			return {
				key: langKey,
				title: languages[langKey],
				checked: this.props.app.filters.data !== null && !_.isUndefined(this.props.app.filters.data[langKey])
			};
		});

		this.setState({
			languageFilters
		});
	}

	/**
	 * Event handler for toggling a language row. Reverses the selected state.
	 *
	 * @param {object} item The selected item, passed through from CheckList
	 */
	changeLanguageFilter(item) {
		const languageFilters = this.state.languageFilters;
		const theItem = languageFilters.find(eachItem => eachItem.key === item.key);

		theItem.checked = !theItem.checked;

		this.setState({
			languageFilters
		});

		//this.props.dispatch(setUserLanguageFilter(languageFilters.filter(eachItem => eachItem.checked)));
	}

	/**
	 * Event handler for clearing the selected language filter preference. Unchecks all languages
	 * and dispatches action to update the app. Closes modal.
	 *
	 * @return void
	 */
	clearLanguageFilters() {
		const languageFilters = this.state.languageFilters;
		languageFilters.forEach(theItem => (theItem.checked = false));

		this.props.dispatch(setUserLanguageFilter([]));

		this.setState({
			languageFilters,
			filterModalVisible: false
		});
	}

	/**
	 * Save the language filter preference by dispatching an action and hiding the modal.
	 *
	 * @return void
	 */
	saveLanguageFilters() {
		const languageFilters = this.state.languageFilters;
		const checkedItems = languageFilters.filter(eachItem => eachItem.checked);

		this.props.dispatch(setUserLanguageFilter(checkedItems));

		this.setState({
			filterModalVisible: false
		});
	}

	render() {
		const { styles, componentStyles } = this.props;
		const { filters, languages } = this.props.app;

		const searchBox = (
			<SearchBox
				placeholder="Search Communities"
				onChangeText={this.onChangeSearchText}
				value={this.state.searchTerm}
				onFocus={this.searchOnFocus}
				onBlur={this.searchOnBlur}
				onCancel={this.searchOnCancel}
				emptyTextBox={this.searchEmptyTextBox}
				onSubmitTextInput={this.doSearch}
				rightLinkText={"Filter"}
				rightLinkOnPress={this.toggleFilterModal}
			/>
		);

		// Generating the category list is done in getCategoryList because the expectation is we'll
		// eventually have other blocks on this screen that load independently
		return (
			<React.Fragment>
				<View style={styles.flex}>
					<CustomHeader content={searchBox} />
					<View style={styles.flex}>
						{!this.state.searchActive ? (
							<ScrollView style={styles.flex}>
								<LargeTitle>Categories</LargeTitle>
								<View style={styles.phWide}>{this.getCategoryList()}</View>
							</ScrollView>
						) : (
							<View style={[styles.flex, componentStyles.searchContainer]}>{this.getSearchDisplay()}</View>
						)}
					</View>
				</View>
				<Modal
					style={styles.modalAlignBottom}
					swipeDirection="down"
					onSwipeComplete={this.toggleFilterModal}
					onBackdropPress={this.toggleFilterModal}
					isVisible={this.state.filterModalVisible}
				>
					<View style={[styles.modalInner, { paddingBottom: 0 }]}>
						<View style={styles.modalHandle} />
						<View style={styles.modalHeader}>
							<View style={styles.modalHeaderBar}>
								<TouchableOpacity style={styles.modalHeaderLink} onPress={this.clearLanguageFilters}>
									<Text style={styles.modalHeaderLinkText}>Clear</Text>
								</TouchableOpacity>
								<Text style={[styles.modalTitle, styles.modalTitleWithLinks]}>Filter By Language</Text>
								<TouchableOpacity style={styles.modalHeaderLink} onPress={this.saveLanguageFilters} disabled={false}>
									<Text style={[styles.modalHeaderLinkText]}>Save</Text>
								</TouchableOpacity>
							</View>
						</View>
						<ScrollView style={[componentStyles.modalBody]} keyboardShouldPersistTaps="always">
							{!languages.loading && !languages.loading && (
								<React.Fragment>
									<View style={[styles.phWide, styles.pvWide]}>
										<Text style={[styles.smallText, styles.lightText]}>Filter the communities shown in the Discover tab by the languages relevant to you.</Text>
									</View>
									<CheckList type="radio" data={this.state.languageFilters} onPress={this.changeLanguageFilter} />
								</React.Fragment>
							)}
							{languages.loading && <Text>Loading...</Text>}
							{languages.error && <Text>Error...</Text>}
						</ScrollView>
					</View>
				</Modal>
			</React.Fragment>
		);
	}
}

const _componentStyles = styleVars => ({
	emptyImage: {
		width: "100%",
		height: 150,
		marginTop: styleVars.spacing.extraWide * 2
	},
	modalBody: {
		minHeight: 300,
		paddingBottom: styleVars.spacing.extraWide
	}
});

export default compose(
	connect(state => ({
		app: state.app
	})),
	withTheme(_componentStyles)
)(MultiCategoryListScreen);
