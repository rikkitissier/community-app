import { SET_FORUM_PASSWORD } from "../actions/site";
import { SET_ACTIVE_COMMUNITY } from "../actions/app";

const initialState = {};

export default function forums(state = initialState, { type, payload }) {
	switch (type) {
		// When we change the active community, we want to completely reset
		// our forums state.
		case SET_ACTIVE_COMMUNITY:
			return {
				...initialState
			};

		case SET_FORUM_PASSWORD:
			return {
				...state,
				[payload.forumID]: payload.password
			};
		default:
			return { ...state };
	}
}
