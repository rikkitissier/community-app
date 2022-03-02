import gql from "graphql-tag";

// @todo change period to WEEK
const PopularContributorsFragment = `
	fragment PopularContributorsFragment on core {
		__typename
		popularContributors(period: WEEK) {
			__typename
			rep
			user {
				id
				photo
				name
				url
				group {
					name
				}
			}
		}
	}
`;

export default PopularContributorsFragment;
