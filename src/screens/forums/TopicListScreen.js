import React, { Component } from "react";
import { Text, Image, View, Button, ScrollView, SectionList, LayoutAnimation } from "react-native";
import gql from "graphql-tag";
import { graphql, compose, withApollo } from "react-apollo";
import { connect } from "react-redux";
import _ from "underscore";

import Lang from "../../utils/Lang";
import { PlaceholderRepeater } from "../../ecosystems/Placeholder";
import getErrorMessage from "../../utils/getErrorMessage";
import FollowButton from "../../atoms/FollowButton";
import TwoLineHeader from "../../atoms/TwoLineHeader";
import ErrorBox from "../../atoms/ErrorBox";
import ActionBar from "../../atoms/ActionBar";
import SectionHeader from "../../atoms/SectionHeader";
import { ForumItem, ForumItemFragment } from "../../ecosystems/ForumItem";
import TopicRow from "../../ecosystems/TopicRow";
import AddButton from "../../atoms/AddButton";
import EndOfComments from "../../atoms/EndOfComments";
import { FollowModal, FollowModalFragment, FollowMutation, UnfollowMutation } from "../../ecosystems/FollowModal";

const TopicListQuery = gql`
	query TopicListQuery($forum: ID!, $offset: Int, $limit: Int, $password: String) {
		forums {
			forum(id: $forum) {
				...ForumItemFragment
				topics(offset: $offset, limit: $limit, password: $password) {
					id
					title
					postCount
					content {
						plain(truncateLength: 100)
					}
					hiddenStatus
					isPinned
					isLocked
					isHot
					isFeatured
					started
					isUnread
					lastPostAuthor {
						id
						name
						photo
					}
					lastPostDate
					author {
						id
						name
						photo
					}
					isQuestion
					questionVotes
					canVoteUp
					canVoteDown
					vote
					hasBestAnswer
				}
				follow {
					...FollowModalFragment
				}
				nodePermissions {
					canCreate
					itemsRequireApproval
					commentsRequireApproval
				}
				tagPermissions {
					enabled
					definedTags
				}
			}
		}
	}
	${FollowModalFragment}
	${ForumItemFragment}
`;

class TopicListScreen extends Component {
	static navigationOptions = ({ navigation }) => ({
		headerTitle:
			!navigation.state.params.title || !navigation.state.params.subtitle ? (
				<TwoLineHeader loading={true} />
			) : (
				<TwoLineHeader title={navigation.state.params.title} subtitle={navigation.state.params.subtitle} />
			),
		headerRight: navigation.state.params.showFollowControl && (
			<FollowButton followed={navigation.state.params.isFollowed} onPress={navigation.state.params.onPressFollow} />
		)
	});

	/**
	 * GraphQL error types
	 */
	static errors = {
		NO_FORUM: Lang.get("no_forum"),
		INCORRECT_PASSWORD: Lang.get("incorrect_forum_password")
	};

	constructor(props) {
		super(props);
		this.state = {
			reachedEnd: false,
			followModalVisible: false
		};

		this.renderItem = this.renderItem.bind(this);
		this.renderHeader = this.renderHeader.bind(this);
		this.onRefresh = this.onRefresh.bind(this);
		this.toggleFollowModal = this.toggleFollowModal.bind(this);
		this.onEndReached = this.onEndReached.bind(this);
		this.onFollow = this.onFollow.bind(this);
		this.onUnfollow = this.onUnfollow.bind(this);
		this.createTopic = this.createTopic.bind(this);
	}

	getSnapshotBeforeUpdate(prevProps) {
		if (!prevProps.navigation.state.params.highlightTopic && this.props.navigation.state.params.highlightTopic) {
			LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		}
		return null;
	}

	/**
	 * Toggles between showing/hiding the follow modal
	 *
	 * @return 	void
	 */
	toggleFollowModal() {
		console.log("CLOSE MODAL");

		this.setState({
			followModalVisible: !this.state.followModalVisible
		});
	}

	/**
	 * Component mount
	 * See if title params were passed, and if so, use those
	 *
	 * @return 	void
	 */
	componentDidMount() {
		if (!_.isUndefined(this.props.navigation.state.params) && !_.isUndefined(this.props.navigation.state.params.title)) {
			this.props.navigation.setParams({
				title: this.props.navigation.state.params.title,
				subtitle: this.props.navigation.state.params.subtitle
			});
		}

		if (this.props.auth.isAuthenticated) {
			this.props.navigation.setParams({
				showFollowControl: true,
				isFollowed: false,
				onPressFollow: this.toggleFollowModal
			});
		}
	}

