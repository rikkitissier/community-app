import gql from "graphql-tag";

const OurPicksFragment = `
	fragment OurPicksFragment on core {
		__typename
		ourPicks {
			id
			addedBy {
				name
			}
			item {
				...on core_Comment {
					id
					item {
						id
						url {
							full
							app
							controller
							module
						}
					}
				}
				...on core_Item {
					id
					url {
						full
						app
						controller
						module
					}
				}
				...on core_Node {
					id
					url {
						full
						app
						controller
						module
					}
				}
			}
			itemType			
			url {
				full
				app
				controller
				module
			}
			title
			description
			images
			dataCount {
				count
				words
			}
			reputation {
				reactionCount
				reactions {
					id
					image
					count
				}
			}
		}
	}
`;

export default OurPicksFragment;