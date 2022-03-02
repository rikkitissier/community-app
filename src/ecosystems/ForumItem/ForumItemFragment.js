import gql from "graphql-tag";

const ForumItemFragment = gql`
	fragment ForumItemFragment on forums_Forum {
		id
		name
		topicCount
		postCount
		hasUnread
		subforums {
			id
			name
			topicCount
			postCount
			hasUnread
			passwordProtected
			passwordRequired
			isRedirectForum
			redirectHits
			url {
				full
			}
			lastPostAuthor {
				photo
			}
			lastPostDate
		}
	}
`;

export default ForumItemFragment;