	/**
	 * Update the navigation params to set the title if we came direct, e.g. from search
	 *
	 * @param 	object 	prevProps 	Previous prop values
	 * @return 	void
	 */
	componentDidUpdate(prevProps) {
		if (prevProps.data.loading && !this.props.data.loading && !this.props.data.error) {
			if (!prevProps.navigation.state.params.title || !prevProps.navigation.state.params.subtitle) {
				this.props.navigation.setParams({
					title: this.props.data.forums.forum.name,
					subtitle: Lang.pluralize(Lang.get("topics"), Lang.formatNumber(this.props.data.forums.forum.topicCount))
				});
			}

			if (!this.props.data.forums.forum.passwordProtected && this.props.auth.isAuthenticated) {
				this.props.navigation.setParams({
					showFollowControl: true,
					isFollowed: this.props.data.forums.forum.follow.isFollowing
				});
			}
		} else if (!prevProps.data.error && this.props.data.error) {
			this.props.navigation.setParams({
				showFollowControl: false
			});
		}
	}

	/**
	 * Handles infinite loading when user scrolls to end
	 *
	 * @return 	void
	 */
	onEndReached() {
		if (!this.props.data.loading && !this.state.reachedEnd) {
			this.props.data.fetchMore({
				variables: {
					offset: this.props.data.forums.forum.topics.length,
					limit: Expo.Constants.manifest.extra.per_page
				},
				updateQuery: (previousResult, { fetchMoreResult }) => {
					// Don't do anything if there weren't any new items
					if (!fetchMoreResult || fetchMoreResult.forums.forum.topics.length === 0) {
						this.setState({
							reachedEnd: true
						});

						return previousResult;
					}

					// Ensure new topic array is unique
					// Since the topic list can change order between loads (due to user activity), it's possible
					// that a topic row will appear twice in our data if we don't check for unique values.
					// This causes a RN duplicate rows error.
					const topics = _.uniq([...previousResult.forums.forum.topics, ...fetchMoreResult.forums.forum.topics], false, topic => topic.id);

					const result = Object.assign({}, previousResult, {
						forums: {
							...previousResult.forums,
							forum: {
								...previousResult.forums.forum,
								topics
							}
						}
					});

					return result;
				}
			});
		}
	}

	/**
	 * Handle refreshing the view
	 *
	 * @return 	void
	 */
	onRefresh() {
		this.setState({
			reachedEnd: false
		});

		this.props.data.refetch();
	}

	/**
	 * Return the footer component. Show a spacer by default, but a loading post
	 * if we're fetching more items right now.
	 *
	 * @return 	Component
	 */
	getFooterComponent() {
		// If we're loading more items in
		if (!this.state.reachedEnd) {
			return <TopicRow loading={true} />;
		}

		return <EndOfComments reachedEnd={this.state.reachedEnd} label={Lang.get("end_of_forum")} />;
	}

	/**
	 * Given a post and topic data, return an object with a more useful structure
	 *
	 * @todo this is stupid, so eliminate this
	 * @param 	object 	post 		A raw post object from GraphQL
	 * @param 	object 	topicData 	The topic data
	 * @return 	object
	 */
	buildTopicData(topic, forumData) {
		return {
			id: topic.id,
			type: "topic",
			unread: topic.isUnread,
			title: topic.title,
			replies: Math.max(0, parseInt(topic.postCount) - 1),
			author: topic.author,
			started: topic.started,
			snippet: topic.content.plain,
			isHot: topic.isHot,
			isPinned: topic.isPinned,
			isLocked: topic.isLocked,
			isFeatured: topic.isFeatured,
			hiddenStatus: topic.hiddenStatus,
			isAwaitingApproval: topic.isAwaitingApproval,
			isDeleted: topic.isDeleted,
			lastPostDate: topic.lastPostDate,
			lastPostPhoto: topic.lastPostAuthor.photo,
			lastPostAuthor: topic.lastPostAuthor,
			contentImages: topic.contentImages,
			isQuestion: topic.isQuestion,
			questionVotes: topic.questionVotes,
			canVoteUp: topic.canVoteUp,
			canVoteDown: topic.canVoteDown,
			vote: topic.vote,
			hasBestAnswer: topic.hasBestAnswer
		};
	}

	/**
	 * Build the subforum data object
	 *
	 * @param 	object 	subforums 	Subforum data
	 * @return 	array
	 */
	buildSubforumData(subforums) {
		return subforums.map(forum => ({
			key: forum.id,
			type: "forum",
			data: forum
		}));
	}

	/**
	 * Render a topic or a subforum, depending on the item type
	 *
	 * @param 	object 	item 		An item object for a topic or subforum
	 * @param 	object 	forumData 	The forum data
	 * @return 	Component
	 */
	renderItem({ item }) {
		if (item.type == "topic") {
			const shouldHighlight =
				!_.isUndefined(this.props.navigation.getParam("highlightTopic")) && parseInt(this.props.navigation.getParam("highlightTopic")) === parseInt(item.id);
			return <TopicRow data={item} showCategory={false} highlight={shouldHighlight} />;
		} else {
			return <ForumItem key={item.key} showCategory={false} data={item.data} />;
		}
	}

	/**
	 * Render a section header, but only if we have subforums to show
	 *
	 * @param 	object 	section 	The section we're rendering
	 * @return 	Component|null
	 */
	renderHeader(section) {
		if (!this.props.data.forums.forum.subforums.length) {
			return null;
		}

		return <SectionHeader title={section.section.title} />;
	}

