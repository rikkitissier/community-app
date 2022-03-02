// =================================================================

export const LOG_MESSAGE = "LOG_MESSAGE";
export const logMessage = data => ({
	type: LOG_MESSAGE,
	payload: {
		...data
	}
});

export const OPEN_MODAL_WEBVIEW = "OPEN_MODAL_WEBVIEW";
export const openModalWebview = data => ({
	type: OPEN_MODAL_WEBVIEW,
	payload: {
		...data
	}
});

export const RESET_MODAL_WEBVIEW = "RESET_MODAL_WEBVIEW";
export const resetModalWebview = data => ({
	type: RESET_MODAL_WEBVIEW,
	payload: {
		...data
	}
});

export const SET_ACTIVE_COMMUNITY = "SET_ACTIVE_COMMUNITY";
export const setActiveCommunity = data => ({
	type: SET_ACTIVE_COMMUNITY,
	payload: {
		...data
	}
});

export const RESET_ACTIVE_COMMUNITY = "RESET_ACTIVE_COMMUNITY";
export const resetActiveCommunity = data => ({
	type: RESET_ACTIVE_COMMUNITY
});

export const SWITCH_APP_VIEW = "SWITCH_APP_VIEW";
export const switchAppView = data => ({
	type: SWITCH_APP_VIEW,
	payload: {
		...data
	}
});

export const PUSH_TOAST = "PUSH_TOAST";
export const pushToast = data => ({
	type: PUSH_TOAST,
	payload: {
		...data
	}
});

export const SHIFT_TOAST = "SHIFT_TOAST";
export const shiftToast = data => ({
	type: SHIFT_TOAST
});

export const SET_THEME = "SET_THEME";
export const setTheme = data => ({
	type: SET_THEME,
	payload: {
		...data
	}
});

export const TOGGLE_DARK_MODE = "TOGGLE_DARK_MODE";
export const toggleDarkMode = state => {
	return async (dispatch, getState) => {
		if (state) {
			await AsyncStorage.setItem("@darkMode", JSON.stringify(true));
		} else {
			await AsyncStorage.removeItem("@darkMode");
		}

		dispatch(
			setDarkModeState({
				enableDarkMode: state
			})
		);
	};
};

export const SET_DARK_MODE_STATE = "SET_DARK_MODE_STATE";
export const setDarkModeState = data => ({
	type: SET_DARK_MODE_STATE,
	payload: {
		...data
	}
});

// =================================================================

export const RECEIVE_NOTIFICATION = "RECEIVE_NOTIFICATION";
export const receiveNotification = data => ({
	type: RECEIVE_NOTIFICATION,
	payload: {
		...data
	}
});

export const CLEAR_CURRENT_NOTIFICATION = "CLEAR_CURRENT_NOTIFICATION";
export const clearCurrentNotification = data => ({
	type: CLEAR_CURRENT_NOTIFICATION,
	payload: {
		...data
	}
});

// =================================================================

export const RESET_BOOT_STATUS = "RESET_BOOT_STATUS";
export const resetBootStatus = data => ({
	type: RESET_BOOT_STATUS
});

export const BOOT_SITE_LOADING = "BOOT_SITE_LOADING";
export const bootSiteLoading = data => ({
	type: BOOT_SITE_LOADING
});

export const BOOT_SITE_ERROR = "BOOT_SITE_ERROR";
export const bootSiteError = data => ({
	type: BOOT_SITE_ERROR,
	payload: {
		...data
	}
});

export const BOOT_SITE_SUCCESS = "BOOT_SITE_SUCCESS";
export const bootSiteSuccess = data => ({
	type: BOOT_SITE_SUCCESS
});

import _ from "underscore";
import Lang from "../../utils/Lang";
import asyncCache from "../../utils/asyncCache";
import minVersion from "../../../minVersion.json";
import { guestLoaded, userLoaded, setUserStreams } from "./user";
import { setSiteSettings, setSiteCache, setSiteModulePermissions, setSiteMenu, setSiteData } from "./site";
import { setEditorSettings } from "./editor";
import gql from "graphql-tag";
import { graphql } from "react-apollo";

