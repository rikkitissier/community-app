import { SET_SITE_SETTINGS, SET_LOGIN_HANDLERS, SET_SITE_MENU, SET_SITE_MODULE_PERMISSIONS, SET_SITE_CACHE, SET_SITE_DATA } from "../actions/site";
import { SET_ACTIVE_COMMUNITY } from "../actions/app";

const initialState = {
	settings: {
		site_online: true,
		site_offline_message: "",
		board_name: "Invision Community"
	},
	menu: [],
	loginHandlers: [],
	moduleAccess: {},
	siteCache: null
};

export default function site(state = initialState, { type, payload }) {
	switch (type) {
		// When we change the active community, we want to completely reset
		// our site state.
		case SET_ACTIVE_COMMUNITY:
			return {
				...initialState
			};

		case SET_SITE_SETTINGS:
			return {
				...state,
				settings: {
					...payload
				}
			};
		case SET_LOGIN_HANDLERS:
			return {
				...state,
				loginHandlers: [...Object.values(payload)]
			};
		case SET_SITE_MENU:
			return {
				...state,
				menu: payload
			};
		case SET_SITE_MODULE_PERMISSIONS:
			return {
				...state,
				moduleAccess: payload
			};
		case SET_SITE_CACHE:
			return {
				...state,
				siteCache: payload
			};
		case SET_SITE_DATA:
			return {
				...state,
				settings: {
					...payload.settings
				},
				menu: payload.menu,
				moduleAccess: payload.moduleAccess,
				siteCache: payload.siteCache
			};
		default:
			return { ...state };
	}
}
