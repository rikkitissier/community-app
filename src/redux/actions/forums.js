export const SET_FORUM_PASSWORD = "SET_FORUM_PASSWORD";
export const setForumPassword = data => ({
	type: SET_FORUM_PASSWORD,
	payload: {
		...data
	}
});