export const bootSite = apiInfo => {
	return async (dispatch, getState) => {
		const {
			auth: { client }
		} = getState();

		console.log(`BOOT SITE: ${apiInfo.apiUrl}`);

		// Set state to loading
		dispatch(bootSiteLoading());

		// Now run our boot query
		try {
			const { auth } = getState();
			const { data } = await client.query({
				query: BootQuery,
				variables: {}
			});

			if (!__DEV__ && minVersion.minVersion > data.core.settings.version) {
				dispatch(
					bootSiteError({
						error: "This community is not compatible with this version of Invision Communities.",
						isNetworkError: false
					})
				);

				return;
			}

			if (auth.isAuthenticated && data.core.me.group.groupType !== "GUEST") {
				dispatch(userLoaded({ ...data.core.me }));
			} else {
				dispatch(guestLoaded({ ...data.core.me }));
			}

			// Set our lang strings
			if (_.size(data.core.language)) {
				const { locale, phrases } = data.core.language;
				let phraseObj = {};

				try {
					phraseObj = JSON.parse(phrases);
				} catch (err) {
					console.tron.log(err);
				}

				Lang.setLocale(locale);
				Lang.setWords(phraseObj);
			}

			// Set editor settings
			const { allowedFileTypes, chunkingSupported, maxChunkSize } = data.core.settings;
			dispatch(
				setEditorSettings({
					allowedFileTypes,
					chunkingSupported,
					maxChunkSize
				})
			);

			// Now try and get the homescreen data to improve perceieved loading time
			const cachedData = await asyncCache.getDataForScope(apiInfo.apiUrl);

			// Set our site data
			dispatch(
				setSiteData({
					settings: data.core.settings,
					menu: data.core.mobileMenu,
					moduleAccess: {
						core: data.core.moduleAccess
					},
					siteCache: cachedData
				})
			);

			// Store our streams
			dispatch(
				setUserStreams([
					{
						id: "all",
						title: Lang.get("all_activity"),
						isDefault: true
					},
					...data.core.streams
				])
			);

			dispatch(bootSiteSuccess());
		} catch (err) {
			console.log(err);
			dispatch(
				bootSiteError({
					isNetworkError: true
				})
			);
		}
	};
};

import langStrings from "../../langStrings";

const LangFragment = gql`
	fragment LangFragment on core_Language {
		phrases(keys: ${JSON.stringify(Object.keys(langStrings))})
	}
`;

// Important: this imports the fragments only. We can't import HomeSection's index
// because that includes components which in turn rely on user data we haven't fetched yet.
import { HomeSections } from "../../ecosystems/HomeSections/fragments";

const HomeFragments = [];
const HomeIncludes = [];

Object.keys(HomeSections).forEach(section => {
	HomeFragments.push("..." + HomeSections[section].fragmentName);
	HomeIncludes.push(HomeSections[section].fragment);
});

const BootQuery = gql`
	query BootQuery {
		core {
			moduleAccess {
				search: view(module: "search")
				messaging: view(module: "messaging")
				members: view(module: "members")
				online: view(module: "online")
				discover: view(module: "discover")
			}
			me {
				id
				name
				photo
				defaultStream
				notificationCount
				maxUploadSize
				email
				group {
					canAccessSite
					canAccessOffline
					groupType
					canTag
				}
			}
			settings {
				version
				base_url
				site_online
				site_offline_message
				board_name
				allow_reg
				allow_reg_target
				disable_anonymous
				tags_enabled
				tags_open_system
				tags_min
				tags_len_min
				tags_max
				tags_len_max
				tags_min_req
				reputation_enabled
				reputation_highlight
				reputation_show_profile
				allow_result_view
				forums_questions_downvote
				allowedFileTypes
				chunkingSupported
				maxChunkSize
				automoderationEnabled
				reportReasons {
					id
					reason
				}
				mobileHomeBlocks
				privacy_type
				privacy_text {
					original
				}
				privacy_link
				reg_rules {
					original
				}
				guidelines_type
				guidelines_text {
					original
				}
				guidelines_link
			}
			language {
				locale
				...LangFragment
			}
			streams {
				id
				title
				isDefault
			}
			mobileMenu {
				id
				title
				icon
				url {
					full
					app
					module
					query {
						key
						value
					}
				}
			}
		}
	}
	${LangFragment}
`;

// =================================================================

export const COMMUNITY_LIST_LOADING = "COMMUNITY_LIST_LOADING";
export const communityListLoading = data => ({
	type: COMMUNITY_LIST_LOADING
});

export const COMMUNITY_LIST_ERROR = "COMMUNITY_LIST_ERROR";
export const communityListError = data => ({
	type: COMMUNITY_LIST_ERROR,
	payload: {
		...data
	}
});

export const COMMUNITY_LIST_SUCCESS = "COMMUNITY_LIST_SUCCESS";
export const communityListSuccess = data => ({
	type: COMMUNITY_LIST_SUCCESS,
	payload: {
		...data
	}
});

