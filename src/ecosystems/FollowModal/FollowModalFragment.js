import gql from "graphql-tag";

const FollowModalFragment = gql`
	fragment FollowModalFragment on Follow {
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
		followers (offset: 0, limit: 10) {
			id
			name
			photo
		}
		anonFollowCount
	}
`;

export default FollowModalFragment;