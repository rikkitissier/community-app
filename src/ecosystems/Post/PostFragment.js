import gql from "graphql-tag";

const PostFragment = gql`
	fragment PostFragment on forums_Post {
		id
		__typename
		url {
			__typename
			full
			app
			module
			controller
		}
		timestamp
		author {
			__typename
			id
			photo
			name
			isOnline
			canBeIgnored
			ignoreStatus {
				id
				type
				isBeingIgnored
				lang
			}
		}
		content {
			original
		}
		isFirstPost
		isIgnored
		isFeatured
		hiddenStatus
		reportStatus {
			id
			hasReported
			reportDate
			reportType
			reportContent
		}
		commentPermissions {
			canShare
			canReport
			canReportOrRevoke
		}
		articleLang {
			definiteNoItem: definite(withItem: false)
		}
		reputation {
			__typename
			reactionCount
			canReact
			hasReacted
			canViewReps
			isLikeMode
			givenReaction {
				__typename
				id
				image
				name
			}
			defaultReaction {
				__typename
				id
				image
				name
			}
			availableReactions {
				__typename
				id
				image
				name
			}
			reactions {
				__typename
				id
				reactionId
				image
				name
				count
			}
		}
	}
`;

export default PostFragment;
