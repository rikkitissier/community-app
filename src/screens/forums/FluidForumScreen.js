import React, { Component } from "react";
import { Text, Image, View, Button, ScrollView, FlatList } from "react-native";
import gql from "graphql-tag";
import { graphql, compose, withApollo } from "react-apollo";
import { connect } from "react-redux";
import _ from "underscore";

import Lang from "../../utils/Lang";
import { PlaceholderRepeater } from "../../ecosystems/Placeholder";
import getErrorMessage from "../../utils/getErrorMessage";
import ErrorBox from "../../atoms/ErrorBox";
import TwoLineHeader from "../../atoms/TwoLineHeader";
import TopicRow from "../../ecosystems/TopicRow";
import EndOfComments from "../../atoms/EndOfComments";

const FluidForumQuery = gql`
	query FluidForumQuery($offset: Int, $limit: Int) {
		forums {
			topics(offset: $offset, limit: $limit, honorPinned: false) {
				id
				title
				postCount
				content {
					plain(truncateLength: 100)
				}
				forum {
					id
					name
					featureColor
				}
				isPinned
				isLocked
				started
				isUnread
				hiddenStatus
				author {
					id
					name
					photo
				}
				lastPostAuthor {
					id
					name
					photo
				}
				lastPostDate
			}
		}
	}
`;

class FluidForumScreen extends Component {
	static navigationOptions = ({ navigation }) => ({
		headerTitle: <TwoLineHeader title={Lang.get("all_topics")} subtitle={Lang.get("all_topics_desc")} />
	});

	/**
	 * GraphQL error types
	 */
	static errors = {};

	constructor(props) {
		super(props);
		this.state = {
			reachedEnd: false
		};
	}

	/**
	 * Update the navigation params to set the title if we came direct, e.g. from search
	 *
	 * @param 	object 	prevProps 	Previous prop values
	 * @return 	void
	 */
	componentDidUpdate(prevProps) {}

	/**
	 * Handles infinite loading when user scrolls to end
	 *
	 * @return 	void
	 */
	onEndReached() {
		if (!this.props.data.loading && !this.state.reachedEnd) {
			this.props.data.fetchMore({
				variables: {
					offset: this.props.data.forums.topics.length
				},
				updateQuery: (previousResult, { fetchMoreResult }) => {
					// Don't do anything if there wasn't any new items
					if (!fetchMoreResult || fetchMoreResult.forums.topics.length === 0) {
						this.setState({
							reachedEnd: true
						});

						return previousResult;
					}

					const topicArray = [...previousResult.forums.topics, ...fetchMoreResult.forums.topics];
					const topics = _.uniq(topicArray, false, topic => topic.id);

					const result = Object.assign({}, previousResult, {
						forums: {
							...previousResult.forums,
							topics
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
		if (this.props.data.networkStatus == 3 && !this.state.reachedEnd) {
			return <TopicRow loading={true} />;
		}

		return <EndOfComments label={Lang.get("end_of_forum")} />;
	}

	/**
	 * Given a post and topic data, return an object with a more useful structure
	 *
	 * @param 	object 	topic 	The topic data
	 * @return 	object
	 */
	buildTopicData(topic) {
		return {
			id: topic.id,
			type: "topic",
			unread: topic.isUnread,
			title: topic.title,
			replies: Math.max(0, parseInt(topic.postCount) - 1),
			author: topic.author,
			started: topic.started,
			snippet: topic.content.plain,
			isHot: false,
			hiddenStatus: topic.hiddenStatus,
			isPinned: topic.isPinned,
			isLocked: topic.isLocked,
			lastPostDate: topic.lastPostDate,
			lastPostAuthor: topic.lastPostAuthor,
			lastPostPhoto: topic.lastPostAuthor.photo,
			contentImages: topic.contentImages,
			forum: topic.forum
		};
	}

	/**
	 * Render a topic or a subforum, depending on the item type
	 *
	 * @param 	object 	item 		An item object for a topic or subforum
	 * @return 	Component
	 */
	renderItem(item) {
		return (
			<TopicRow
				data={item}
				isGuest={!this.props.auth.isAuthenticated}
				showCategory={true}
				onPress={() =>
					this.props.navigation.navigate("TopicView", {
						id: item.id,
						title: item.title,
						author: item.author,
						posts: item.replies,
						started: item.started
					})
				}
			/>
		);
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
			const error = getErrorMessage(this.props.data.error, FluidForumScreen.errors);
			const message = error ? error : Lang.get("topic_view_error");
			return <ErrorBox message={message} refresh={() => this.refreshAfterError()} />;
		} else {
			const topicData = this.props.data.forums.topics.map(topic => this.buildTopicData(topic));

			return (
				<View contentContainerStyle={{ flex: 1 }} style={{ flex: 1 }}>
					<View style={{ flex: 1 }}>
						<FlatList
							style={{ flex: 1 }}
							keyExtractor={item => item.id}
							renderSectionHeader={({ section }) => this.renderHeader(section)}
							renderItem={({ item }) => this.renderItem(item)}
							data={topicData}
							refreshing={this.props.data.networkStatus == 4}
							onRefresh={() => this.onRefresh()}
							onEndReached={() => this.onEndReached()}
							ListEmptyComponent={() => <ErrorBox message={Lang.get("no_topics")} showIcon={false} />}
						/>
					</View>
				</View>
			);
		}
	}
}

/*
{forumData.create.canCreate ? (
	<ActionBar>
		<AddButton
			icon={require("../../../resources/compose.png")}
			title="Create New Topic"
			onPress={() =>
				this.props.navigation.navigate("CreateTopic", {
					forumID: this.props.navigation.state.params.id,
					tagsEnabled: forumData.create.tags.enabled,
					definedTags: forumData.create.tags.definedTags,
					tags_min: settingsData.tags_min,
					tags_len_min: settingsData.tags_len_min,
					tags_max: settingsData.tags_max,
					tags_len_max: settingsData.tags_len_max
				})
			}
		/>
	</ActionBar>
) : null}*/

export default compose(
	connect(state => ({
		auth: state.auth,
		forums: state.forums
	})),
	graphql(FluidForumQuery, {
		options: props => ({
			notifyOnNetworkStatusChange: true,
			variables: {
				offset: 0,
				limit: Expo.Constants.manifest.extra.per_page
			}
		})
	}),
	withApollo
)(FluidForumScreen);
