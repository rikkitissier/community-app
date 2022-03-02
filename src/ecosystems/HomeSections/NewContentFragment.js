import gql from "graphql-tag";

const NewContentFragment = `
	fragment NewContentFragment on core {
		__typename
		newContent: stream(id: $streamId) {
			id
			__typename
			title
			items {
				__typename
				indexID
				itemID
				objectID
				url {
					__typename
					full
					app
					module
					controller
				}
				containerID
				containerTitle
				class
				content(truncateLength: 200)
				contentImages
				title
				hiddenStatus
				updated
				created
				isComment
				isReview
				unread
				relativeTimeKey
				itemAuthor {
					__typename
					id
					name
					photo
				}
				author {
					__typename
					id
					name
					photo
				}
				firstCommentRequired
				articleLang {
					indefinite
					definite
				}
			}
		}
	}
`;

export default NewContentFragment;
