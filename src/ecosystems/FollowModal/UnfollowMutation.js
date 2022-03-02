import gql from "graphql-tag";

const UnfollowMutation = gql`
	mutation Unfollow($app: String!, $area: String!, $id: ID!, $followID: ID!) {
		mutateCore {
			unfollow (app: $app, area: $area, id: $id, followID: $followID) {
				id
				followID
				isFollowing
				followType
				followOptions {
					type
					disabled
					selected
				}
				followCount
				followers {
					id
					name
					photo
				}
				anonFollowCount
			}
		}
	}
`;

export default UnfollowMutation;