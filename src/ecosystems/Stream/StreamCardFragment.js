import gql from "graphql-tag";

const StreamCardFragment = gql`
	fragment StreamCardFragment on core_ContentSearchResult {
		indexID
		itemID
		objectID
		url {
			full
			app
			module
			controller
		}
		containerID
		containerTitle
		class
		content
		contentImages
		title
		hiddenStatus
		updated
		created
		isComment
		isReview
		unread
		replies
		reactions {
			id
			image
			count
		}
		relativeTimeKey
		articleLang {
			indefinite
			definite
			definiteUC
		}
		itemAuthor {
			id
			name
			photo
		}
		author {
			id
			name
			photo
		}
	}
`;

export default StreamCardFragment;
