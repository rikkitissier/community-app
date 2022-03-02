import gql from "graphql-tag";

const WhoReactedFragment = gql`
	fragment WhoReactedFragment on core_Member {
		id
		photo
		name
		group {
			name
		}
	}
`;

export default WhoReactedFragment;