// ========================================================
export const SET_SITE_DATA = "SET_SITE_DATA";
export const setSiteData = data => ({
	type: SET_SITE_DATA,
	payload: {
		...data
	}
});

export const SET_SITE_SETTINGS = "SET_SITE_SETTINGS";
export const setSiteSettings = data => ({
	type: SET_SITE_SETTINGS,
	payload: {
		...data
	}
});

export const SET_LOGIN_HANDLERS = "SET_LOGIN_HANDLERS";
export const setLoginHandlers = data => ({
	type: SET_LOGIN_HANDLERS,
	payload: {
		...data
	}
});

export const SET_SITE_CACHE = "SET_SITE_CACHE";
export const setSiteCache = data => ({
	type: SET_SITE_CACHE,
	payload: {
		...data
	}
});

export const SET_FORUM_PASSWORD = "SET_FORUM_PASSWORD";
export const setForumPassword = data => ({
	type: SET_FORUM_PASSWORD,
	payload: {
		...data
	}
});

export const SET_SITE_MENU = "SET_SITE_MENU";
export const setSiteMenu = data => ({
	type: SET_SITE_MENU,
	payload: data
});

export const SET_SITE_MODULE_PERMISSIONS = "SET_SITE_MODULE_PERMISSIONS";
export const setSiteModulePermissions = data => ({
	type: SET_SITE_MODULE_PERMISSIONS,
	payload: data
});