	/**
	 * Event handler for following the forum
	 *
	 * @param 	object 		followData 		Object with the selected values from the modal
	 * @return 	void
	 */
	async onFollow(followData) {
		this.setState({
			followModalVisible: false
		});

		try {
			await this.props.client.mutate({
				mutation: FollowMutation,
				variables: {
					app: "forums",
					area: "forum",
					id: this.props.data.forums.forum.id,
					anonymous: followData.anonymous,
					type: followData.option.toUpperCase()
				}
			});

			this.props.navigation.setParams({
				isFollowed: true
			});
		} catch (err) {
			Alert.alert(Lang.get("error"), Lang.get("error_following"), [{ text: Lang.get("ok") }], { cancelable: false });
		}
	}

	/**
	 * Event handler for unfollowing the forum
	 *
	 * @return 	void
	 */
	async onUnfollow() {
		this.setState({
			followModalVisible: false
		});

		try {
			await this.props.client.mutate({
				mutation: UnfollowMutation,
				variables: {
					app: "forums",
					area: "forum",
					id: this.props.data.forums.forum.id,
					followID: this.props.data.forums.forum.follow.followID
				}
			});

			this.props.navigation.setParams({
				isFollowed: false
			});
		} catch (err) {
			Alert.alert(Lang.get("error"), Lang.get("error_unfollowing"), [{ text: Lang.get("ok") }], { cancelable: false });
		}
	}

	/**
	 * Event handler for tapping Create New Topic
	 *
	 * @return 	void
	 */
	createTopic() {
		const forumData = this.props.data.forums.forum;
		const { enabled: tagsEnabled, definedTags } = forumData.tagPermissions;

		this.props.navigation.navigate("CreateTopic", {
			forumID: this.props.navigation.state.params.id,
			forumName: forumData.name,
			tagsEnabled,
			definedTags,
			requiresApproval: forumData.nodePermissions.itemsRequireApproval
		});
	}

	render() {
		// status 3 == fetchMore, status 4 == refreshing
		if (this.props.data.loading && this.props.data.networkStatus !== 3 && this.props.data.networkStatus !== 4) {
			return (
				<PlaceholderRepeater repeat={7}>
					<TopicRow loading={true} />
				</PlaceholderRepeater>
			);
		} else if (this.props.data.error) {
			const error = getErrorMessage(this.props.data.error, TopicListScreen.errors);
			const message = error ? error : Lang.get("topic_view_error");
			return <ErrorBox message={message} />;
		} else {
			const forumData = this.props.data.forums.forum;
			const subforums = forumData.subforums;
			const topicData = forumData.topics.map(topic => this.buildTopicData(topic, forumData));
			const forumSections = [];
			const ListEmptyComponent = <ErrorBox message={Lang.get("no_topics")} showIcon={false} />;

			// Add subforums if we have them
			if (forumData.subforums.length) {
				forumSections.push({
					title: Lang.get("subforums_title"),
					data: forumData.subforums.length ? this.buildSubforumData(forumData.subforums) : null
				});
			}

			// Add topics
			if (topicData.length) {
				forumSections.push({
					title: Lang.get("topics_title"),
					data: topicData
				});
			}

			return (
				<View contentContainerStyle={{ flex: 1 }} style={{ flex: 1 }}>
					{this.props.auth.isAuthenticated && (
						<FollowModal
							isVisible={this.state.followModalVisible}
							followData={forumData.follow}
							onFollow={this.onFollow}
							onUnfollow={this.onUnfollow}
							close={this.toggleFollowModal}
						/>
					)}
					<View style={{ flex: 1 }}>
						<SectionList
							style={{ flex: 1 }}
							keyExtractor={item => item.type + (item.type == "forum" ? item.key : item.id)}
							renderSectionHeader={this.renderHeader}
							renderItem={this.renderItem}
							sections={forumSections}
							refreshing={this.props.data.networkStatus == 4}
							onRefresh={this.onRefresh}
							onEndReached={this.onEndReached}
							ListEmptyComponent={ListEmptyComponent}
							ListFooterComponent={this.getFooterComponent()}
						/>
						{forumData.nodePermissions.canCreate && (
							<ActionBar>
								<AddButton icon={require("../../../resources/compose.png")} title={Lang.get("create_new_topic")} onPress={this.createTopic} />
							</ActionBar>
						)}
					</View>
				</View>
			);
		}
	}
}

export default compose(
	connect(state => ({
		auth: state.auth,
		forums: state.forums,
		user: state.user
	})),
	graphql(TopicListQuery, {
		options: props => ({
			notifyOnNetworkStatusChange: true,
			variables: {
				forum: props.navigation.state.params.id,
				offset: 0,
				limit: Expo.Constants.manifest.extra.per_page,
				password: props.forums[props.navigation.state.params.id] || null
			}
		})
	}),
	withApollo
)(TopicListScreen);