import { AsyncStorage } from "react-native";
import getUserAgent from "../../utils/getUserAgent";
export const loadCommunities = () => {
	return async (dispatch, getState) => {
		dispatch(communityListLoading());

		try {
			// Get our saved community IDs from storage
			const communityData = await AsyncStorage.getItem("@savedCommunities");
			const communityJson = communityData !== null ? JSON.parse(communityData) : null;
			const favoriteData = await AsyncStorage.getItem("@favoriteCommunities");
			const favoriteJson = favoriteData !== null ? JSON.parse(favoriteData) : null;

			if (communityJson === null) {
				dispatch(
					communityListSuccess({
						communities: []
					})
				);
				return;
			}

			// Fetch the community data from remoteservices
			const communityIDs = communityJson.join(",");
			const response = await fetch(`${Expo.Constants.manifest.extra.remoteServicesUrl}directory/?id=${communityIDs}`, {
				method: "get",
				headers: {
					"Content-Type": "application/json",
					"User-Agent": getUserAgent()
				}
			});

			if (!response.ok) {
				dispatch(communityListError());
				return;
			}

			const data = await response.json();

			// Process the returned data into an object
			const receivedCommunities = {};
			for (let i = 0; i < data.length; i++) {
				receivedCommunities[data[i].id] = data[i];
			}

			// Now loop through each of our stored communities and build a final object that we'll store in redux
			const communities = [];

			for (let k = 0; k < communityJson.length; k++) {
				const liveCommunityData = receivedCommunities[communityJson[k]];

				if (!_.isUndefined(liveCommunityData)) {
					communities.push({
						...liveCommunityData,
						isFavorite: favoriteJson !== null && favoriteJson.indexOf(liveCommunityData.id) !== -1,
						status: "active"
					});
				} else {
					communities.push({
						id: communityJson[k],
						status: "missing"
					});
				}
			}

			dispatch(
				communityListSuccess({
					communities
				})
			);
		} catch (err) {
			console.log(err);
			dispatch(communityListError());
		}
	};
};

export const _devStoreCommunities = async () => {
	const communities = ["b8159ddfb42729ad9120567c862e197a", "4c422840184708ffcea278fcccd43dae", "1fe6bc7815de0244c70a2544f8d0adf2", "test_missing"];
	const favorites = ["b8159ddfb42729ad9120567c862e197a"];

	await AsyncStorage.setItem("@savedCommunities", JSON.stringify(communities));
	await AsyncStorage.setItem("@favoriteCommunities", JSON.stringify(favorites));

	console.log("Saved communities");
};

// =================================================================

export const COMMUNITY_LANGUAGES_LOADING = "COMMUNITY_LANGUAGES_LOADING";
export const communityLanguagesLoading = data => ({
	type: COMMUNITY_LANGUAGES_LOADING
});

export const COMMUNITY_LANGUAGES_ERROR = "COMMUNITY_LANGUAGES_ERROR";
export const communityLanguagesError = data => ({
	type: COMMUNITY_LANGUAGES_ERROR,
	payload: {
		...data
	}
});

export const COMMUNITY_LANGUAGES_SUCCESS = "COMMUNITY_LANGUAGES_SUCCESS";
export const communityLanguagesSuccess = data => ({
	type: COMMUNITY_LANGUAGES_SUCCESS,
	payload: {
		...data
	}
});

export const loadCommunityLanguages = () => {
	return async (dispatch, getState) => {
		dispatch(communityLanguagesLoading());

		try {
			const languages = await asyncCache.getData("languages", "app");

			// If we have cached data...
			if (languages !== null) {
				console.log("loaded languages from cache");
				dispatch(communityLanguagesSuccess(languages));
				return;
			}

			// If not, fetch the language data from remoteservices
			const response = await fetch(`${Expo.Constants.manifest.extra.remoteServicesUrl}languages?active=1`, {
				method: "get",
				headers: {
					"Content-Type": "application/json",
					"User-Agent": getUserAgent()
				}
			});

			if (!response.ok) {
				dispatch(communityLanguagesError());
				return;
			}

			const data = await response.json();

			await asyncCache.setData(data, "languages", "app", 259200); // 3 days
			dispatch(communityLanguagesSuccess(data));
		} catch (err) {
			dispatch(communityLanguagesError());
		}
	};
};

// =================================================================

