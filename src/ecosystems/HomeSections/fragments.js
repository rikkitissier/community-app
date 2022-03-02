//import Post from './Post';
import NewContentFragment from "./NewContentFragment";
import OurPicksFragment from "./OurPicksFragment";
import ActiveUsersFragment from "./ActiveUsersFragment";
import PopularContributorsFragment from "./PopularContributorsFragment";

//export { Post as Post };
//export { NewContent as NewContent };
//export { NewContentFragment as NewContentFragment };

export const HomeSections = {
	new_content: {
		fragment: NewContentFragment,
		fragmentName: "NewContentFragment"
	},
	our_picks: {
		fragment: OurPicksFragment,
		fragmentName: "OurPicksFragment"
	},
	active_users: {
		fragment: ActiveUsersFragment,
		fragmentName: "ActiveUsersFragment"
	},
	popular_contributors: {
		fragment: PopularContributorsFragment,
		fragmentName: "PopularContributorsFragment"
	}
};
