//import Post from './Post';
import NewContent from "./NewContent";
import NewContentFragment from "./NewContentFragment";
import OurPicks from "./OurPicks";
import OurPicksFragment from "./OurPicksFragment";
import ActiveUsers from "./ActiveUsers";
import ActiveUsersFragment from "./ActiveUsersFragment";
import PopularContributors from "./PopularContributors";
import PopularContributorsFragment from "./PopularContributorsFragment";

//export { Post as Post };
//export { NewContent as NewContent };
//export { NewContentFragment as NewContentFragment };

export const HomeSections = {
	new_content: {
		component: NewContent,
		fragment: NewContentFragment,
		fragmentName: "NewContentFragment",
		icon: require("../../../resources/home_new.png")
	},
	our_picks: {
		component: OurPicks,
		fragment: OurPicksFragment,
		fragmentName: "OurPicksFragment",
		icon: require("../../../resources/home_ourpicks.png")
	},
	active_users: {
		component: ActiveUsers,
		fragment: ActiveUsersFragment,
		fragmentName: "ActiveUsersFragment",
		icon: require("../../../resources/home_activeusers.png")
	},
	popular_contributors: {
		component: PopularContributors,
		fragment: PopularContributorsFragment,
		fragmentName: "PopularContributorsFragment",
		icon: require("../../../resources/home_new.png")
	}
};
