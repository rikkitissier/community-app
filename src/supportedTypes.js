import _ from "underscore";

// Keeps track of the types of content the app is able to display
// If content types other than these are loaded, they'll be displayed in a WebView instead
// There's a few ways we identify content: classnames, controller paths, and basic URLs.
const supported = {
	appComponents: {
		forums: {
			forums: {
				topic: "TopicView"
			}
		},
		core: {
			members: {
				profile: "Profile"
			}
		}
	},
	urls: [
		// -------
		// CORE SCREENS
		// Profile view
		{
			test: new RegExp("profile/([0-9]+?)-([^/]+)?", "i"),
			matchCallback: (found, url, parsed) => {
				// Status updates not supported yet
				if (!_.isUndefined(parsed.queryKey.status)) {
					return false;
				}

				return {
					routeName: "Profile",
					params: {
						id: found[1]
					}
				};
			}
		},

		// -------
		// FORUMS SCREENS
		// Forum view
		{
			test: new RegExp("forum/([0-9]+?)-([^/]+)?", "i"),
			matchCallback: found => {
				return {
					routeName: "TopicList",
					params: {
						id: parseInt(found[1])
					}
				};
			}
		},
		// Topic view
		{
			test: new RegExp(/topic\/([0-9]+?)-([^/]+)\/?(\?do=findComment&comment=([0-9]+))?/, "i"),
			matchCallback: found => {
				return {
					routeName: "TopicView",
					params: {
						id: parseInt(found[1]),
						...(!_.isUndefined(found[4]) ? { findComment: parseInt(found[4]) } : {})
					}
				};
			}
		},
		// Forum index
		{
			test: new RegExp("[/&?]method=([a-z0-9]+)", "i"),
			matchCallback: found => {
				if (found[1] === "fluid") {
					return {
						routeName: "FluidForum"
					};
				} else {
					return {
						routeName: "ForumIndex"
					};
				}
			}
		}
	]
};

export default supported;
