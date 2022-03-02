import * as actions from "../actions/app";

const initialState = {
	bootStatus: {
		loading: false,
		loaded: false,
		error: false,
		isNetworkError: false
	},
	client: null,
	view: "multi",
	currentCommunity: {
		apiUrl: null,
		apiKey: null,
		url: null,
		logo: null,
		name: null,
		description: null
	},
	webview: {
		active: false,
		url: ""
	},
	notification: null,
	languages: {
		loading: false,
		error: false,
		data: {}
	},
	filters: {
		loading: false,
		error: false,
		data: null
	},
	communities: {
		loading: false,
		error: false,
		data: []
	},
	categoryList: {
		loading: false,
		error: false
	},
	categories: {},
	settings: {
		contentView: "first"
	},
	toast: [],
	currentTheme: "default",
	darkMode: false,
	messages: []
};

export default function app(state = initialState, { type, payload }) {
	switch (type) {
		case actions.LOG_MESSAGE:
			const thisDate = new Date();

			return {
				...state,
				messages: [...state.messages, `${thisDate.toTimeString()}: ${payload.message}` || "<blank>"]
			};

		// --------------------------------------------------------------
		// Boot actions
		case actions.RESET_BOOT_STATUS:
			return {
				...state,
				bootStatus: {
					...initialState.bootStatus
				}
			};
		case actions.BOOT_SITE_LOADING:
			return {
				...state,
				bootStatus: {
					error: false,
					isNetworkError: false,
					loading: true,
					loaded: false
				}
			};
		case actions.BOOT_SITE_SUCCESS:
			return {
				...state,
				bootStatus: {
					error: false,
					isNetworkError: false,
					loading: false,
					loaded: true
				}
			};
		case actions.BOOT_SITE_ERROR:
			console.log("Boot status error");
			console.log(payload);
			return {
				...state,
				bootStatus: {
					loading: false,
					loaded: false,
					error: payload.error || "Sorry, there was a problem loading this community.",
					isNetworkError: payload.isNetworkError
				}
			};

		// --------------------------------------------------------------
		// Theme actions
		case actions.SET_THEME:
			return {
				...state,
				currentTheme: payload.theme
			};
		case actions.SET_DARK_MODE_STATE:
			return {
				...state,
				darkMode: payload.enableDarkMode
			};

		// --------------------------------------------------------------
		// Notification actions
		case actions.RECEIVE_NOTIFICATION:
			console.log("Notification reducer");
			console.log(payload);
			return {
				...state,
				notification: {
					...payload
				}
			};

		case actions.CLEAR_CURRENT_NOTIFICATION:
			return {
				...state,
				notification: null
			};

		// --------------------------------------------------------------
		// Actions to control the active community
		case actions.SET_ACTIVE_COMMUNITY:
			// Normalize API url by removing any trailing slash
			if (typeof payload.apiUrl === "string" && !payload.apiUrl.endsWith("/")) {
				payload.apiUrl = payload.apiUrl + "/";
			}

			return {
				...state,
				currentCommunity: {
					apiUrl: payload.apiUrl,
					apiKey: payload.apiKey,
					logo: payload.logo,
					name: payload.name,
					description: payload.description
				}
			};
		case actions.RESET_ACTIVE_COMMUNITY:
			return {
				...state,
				currentCommunity: {
					...initialState.currentCommunity
				}
			};

		// --------------------------------------------------------------
		// Community languages
		case actions.COMMUNITY_LANGUAGES_LOADING:
			return {
				...state,
				languages: {
					...state.languages,
					loading: true,
					error: false
				}
			};
		case actions.COMMUNITY_LANGUAGES_ERROR:
			return {
				...state,
				languages: {
					...state.languages,
					loading: false,
					error: true
				}
			};
		case actions.COMMUNITY_LANGUAGES_SUCCESS:
			return {
				...state,
				languages: {
					...state.languages,
					loading: false,
					error: false,
					data: payload
				}
			};
		// --------------------------------------------------------------
		// User language filter
		case actions.USER_LANG_FILTER_LOADING:
			return {
				...state,
				filters: {
					...state.filters,
					loading: true,
					error: false
				}
			};
		case actions.USER_LANG_FILTER_ERROR:
			return {
				...state,
				filters: {
					loading: false,
					error: true,
					data: null
				}
			};
		case actions.USER_LANG_FILTER_SUCCESS:
			return {
				...state,
				filters: {
					...state.filters,
					loading: false,
					error: false,
					data: payload
				}
			};
		case actions.USER_LANG_FILTER_UPDATE:
			return {
				...state,
				filters: {
					...state.filters,
					loading: false,
					error: false,
					data: payload
				}
			};

		// --------------------------------------------------------------
		// "My Communities" list for Multi-community
		case actions.COMMUNITY_LIST_LOADING:
			return {
				...state,
				communities: {
					...state.communities,
					loading: true,
					error: false
				}
			};
		case actions.COMMUNITY_LIST_ERROR:
			return {
				...state,
				communities: {
					...state.communities,
					loading: false,
					error: true
				}
			};
		case actions.COMMUNITY_LIST_SUCCESS:
			return {
				...state,
				communities: {
					...state.communities,
					loading: false,
					error: false,
					data: payload.communities
				}
			};
		case actions.SET_COMMUNITIES:
			return {
				...state,
				communities: {
					...state.communities,
					loading: false,
					error: false,
					data: payload.communities
				}
			};

		// --------------------------------------------------------------
		// Category list for Multi-community
		case actions.COMMUNITY_CATEGORIES_LOADING:
			return {
				...state,
				categoryList: {
					...state.categoryList,
					loading: true,
					error: false
				}
			};
		case actions.COMMUNITY_CATEGORIES_ERROR:
			return {
				...state,
				categoryList: {
					...state.categoryList,
					loading: false,
					error: true
				}
			};
		case actions.COMMUNITY_CATEGORIES_SUCCESS:
			const categoryKeys = Object.keys(payload);
			const categoryObj = {};

			categoryKeys.forEach(category => {
				categoryObj[category] = {
					id: category,
					name: payload[category].title,
					count: payload[category].count,
					loading: false,
					error: false,
					items: []
				};
			});

			return {
				...state,
				categoryList: {
					...state.categoryList,
					loading: false,
					error: false
				},
				categories: {
					...categoryObj,
					...state.categories
				}
			};

		// --------------------------------------------------------------
		// Individual category for Multi-community
		case actions.COMMUNITY_CATEGORY_LOADING:
			const _loadingCommunities = Object.assign({}, state.categories);

			_loadingCommunities[payload.id].loading = true;
			_loadingCommunities[payload.id].finished = false;
			_loadingCommunities[payload.id].error = false;

			return {
				...state,
				categories: _loadingCommunities
			};
		case actions.COMMUNITY_CATEGORY_ERROR:
			const _errorCommunities = Object.assign({}, state.categories);

			_errorCommunities[payload.id].loading = false;
			_errorCommunities[payload.id].finished = false;
			_errorCommunities[payload.id].error = true;

			return {
				...state,
				categories: _errorCommunities
			};
		case actions.COMMUNITY_CATEGORY_SUCCESS:
			// We receive an offset, so to be sure we dont duplicate items in case of a race condition,
			// take a slice of existing data up to the offset we're about to append to
			const _successCategories = Object.assign({}, state.categories);
			const existingItems = _successCategories[payload.id].items || [];
			const existingSlice = existingItems.slice(0, payload.offset);

			_successCategories[payload.id].loading = false;
			_successCategories[payload.id].finished = payload.finished;
			_successCategories[payload.id].error = false;
			_successCategories[payload.id].items = [...existingSlice, ...payload.items];

			return {
				...state,
				categories: _successCategories
			};

		// --------------------------------------------------------------
		// App settings
		case actions.CONTENT_VIEW:
			return {
				...state,
				settings: {
					...state.settings,
					contentView: payload
				}
			};

		// --------------------------------------------------------------
		// Other app actions
		case actions.SWITCH_APP_VIEW:
			return {
				...state,
				view: payload.view
			};

		case actions.OPEN_MODAL_WEBVIEW:
			return {
				...state,
				webview: {
					active: true,
					url: payload.url
				}
			};
		case actions.RESET_MODAL_WEBVIEW:
			return {
				...state,
				webview: {
					active: false,
					url: ""
				}
			};
		case actions.PUSH_TOAST:
			return {
				...state,
				toast: [...state.toast, payload]
			};
		case actions.SHIFT_TOAST:
			const clone = [state.toast];
			clone.shift();

			return {
				...state,
				toast: clone
			};
		default:
			return { ...state };
	}
}
