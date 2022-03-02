import * as actions from "../actions/auth";
import { SET_ACTIVE_COMMUNITY } from "../actions/app";

const initialState = {
	swapToken: {
		loading: false,
		error: false,
		isNetworkError: false
	},
	refreshToken: {
		loading: false,
		error: false,
		isNetworkError: false
	},
	authData: {
		refreshToken: null,
		expiresIn: null,
		accessToken: null
	},
	isAuthenticated: false,
	client: null
};

export default function auth(state = initialState, { type, payload }) {
	switch (type) {
		// When we change the active community, we want to completely reset
		// our auth state.
		case SET_ACTIVE_COMMUNITY:
			return {
				...initialState
			};

		case actions.LOG_IN_ERROR:
			console.log(`LOGIN ERROR: ${payload.error}`);

			return {
				...state,
				authData: {
					...initialState.authData
				},
				isAuthenticated: false
			};

		// ========================================================
		// Swap token actions. This happens after logging in via
		// oAuth, when we receive a code that must be exchanged for
		// an accessToken.
		case actions.SWAP_TOKEN_LOADING:
			return {
				...state,
				swapToken: {
					loading: true,
					error: false,
					isNetworkError: false
				}
			};
		case actions.SWAP_TOKEN_ERROR:
			return {
				...state,
				swapToken: {
					loading: false,
					error: payload.error || true,
					isNetworkError: payload.isNetworkError || false
				},
				isAuthenticated: false,
				client: payload.client
			};
		case actions.SWAP_TOKEN_SUCCESS:
			return {
				...state,
				swapToken: {
					loading: false,
					error: false,
					isNetworkError: false
				},
				isAuthenticated: true,
				client: payload.client
			};

		// ========================================================
		// Refresh token actions. This happens automatically when we boot
		// a community, and every so often before the accessToken expires.
		case actions.REFRESH_TOKEN_LOADING:
			return {
				...state,
				refreshToken: {
					loading: true,
					error: false,
					isNetworkError: false
				}
			};
		case actions.REFRESH_TOKEN_ERROR:
			console.log("refresh token error");
			return {
				...state,
				refreshToken: {
					loading: false,
					error: payload.error || true,
					isNetworkError: payload.isNetworkError || false
				},
				authData: {
					...initialState.authData
				},
				isAuthenticated: false,
				client: payload.client
			};
		case actions.REFRESH_TOKEN_SUCCESS:
			console.log("refresh token success");
			return {
				...state,
				refreshToken: {
					loading: false,
					error: false,
					isNetworkError: false
				},
				authData: {
					refreshToken: payload.refreshToken,
					expiresIn: payload.expiresIn,
					accessToken: payload.accessToken
				},
				isAuthenticated: true,
				client: payload.client
			};

		// ========================================================
		// Auth data actions. This is the data received from a community
		// that is used in future requests to authorize the user.
		case actions.RECEIVE_AUTH:
			return {
				...state,
				authData: {
					refreshToken: payload.refreshToken,
					expiresIn: payload.expiresIn,
					accessToken: payload.accessToken
				},
				isAuthenticated: payload.isAuthenticated,
				client: payload.client
			};
		case actions.REMOVE_AUTH:
			return {
				...state,
				authData: {
					...initialState.authData
				},
				isAuthenticated: false,
				client: payload.client
			};

		default:
			return state;
	}
}
