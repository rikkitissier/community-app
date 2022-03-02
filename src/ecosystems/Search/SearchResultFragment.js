import gql from "graphql-tag";

const SearchResultFragment = gql`
	fragment SearchResultFragment on core_ContentSearchResult {
		indexID
		objectID
		itemID
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
		replies
		isComment
		isReview
		relativeTimeKey
		firstCommentRequired
		unread
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
		articleLang {
			indefinite
			definite
			definiteUC
		}
	}
`;

export default SearchResultFragment;