export const USER_LANG_FILTER_LOADING = "USER_LANG_FILTER_LOADING";
export const userLanguageFilterLoading = data => ({
	type: USER_LANG_FILTER_LOADING
});

export const USER_LANG_FILTER_ERROR = "USER_LANG_FILTER_ERROR";
export const userLanguageFilterError = data => ({
	type: USER_LANG_FILTER_ERROR
});

export const USER_LANG_FILTER_SUCCESS = "USER_LANG_FILTER_SUCCESS";
export const userLanguageFilterSuccess = data => ({
	type: USER_LANG_FILTER_SUCCESS,
	payload: data
});

export const USER_LANG_FILTER_UPDATE = "USER_LANG_FILTER_UPDATE";
export const userLanguageFilterUpdate = data => ({
	type: USER_LANG_FILTER_UPDATE,
	payload: data
});

export const getUserLanguageFilter = () => {
	return async (dispatch, getState) => {
		dispatch(userLanguageFilterLoading());

		try {
			const filter = await AsyncStorage.getItem("@languageFilter");
			const filterData = filter !== null ? JSON.parse(filter) : null;

			dispatch(userLanguageFilterSuccess(filterData));
		} catch (err) {
			dispatch(userLanguageFilterError());
		}
	};
};

export const setUserLanguageFilter = checkedItems => {
	return async dispatch => {
		if (!checkedItems.length) {
			try {
				await AsyncStorage.removeItem("@languageFilter");
				return;
			} catch (err) {
				console.log("Couldn't remove language filter preferences");
			}
		}

		const filters = {};

		checkedItems.forEach(checkedItem => {
			filters[checkedItem.key] = checkedItem.title;
		});

		try {
			await AsyncStorage.setItem("@languageFilter", JSON.stringify(filters));
		} catch (err) {
			console.log("Error storing filter preferences");
		}

		dispatch(userLanguageFilterUpdate(filters));
	};
};

// =================================================================

export const COMMUNITY_CATEGORIES_LOADING = "COMMUNITY_CATEGORIES_LOADING";
export const communityCategoriesLoading = data => ({
	type: COMMUNITY_CATEGORIES_LOADING
});

export const COMMUNITY_CATEGORIES_ERROR = "COMMUNITY_CATEGORIES_ERROR";
export const communityCategoriesError = data => ({
	type: COMMUNITY_CATEGORIES_ERROR,
	payload: {
		...data
	}
});

export const COMMUNITY_CATEGORIES_SUCCESS = "COMMUNITY_CATEGORIES_SUCCESS";
export const communityCategoriesSuccess = data => ({
	type: COMMUNITY_CATEGORIES_SUCCESS,
	payload: {
		...data
	}
});

export const loadCommunityCategories = () => {
	return async (dispatch, getState) => {
		dispatch(communityCategoriesLoading());

		try {
			// Fetch the community data from remoteservices
			const response = await fetch(`${Expo.Constants.manifest.extra.remoteServicesUrl}categories`, {
				method: "get",
				headers: {
					"Content-Type": "application/json",
					"User-Agent": getUserAgent()
				}
			});

			if (!response.ok) {
				dispatch(communityCategoriesError());
				return;
			}

			const data = await response.json();

			dispatch(communityCategoriesSuccess(data));
		} catch (err) {
			dispatch(communityCategoriesError());
		}
	};
};

// =================================================================

export const COMMUNITY_CATEGORY_LOADING = "COMMUNITY_CATEGORY_LOADING";
export const communityCategoryLoading = data => ({
	type: COMMUNITY_CATEGORY_LOADING,
	payload: {
		id: data
	}
});

export const COMMUNITY_CATEGORY_ERROR = "COMMUNITY_CATEGORY_ERROR";
export const communityCategoryError = data => ({
	type: COMMUNITY_CATEGORY_ERROR,
	payload: {
		id: data
	}
});

export const COMMUNITY_CATEGORY_SUCCESS = "COMMUNITY_CATEGORY_SUCCESS";
export const communityCategorySuccess = data => ({
	type: COMMUNITY_CATEGORY_SUCCESS,
	payload: {
		...data
	}
});

