import gql from "graphql-tag";

const FollowMutation = gql`
	mutation Follow($app: String!, $area: String!, $id: ID!, $anonymous: Boolean!, $type: core_Follow_followOptions!) {
		mutateCore {
			follow (app: $app, area: $area, id: $id, anonymous: $anonymous, type: $type) {
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

export default FollowMutation;