export const loadCommunityCategory = (id, offset = 0) => {
	return async (dispatch, getState) => {
		const {
			app: { filters }
		} = getState();

		dispatch(communityCategoryLoading(id));

		let lang = "";

		if (filters.data !== null) {
			lang = Object.keys(filters.data).join(",");
		}

		try {
			// Fetch the community data from remoteservices
			const response = await fetch(
				`${Expo.Constants.manifest.extra.remoteServicesUrl}directory/?category=${id}&st=${offset}${lang !== "" ? `&lang=${lang}` : ""}`,
				{
					method: "get",
					headers: {
						"Content-Type": "application/json",
						"User-Agent": getUserAgent()
					}
				}
			);

			if (!response.ok) {
				dispatch(communityCategoryError(id));
				return;
			}

			const items = await response.json();

			try {
				const favoriteData = await AsyncStorage.getItem("@favoriteCommunities");
				const favoriteJson = favoriteData !== null ? JSON.parse(favoriteData) : null;

				items.forEach(item => {
					item.isFavorite = favoriteJson !== null && favoriteJson.indexOf(item.id) !== -1;
				});
			} catch (err) {
				console.warn("Couldn't add favorite data to category results");
			}

			dispatch(
				communityCategorySuccess({
					id,
					offset,
					items,
					finished: items.length < 100
				})
			);
		} catch (err) {
			console.log(err);
			dispatch(communityCategoryError(id));
		}
	};
};

// =================================================================

export const SET_COMMUNITIES = "SET_COMMUNITIES";
export const setCommunities = data => ({
	type: SET_COMMUNITIES,
	payload: {
		...data
	}
});

export const toggleFavoriteCommunity = id => {
	return async (dispatch, getState) => {
		const state = getState();
		const communities = state.app.communities.data;
		const thisCommunity = _.find(communities, community => community.id === id);

		// Update storage with new favorite data
		try {
			const favoriteData = await AsyncStorage.getItem("@favoriteCommunities");
			const favoriteJson = favoriteData !== null ? JSON.parse(favoriteData) : null;
			let updatedFavoriteData = [];

			if (favoriteJson !== null) {
				if (thisCommunity.isFavorite) {
					updatedFavoriteData = _.without(favoriteJson, id);
				} else {
					updatedFavoriteData = [...favoriteJson, id];
				}
			}

			await AsyncStorage.setItem("@favoriteCommunities", JSON.stringify(updatedFavoriteData));
		} catch (err) {
			console.warn("Couldn't save updated favorite data");
		}

		// Now dispatch action to update current states
		if (!_.isUndefined(thisCommunity)) {
			thisCommunity.isFavorite = !thisCommunity.isFavorite;
		}

		dispatch(
			setCommunities({
				communities
			})
		);
	};
};

export const toggleSavedCommunity = communityToToggle => {
	return async (dispatch, getState) => {
		try {
			const id = communityToToggle.id;
			const state = getState();
			const communities = state.app.communities.data;
			const communityData = await AsyncStorage.getItem("@savedCommunities");
			const communityJson = communityData !== null ? JSON.parse(communityData) : [];
			const favoriteData = await AsyncStorage.getItem("@favoriteCommunities");
			const favoriteJson = favoriteData !== null ? JSON.parse(favoriteData) : [];

			let updatedCommunitiesObj = {};
			let updatedCommunityIDs = [];
			let updatedFavoriteIDs = [];

			// If this community is already saved
			if (communityJson.indexOf(id) !== -1) {
				// Get the object for this community and remove it from the current list
				updatedCommunitiesObj = _.without(communities, _.find(communities, community => community.id === id));

				// Build an updated list of IDs & favorites
				updatedCommunityIDs = _.without(communityJson, id);
				updatedFavoriteIDs = _.without(favoriteJson, id);
			} else {
				updatedCommunitiesObj = [...communities, communityToToggle];
				updatedCommunityIDs = [...communityJson, id];
			}

			await AsyncStorage.setItem("@savedCommunities", JSON.stringify(updatedCommunityIDs));
			await AsyncStorage.setItem("@favoriteCommunities", JSON.stringify(updatedFavoriteIDs));

			dispatch(
				setCommunities({
					communities: updatedCommunitiesObj
				})
			);
		} catch (err) {
			console.warn(`Couldn't update saved communities ${err}`);
		}
	};
};

// =================================================================
// Settings

export const CONTENT_VIEW = "CONTENT_VIEW";
export const contentView = data => ({
	type: CONTENT_VIEW,
	payload: data
});

export const setContentView = type => {
	return async dispatch => {
		try {
			if (_.isUndefined(type)) {
				type = await AsyncStorage.getItem("@contentView");

				if (type === null) {
					type = "first";
				}
			}

			dispatch(contentView(type));
			await AsyncStorage.setItem("@contentView", type);
		} catch (err) {
			console.warn(`Couldn't set content view: ${err}`);
			dispatch(contentView("first"));
		}
	};
};
