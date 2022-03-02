import React, { Component } from "react";
import { Text, Image, View, Button, TouchableOpacity, AsyncStorage, StyleSheet, Alert, LayoutAnimation, Animated, Platform, Share } from "react-native";
import gql from "graphql-tag";
import { graphql, compose, withApollo } from "react-apollo";
import { connect } from "react-redux";
import Modal from "react-native-modal";
import _ from "underscore";
import { copilot, walkthroughable, CopilotStep } from "react-native-copilot";

import shortNumber from "short-number";
import Lang from "../../utils/Lang";
import { PlaceholderRepeater } from "../../ecosystems/Placeholder";
import getErrorMessage from "../../utils/getErrorMessage";
import TwoLineHeader from "../../atoms/TwoLineHeader";
import ShadowedArea from "../../atoms/ShadowedArea";
import { Post, PostFragment } from "../../ecosystems/Post";
import { PollPreview, PollModal, PollFragment } from "../../ecosystems/Poll";
import { QuestionVote, BestAnswer } from "../../ecosystems/TopicView";
import Tag from "../../atoms/Tag";
import TagList from "../../atoms/TagList";
import ErrorBox from "../../atoms/ErrorBox";
import ActionBar from "../../atoms/ActionBar";
import Pager from "../../atoms/Pager";
import ViewMeasure from "../../atoms/ViewMeasure";
import DummyTextInput from "../../atoms/DummyTextInput";
import UnreadBar from "../../atoms/UnreadBar";
import LoadMoreComments from "../../atoms/LoadMoreComments";
import EndOfComments from "../../atoms/EndOfComments";
import TopicStatus from "../../atoms/TopicStatus";
import HeaderButton from "../../atoms/HeaderButton";
import LoginRegisterPrompt from "../../ecosystems/LoginRegisterPrompt";
import FollowButton from "../../atoms/FollowButton";
import { Tooltip } from "../../ecosystems/Walkthrough";
import UserPhoto from "../../atoms/UserPhoto";
import NavigationService from "../../utils/NavigationService";
import { FollowModal, FollowModalFragment, FollowMutation, UnfollowMutation } from "../../ecosystems/FollowModal";

//import styles from "../../styles";
import { withTheme, currentStyleSheet } from "../../themes";
import icons from "../../icons";

const TopicViewQuery = gql`
	query TopicViewQuery($id: ID!, $offsetAdjust: Int, $offsetPosition: forums_Post_offset_position, $limit: Int, $findComment: Int) {
		forums {
			topic(id: $id) {
				__typename
				id
				url {
					__typename
					full
					app
					module
					controller
				}
				isUnread
				timeLastRead
				postCount(includeHidden: true)
				views
				unreadCommentPosition
				findCommentPosition(findComment: $findComment)
				started
				updated
				title
				isArchived
				isHot
				isPinned
				isFeatured
				hiddenStatus
				author {
					__typename
					id
					name
					photo
				}
				tags {
					__typename
					name
				}
				isLocked
				poll {
					...PollFragment
				}
				itemPermissions {
					__typename
					canShare
					commentInformation
					canComment
					canCommentIfSignedIn
					canMarkAsRead
				}
				posts(offsetAdjust: $offsetAdjust, offsetPosition: $offsetPosition, limit: $limit, findComment: $findComment) {
					...PostFragment
					isQuestion
					answerVotes
					isBestAnswer
					canVoteUp
					canVoteDown
					vote
				}
				forum {
					__typename
					id
					hasUnread
					nodePermissions {
						canCreate
					}
				}
				follow {
					...FollowModalFragment
				}
				articleLang {
					definite
				}
				isQuestion
				questionVotes
				canVoteUp
				canVoteDown
				vote
				hasBestAnswer
				canSetBestAnswer
				bestAnswerID
			}
		}
	}
	${PollFragment}
	${PostFragment}
	${FollowModalFragment}
`;

const MarkTopicRead = gql`
	mutation MarkTopicRead($id: ID!) {
		mutateForums {
			markTopicRead(id: $id) {
				__typename
				id
				timeLastRead
				unreadCommentPosition
				isUnread
				forum {
					id
					hasUnread
				}
			}
		}
	}
`;

const VoteQuestion = gql`
	mutation VoteQuestion($id: ID!, $vote: forums_VoteType!) {
		mutateForums {
			voteQuestion(id: $id, vote: $vote) {
				id
				questionVotes
				canVoteUp
				canVoteDown
				vote
				hasBestAnswer
			}
		}
	}
`;

const VoteAnswer = gql`
	mutation VoteAnswer($id: ID!, $vote: forums_VoteType!) {
		mutateForums {
			voteAnswer(id: $id, vote: $vote) {
				id
				answerVotes
				isBestAnswer
				canVoteUp
				canVoteDown
				vote
			}
		}
	}
`;

const SetBestAnswer = gql`
	mutation SetBestAnswer($id: ID!) {
		mutateForums {
			setBestAnswer(id: $id) {
				id
				isBestAnswer
			}
		}
	}
`;

const LOAD_MORE_HEIGHT = 0;

const headerStyles = StyleSheet.create({
	authorPhoto: {
		position: "absolute",
		top: 15,
		left: "50%",
		...Platform.select({
			ios: {
				marginLeft: -30
			},
			android: {
				marginLeft: -31
			}
		}),
		zIndex: 100
	},
	headerRight: {
		width: 80
	}
});

class TopicViewScreen extends Component {
	/**
	 * React Navigation config
	 */
	static navigationOptions = ({ navigation }) => {
		const { params } = navigation.state;

		return {
			headerTitle: params.ready ? (
				<React.Fragment>
					<Animated.View style={{ opacity: params.headerBarOpacity || 0 }}>
						<TwoLineHeader
							title={params.title}
							subtitle={Lang.get("started_by_x", { name: params.author.name })} //@todo lang abstraction
						/>
					</Animated.View>
					<Animated.View
						style={[
							{ opacity: params.authorOpacity || 0, transform: [{ scale: params.authorScale || 0.6 }, { translateY: params.authorTranslate || -35 }] },
							headerStyles.authorPhoto
						]}
					>
						<TouchableOpacity onPress={params.onPressAuthor}>
							<UserPhoto url={params.author.photo} size={60} />
						</TouchableOpacity>
					</Animated.View>
				</React.Fragment>
			) : null,
			headerRight: (
				<View style={[currentStyleSheet.flexRow, currentStyleSheet.flexAlignCenter, currentStyleSheet.flexJustifyEnd, headerStyles.headerRight]}>
					{params.showShareControl && <HeaderButton position="right" icon={icons.SHARE} onPress={params.onPressShare} style={{ marginTop: -5 }} />}
					{params.showFollowControl && <FollowButton followed={params.isFollowed} onPress={params.onPressFollow} />}
				</View>
			)
		};
	};

	/*
	 */

	/**
	 * GraphQL error types
	 */
	static errors = {
		NO_TOPIC: Lang.get("no_topic"),
		INVALID_ID: Lang.get("invalid_topic"),
		NON_QUESTION: Lang.get("not_question"),
		CANNOT_VOTE: Lang.get("cannot_vote")
	};

	constructor(props) {
		super(props);
		this._flatList = null; // Ref to the flatlist
		//this._startingOffset = 0; // The offset we're currently displaying in the view
		this._cellHeights = {}; // Store the height of each post
		//this._headerHeight = 250;
		this._loadMoreHeight = 0;
		this._isSnapping = false; // Is the flatlist currently snapping back to top?
		this._snapTimeout = null; // Reference to timeout for snap function
		this._initialOffsetDone = false; // Flag to indicate we've set our initial offset on render
		this._aboutToScrollToEnd = false; // Flag to indicate a scrollToEnd is pending so we can avoid other autoscrolls
		this._answerVoteUpHandlers = {}; // Stores memoized event handlers for voting answers up
		this._answerVoteDownHandlers = {}; // Stores memoized event handlers for voting answers up
		this._bestAnswerHandlers = {}; // Stores memoized event handlers for settings answers as best
		this._showWalkthrough = false;
		this._walkthroughTimeout = null;
		this.state = {
			listData: [],
			reachedEnd: false,
			earlierPostsAvailable: null,
			loadingEarlierPosts: false,
			startingOffset: this.props.data.variables.offset || 0,
			pollModalVisible: false,
			followModalVisible: false,
			currentPosition: 0,
			loadingUnseenPosts: false,
			innerHeaderHeight: 200
		};

		this._viewabilityConfig = {
			//minimumViewTime: 600,
			//viewAreaCoveragePercentThreshold: 10
			itemVisiblePercentThreshold: 25
		};

		this._nScroll = new Animated.Value(0);
		this._scroll = new Animated.Value(0);
		this._nScroll.addListener(Animated.event([{ value: this._scroll }], { useNativeDriver: false }));

		this.props.copilotEvents.on("stop", this.setWalkthroughFlag);

		this.renderItem = this.renderItem.bind(this);
		this.loadEarlierComments = this.loadEarlierComments.bind(this);
		this.toggleFollowModal = this.toggleFollowModal.bind(this);
		this.goToPollScreen = this.goToPollScreen.bind(this);
		this.onEndReached = this.onEndReached.bind(this);
		this.onRefresh = this.onRefresh.bind(this);
		this.onFollow = this.onFollow.bind(this);
		this.onUnfollow = this.onUnfollow.bind(this);
		this.addReply = this.addReply.bind(this);
		this.onVoteQuestionUp = this.onVoteQuestionUp.bind(this);
		this.onVoteQuestionDown = this.onVoteQuestionDown.bind(this);
		this.onViewableItemsChanged = this.onViewableItemsChanged.bind(this);
		this.scrollToEnd = this.scrollToEnd.bind(this);
		this.scrollToPost = this.scrollToPost.bind(this);
		this.onPostLayout = this.onPostLayout.bind(this);
		this.onHeaderLayout = this.onHeaderLayout.bind(this);
		this.onInnerHeaderLayout = this.onInnerHeaderLayout.bind(this);
		this.onScrollEnd = this.onScrollEnd.bind(this);
		this.setWalkthroughFlag = this.setWalkthroughFlag.bind(this);
		this.onPressShare = this.onPressShare.bind(this);
		this.onPressAuthor = this.onPressAuthor.bind(this);
		this.showNoReplyMessage = this.showNoReplyMessage.bind(this);
	}

	/**
	 * Create animation values as soon as we mount
	 *
	 * @return 	void
	 */
	componentDidMount() {
		this.buildAnimations();
		this.setHeaderParams();
		this.checkWalkthrough();
	}

	/**
	 * Clear timeouts/events
	 *
	 * @return 	void
	 */
	componentWillUnmount() {
		clearTimeout(this._snapTimeout);
		clearTimeout(this._walkthroughTimeout);
		this.props.copilotEvents.off("stop");
	}

	/**
	 * Checks whether we should show the pager walkthrough
	 *
	 * @return 	void
	 */
	async checkWalkthrough() {
		let doShowWalkthrough = true;

		try {
			const value = await AsyncStorage.getItem("@walkthrough:topicPager");

			if (value !== null) {
				this._shownWalkthrough = true;
				doShowWalkthrough = false;
			}
		} catch (err) {
			console.log(err);
		}

		this._showWalkthrough = doShowWalkthrough;
	}

	/**
	 * Set the flag that will hide the walkthrough on future loads
	 *
	 * @return 	void
	 */
	async setWalkthroughFlag() {
		this._showWalkthrough = false;
		clearTimeout(this._walkthroughTimeout); // Just in case there's a timeout about to fire

		try {
			await AsyncStorage.setItem("@walkthrough:topicPager", "true");
		} catch (err) {}
	}

	/**
	 * Build animation values
	 *
	 * @return 	void
	 */
	buildAnimations() {
		const HEADER_HEIGHT = Platform.OS === "ios" ? 76 : 50;
		const SCROLL_HEIGHT = this.state.innerHeaderHeight + HEADER_HEIGHT;

		// This value is the extra padding on innerHeader to leave space for the user photo
		const topSpacing = 44;

		// Interpolate methods for animations that will be used in the react-navigation header
		this.props.navigation.setParams({
			authorOpacity: this._scroll.interpolate({
				inputRange: [topSpacing, SCROLL_HEIGHT * 0.4],
				outputRange: [1, 0]
			}),
			authorScale: this._nScroll.interpolate({
				inputRange: [0, 45],
				outputRange: [1, 0.6],
				extrapolate: "clamp"
			}),
			authorTranslate: this._nScroll.interpolate({
				inputRange: [0, 45],
				outputRange: [0, -35],
				extrapolate: "clamp"
			}),
			headerBarOpacity: this._scroll.interpolate({
				inputRange: [topSpacing, SCROLL_HEIGHT * 0.75],
				outputRange: [0, 1]
			})
		});

		// Other interpolations
		this._titleOpacity = this._scroll.interpolate({
			inputRange: [0, SCROLL_HEIGHT * 0.5],
			outputRange: [1, 0.5]
		});
		this._titleScale = this._nScroll.interpolate({
			inputRange: [0, SCROLL_HEIGHT * 0.8],
			outputRange: [1, 0.8],
			extrapolateLeft: "clamp"
		});
	}

	onPressAuthor() {
		const { id, name } = this.props.data.forums.topic.author;

		NavigationService.navigateToScreen("Profile", {
			id,
			name
		});
	}

	/**
	 * On scroll end handler, used to 'snap' list back into place if it's mid-animation
	 *
	 * @param 	event 		e 		Event data
	 * @return 	void
	 */
	onScrollEnd(e) {
		const y = e.nativeEvent.contentOffset.y;
		const halfway = this.state.innerHeaderHeight / 2;

		if (this._flatList && !this._isSnapping && y > 0) {
			if (y < halfway) {
				this.setIsSnapping();
				this._flatList.scrollToOffset({ offset: 0 });
			} else if (y >= halfway && y < this.state.innerHeaderHeight) {
				this.setIsSnapping();
				this._flatList.scrollToOffset({ offset: this.state.innerHeaderHeight });
			}
		}
	}

	/**
	 * Sets a flag indicating we're snapping back, and a timeout to reset flag
	 *
	 * @return 	void
	 */
	setIsSnapping() {
		this._isSnapping = true;
		this._snapTimeout = setTimeout(() => (this._isSnapping = false), 300);
	}

	/**
	 * Toggles between showing/hiding the follow modal
	 *
	 * @return 	void
	 */
	toggleFollowModal() {
		this.setState({
			followModalVisible: !this.state.followModalVisible
		});
	}

	/**
	 * Scroll to the end of our listing
	 *
	 * @return 	void
	 */
	scrollToEnd() {
		this._aboutToScrollToEnd = true;

		// I don't like this, but it appears to be necessary to trigger the
		// scroll after a short timeout to allow time for the list to render
		setTimeout(() => {
			this._flatList.scrollToEnd();
			this._aboutToScrollToEnd = false;
		}, 500);
	}

	/**
	 * Clear our cache of list cell heights
	 *
	 * @return 	void
	 */
	clearCellHeightCache() {
		this._cellHeights = {};
	}

	/**
	 * Allows us to move to a particular post in the topic.
	 * If the post is already built, scroll to it naturally.
	 * If not, we'll reload the topic view with the new post as the first we see.
	 *
	 * @param 	number 		newPost 	The post to scroll to
	 * @return 	void
	 */
	async scrollToPost(newPost) {
		const topicData = this.props.data.forums.topic;
		const realPostPosition = newPost - 1; // Pager passes us a 1-indexed post position, but we'll need a real position in the posts array

		// First, 'fix' the current position so it doesn't bounce as we move in the topic feed
		this.setState({
			currentPosition: newPost
		});

		// If the post we're about to move to already exists in our posts array, then we'll
		// see whether we have a cell height for it. If we do, we can assume we have all the
		// heights for posts before it too, and smoothly scroll to it.
		// If we don't have the post data already or no height for it, then we'll do a full reload
		// of the feed to get to it.
		if (realPostPosition <= this.state.startingOffset + topicData.posts.length - 1) {
			// if the post position is earlier than our starting offset, then we *know* it won't be in the topic feed,
			// so we can shortcut out of here.
			if (realPostPosition >= this.state.startingOffset) {
				const post = topicData.posts[realPostPosition - this.state.startingOffset];
				const postID = parseInt(post.id || 0);

				// If we have a post, and a cell height for the post, then add up the heights and scroll to it
				if (post && postID && !_.isUndefined(this._cellHeights[postID])) {
					const listData = this.state.listData;
					let totalHeight = 0;

					for (let i = 0; i < listData.length; i++) {
						const listItemID = parseInt(listData[i].id);

						if (listItemID && listItemID === postID) {
							break;
						}

						if (!_.isUndefined(this._cellHeights[listItemID])) {
							totalHeight += this._cellHeights[listItemID];
						}
					}

					// Now do the scroll. This is async
					await this._flatList.scrollToOffset({
						offset: totalHeight + this._headerHeight
					});

					return;
				}
			}
		}

		// If we're still here, it means the post we're jumping to doesn't exist in our existing
		// cache. Let's load the specific post from the API.
		this.setState(
			{
				loadingUnseenPosts: true,
				startingOffset: realPostPosition
			},
			() => {
				this.props.data.fetchMore({
					variables: {
						// When infinite loading, we must reset this otherwise the same unread posts will load again
						offsetPosition: "FIRST",
						offsetAdjust: realPostPosition,
						limit: Expo.Constants.manifest.extra.per_page
					},
					updateQuery: (previousResult, { fetchMoreResult }) => {
						// Don't do anything if there were no new items
						if (!fetchMoreResult || fetchMoreResult.forums.topic.posts.length === 0) {
							// Something weird has happened...
							return previousResult;
						}

						// Clear our cell height cache because we're replacing them all
						this.clearCellHeightCache();

						// Set our states
						this.setState(
							{
								loadingUnseenPosts: false,
								earlierPostsAvailable: realPostPosition > 0
							},
							() => {}
						);

						return fetchMoreResult;
					}
				});
			}
		);
	}

	getSnapshotBeforeUpdate(prevProps, prevState) {
		if (prevProps.data.loading && !this.props.data.loading && prevState.listData.length == 0 && this.state.listData.length > 0) {
			LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		}

		return null;
	}

	/**
	 * Set the react-navigation header params to show author/title info based on the data we have
	 *
	 * @return 	void
	 */
	setHeaderParams() {
		if (_.isUndefined(this.props.data) || _.isUndefined(this.props.data.forums) || this.props.data.error) {
			this.props.navigation.setParams({
				showFollowControl: false,
				showShareControl: false,
				isFollowed: false,
				onPressFollow: this.toggleFollowModal,
				onPressShare: this.onPressShare
			});
			return;
		}

		this.props.navigation.setParams({
			author: this.props.data.forums.topic.author,
			title: this.props.data.forums.topic.title,
			ready: true,
			onPressAuthor: this.onPressAuthor
		});

		// If follow controls are available, show them
		if (!this.props.data.forums.topic.passwordProtected && !this.props.data.forums.topic.isArchived && this.props.auth.isAuthenticated) {
			this.props.navigation.setParams({
				showFollowControl: true,
				showShareControl: this.props.data.forums.topic.itemPermissions.canShare || false,
				isFollowed: this.props.data.forums.topic.follow.isFollowing,
				onPressFollow: this.toggleFollowModal,
				onPressShare: this.onPressShare
			});
		}
	}

	/**
	 * Manage several areas that might need to change as we get data:
	 * - setting screen params if the screen loaded without them
	 * - setting the offset, and scrolling to the end of the view if needed
	 * - toggling the 'load earlier posts' button
	 *
	 * @param 	object 	prevProps 	Previous prop values
	 * @param 	object 	prevState 	Previous state values
	 * @return 	void
	 */
	componentDidUpdate(prevProps, prevState) {
		// Update animations if our header has changed
		if (prevState.innerHeaderHeight !== this.state.innerHeaderHeight) {
			this.buildAnimations();
		}

		// If we're loading again, clear our cache of post heights
		if (!prevProps.data.loading && this.props.data.loading) {
			this.clearCellHeightCache();
		}

		if (prevState.currentPosition !== this.state.currentPosition) {
			this.maybeMarkAsRead();
		}

		if ((_.isUndefined(prevProps.data.forums) && !_.isUndefined(this.props.data.forums)) || prevProps.data.forums !== this.props.data.forums) {
			this.setState({
				listData: this.getListData()
			});
		}

		// If we're no longer loading, set the header params
		if (prevProps.data.loading && !this.props.data.loading) {
			this.setHeaderParams();

			if (this._showWalkthrough) {
				this._walkthroughTimeout = setTimeout(() => {
					this.props.start();
				}, 1000);
			}
		}

		const variableProps = this.props.data.variables;

		// Update our offset tracker, but only if we haven't done it before, otherwise
		// we'll replace our offset with the initial offset every time the component updates
		if (
			(prevProps.data.variables.offsetPosition !== "LAST" && variableProps.offsetPosition === "LAST") ||
			(!prevProps.navigation.state.params.showLastComment && this.props.navigation.state.params.showLastComment)
		) {
			this._initialOffsetDone = false;
		}

		// CURRENTPOSITION NOTE:
		// We add 1 here because topics require a first post, meaning offsets/positions returned by the API
		// don't consider the first post as a 'comment'. However, for our app's purposes, we want to consider
		// it when calculating our position in the topic.
		if (!this._initialOffsetDone && !this.props.data.loading && !this.props.data.error) {
			const topicData = this.props.data.forums.topic;

			if (variableProps.offsetPosition == "ID" && topicData.findCommentPosition) {
				// If we're starting at a specific post, then set the offset to that post's position
				this.setState({
					startingOffset: topicData.findCommentPosition,
					currentPosition: Math.min(topicData.postCount, topicData.findCommentPosition + 1) // See CURRENTPOSITION NOTE above this block
				});
				this._initialOffsetDone = true;
			} else if (variableProps.offsetPosition == "UNREAD" && topicData.unreadCommentPosition) {
				// If we're showing by unread, then the offset will be the last unread post position
				this.setState({
					startingOffset: topicData.unreadCommentPosition,
					currentPosition: Math.min(topicData.postCount, topicData.unreadCommentPosition + 1) // See CURRENTPOSITION NOTE above this block
				});
				this._initialOffsetDone = true;
			} else if (this.props.navigation.state.params.showLastComment || (variableProps.offsetPosition == "LAST" && variableProps.offsetAdjust !== 0)) {
				this._initialOffsetDone = true;
				// If we're showing the last post, the offset will be the total post count plus our adjustment
				this.setState({
					reachedEnd: true,
					startingOffset: Math.max(topicData.postCount + variableProps.offsetAdjust, 0),
					currentPosition: Math.min(topicData.postCount, Math.max(topicData.postCount + variableProps.offsetAdjust, 0) + 1)
				});
				this.scrollToEnd();
			}
		}

		// If we've loaded in posts from a different position in the topic, see if we need to scroll to the right place
		if (prevState.loadingUnseenPosts && !this.state.loadingUnseenPosts) {
			if (this.state.startingOffset > 0) {
				setTimeout(() => {
					this._flatList.scrollToOffset({
						offset: this._headerHeight,
						animated: false
					});
				}, 20);
			}
		} else if (prevState.earlierPostsAvailable == null || (prevState.startingOffset !== this.state.startingOffset && !this.state.loadingUnseenPosts)) {
			// Figure out if we need to change the state that determines whether the
			// Load Earlier Posts button shows
			const showEarlierPosts = this.state.startingOffset > 0;

			this.setState({
				earlierPostsAvailable: showEarlierPosts
			});

			// Figure out if we need to scroll to hide the Load Earlier Posts button
			if (!this.props.data.loading && !this.props.data.error) {
				if (showEarlierPosts && !this._aboutToScrollToEnd) {
					this._flatList.scrollToOffset({
						offset: this._headerHeight + LOAD_MORE_HEIGHT,
						animated: false
					});
				}
			}
		}
	}

	/**
	 * Handles infinite loading when user scrolls to end
	 *
	 * @return 	void
	 */
	onEndReached() {
		if (!this.props.data.loading && !this.state.reachedEnd) {
			const offsetAdjust = this.state.startingOffset + this.props.data.forums.topic.posts.length;

			// Don't try loading more if we're already showing everything in the topic
			if (offsetAdjust >= this.props.data.forums.topic.postCount) {
				this.setState({
					reachedEnd: true
				});
				return;
			}

			this.props.data.fetchMore({
				variables: {
					// When infinite loading, we must reset this otherwise the same unread posts will load again
					offsetPosition: "FIRST",
					offsetAdjust,
					limit: Expo.Constants.manifest.extra.per_page
				},
				updateQuery: (previousResult, { fetchMoreResult }) => {
					// Don't do anything if there were no new items
					if (!fetchMoreResult || fetchMoreResult.forums.topic.posts.length === 0) {
						this.setState({
							reachedEnd: true
						});

						return previousResult;
					}

					// Ensure new topic array is unique
					// Since the topic list can change order between loads (due to user activity), it's possible
					// that a topic row will appear twice in our data if we don't check for unique values.
					// This causes a RN duplicate rows error.
					const postArray = [...previousResult.forums.topic.posts, ...fetchMoreResult.forums.topic.posts];
					const posts = _.uniq(postArray, false, post => post.id);

					// Now APPEND the new posts to the existing ones
					const result = Object.assign({}, previousResult, {
						forums: {
							...previousResult.forums,
							topic: {
								...previousResult.forums.topic,
								posts
							}
						}
					});

					return result;
				}
			});
		}
	}

	/**
	 * Loads earlier posts on demand
	 *
	 * @return 	void
	 */
	loadEarlierComments() {
		if (!this.props.data.loading) {
			this.setState({
				loadingEarlierPosts: true
			});

			// Ensure the offset doesn't go below 0
			const offsetAdjust = Math.max(this.state.startingOffset - Expo.Constants.manifest.extra.per_page, 0);

			this.props.data.fetchMore({
				variables: {
					offsetPosition: "FIRST",
					offsetAdjust,
					limit: Expo.Constants.manifest.extra.per_page
				},
				updateQuery: (previousResult, { fetchMoreResult }) => {
					// We use this state to track whether we should show the Load Earlier Posts button
					this.setState({
						earlierPostsAvailable: this.state.startingOffset - Expo.Constants.manifest.extra.per_page > 0,
						loadingEarlierPosts: false,
						startingOffset: offsetAdjust
					});

					// Don't do anything if there wasn't any new items
					if (!fetchMoreResult || fetchMoreResult.forums.topic.posts.length === 0) {
						return previousResult;
					}

					// Now PREPEND the loaded posts to the existing ones
					// Since we're going backwards here, it's possible we're also pulling some of our
					// existing posts. To make sure we only show each post once, we need to ensure
					// the post array contains unique values.
					const postArray = [...fetchMoreResult.forums.topic.posts, ...previousResult.forums.topic.posts];
					const posts = _.uniq(postArray, false, post => post.id);

					const result = Object.assign({}, previousResult, {
						forums: {
							...previousResult.forums,
							topic: {
								...previousResult.forums.topic,
								posts
							}
						}
					});

					return result;
				}
			});
		}
	}

	/**
	 * May execute a mutation to mark the topic as read, depending on whether the user
	 * has scrolled far enough for us to consider it 'read'.
	 *
	 * @return 	void
	 */
	async maybeMarkAsRead() {
		// If we are unread and have viewed the last post...
		if (
			!this.props.data.forums.topic.itemPermissions.canMarkAsRead ||
			!this.props.data.forums.topic.isUnread ||
			this.state.currentPosition < this.props.data.forums.topic.postCount
		) {
			return;
		}

		try {
			const { data } = await this.props.client.mutate({
				mutation: MarkTopicRead,
				variables: {
					id: this.props.data.forums.topic.id
				},
				refetchQueries: ["ForumQuery"],
				optimisticResponse: {
					mutateForums: {
						__typename: "mutate_Forums",
						markTopicRead: {
							__typename: "forums_Topic",
							id: this.props.data.forums.topic.id,
							timeLastRead: this.props.data.forums.topic.timeLastRead,
							unreadCommentPosition: this.props.data.forums.topic.unreadCommentPosition,
							isUnread: false,
							forum: {
								...this.props.data.forums.topic.forum
							}
						}
					}
				}
			});

			console.log(data);
		} catch (err) {
			console.log("Couldn't mark topic as read: " + err);
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
	 * Handle topic sharing
	 *
	 * @return 	void
	 */
	async onPressShare() {
		const topicData = this.props.data.forums.topic;
		const shortShareTitle = Lang.get("share_x", {
			name: topicData.author.name,
			thing: topicData.articleLang.definite
		});

		try {
			const result = await Share.share(
				{
					message: Lang.get("share_x_on_x_at_x", {
						name: topicData.author.name,
						thing: topicData.articleLang.definite,
						title: topicData.title,
						site: this.props.site.settings.board_name
					}),
					url: topicData.url.full
				},
				{
					dialogTitle: shortShareTitle,
					subject: shortShareTitle
				}
			);
		} catch (err) {
			console.warn("Failed to share");
			Alert.alert(Lang.get("error"), Lang.get("error_sharing_content"), [{ text: Lang.get("ok") }], { cancelable: false });
		}
	}

	/**
	 * Return the footer component. Show a spacer by default, but a loading post
	 * if we're fetching more items right now.
	 *
	 * @return 	Component
	 */
	getFooterComponent() {
		// If we're loading more items in
		if (!this.state.reachedEnd && !this.state.loadingEarlierPosts) {
			return <Post loading={true} />;
		}

		return <EndOfComments reachedEnd={this.state.reachedEnd} />;
	}

	/**
	 * Event handler for voting the question up
	 *
	 * @return 	void
	 */
	onVoteQuestionUp() {
		const topicData = this.props.data.forums.topic;

		if (topicData.vote == "UP" || !topicData.canVoteUp) {
			return;
		}

		this.onVoteQuestion("UP");
	}

	/**
	 * Event handler for voting the question down
	 *
	 * @return 	void
	 */
	onVoteQuestionDown() {
		const topicData = this.props.data.forums.topic;

		if (topicData.vote == "DOWN" || !topicData.canVoteDown) {
			return;
		}

		this.onVoteQuestion("DOWN");
	}

	/**
	 * Update the question with the given vote type and optimistically update UI
	 *
	 * @param 	string 		vote 		'UP' or 'DOWN'
	 * @return 	void
	 */
	async onVoteQuestion(vote) {
		const topicData = this.props.data.forums.topic;
		let questionVotes = topicData.questionVotes;

		// If we've already voted, reverse that first
		if (topicData.vote) {
			if (topicData.vote == "UP") {
				questionVotes--;
			} else {
				questionVotes++;
			}
		}

		// Now adjust for this new vote
		questionVotes = questionVotes + (vote == "UP" ? 1 : -1);

		try {
			const { data } = await this.props.client.mutate({
				mutation: VoteQuestion,
				variables: {
					id: this.props.data.forums.topic.id,
					vote
				},
				optimisticResponse: {
					mutateForums: {
						__typename: "mutate_Forums",
						voteQuestion: {
							...this.props.data.forums.topic,
							questionVotes,
							canVoteUp: vote !== "UP",
							canVoteDown: vote !== "DOWN",
							vote
						}
					}
				}
			});
		} catch (err) {
			const error = getErrorMessage(err, TopicViewScreen.errors);
			Alert.alert(Lang.get("error"), error ? error : Lang.get("error_voting_question"), [{ text: Lang.get("ok") }], { cancelable: false });
		}
	}

	/**
	 * Update an answer with the given vote type and optimistically update UI
	 *
	 * @param 	string|int 	id 			Post ID
	 * @param 	string 		vote 		'UP' or 'DOWN'
	 * @return 	void
	 */
	async onVoteAnswer(id, vote) {
		const postData = _.find(this.props.data.forums.topic.posts, post => parseInt(post.id) === parseInt(id));

		if (!postData) {
			Alert.alert(Lang.get("error"), error ? error : Lang.get("error_voting_answer"), [{ text: Lang.get("ok") }], { cancelable: false });
			return;
		}

		let answerVotes = postData.answerVotes;

		// If we've already voted, reverse that first
		if (postData.vote) {
			if (postData.vote == "UP") {
				answerVotes--;
			} else {
				answerVotes++;
			}
		}

		// Now adjust for this new vote
		answerVotes = answerVotes + (vote == "UP" ? 1 : -1);

		try {
			const { data } = await this.props.client.mutate({
				mutation: VoteAnswer,
				variables: {
					id,
					vote
				},
				optimisticResponse: {
					mutateForums: {
						__typename: "mutate_Forums",
						voteAnswer: {
							...postData,
							answerVotes,
							canVoteUp: vote !== "UP",
							canVoteDown: vote !== "DOWN",
							vote
						}
					}
				}
			});
		} catch (err) {
			const error = getErrorMessage(err, TopicViewScreen.errors);
			Alert.alert(Lang.get("error"), error ? error : Lang.get("error_voting_question"), [{ text: Lang.get("ok") }], { cancelable: false });
		}
	}

	/**
	 * Return the header component. Shows locked status, tags, etc.
	 *
	 * @return 	Component
	 */
	getHeaderComponent() {
		const { styles, componentStyles } = this.props;
		const topicData = this.props.data.forums.topic;
		const headerAlignClass = topicData.isQuestion ? styles.leftText : styles.centerText;
		const hidden = topicData.hiddenStatus !== null;
		// @todo language abstraction

		return (
			<ViewMeasure onLayout={this.onHeaderLayout}>
				<ShadowedArea style={[styles.mbStandard]} hidden={hidden}>
					<ViewMeasure onLayout={this.onInnerHeaderLayout} style={[componentStyles.innerHeader, styles.pbExtraWide]}>
						<Animated.View
							style={[styles.flexRow, styles.flexAlignStretch, { opacity: this._titleOpacity || 1, transform: [{ scale: this._titleScale || 1 }] }]}
						>
							{Boolean(topicData.isQuestion) && (
								<View style={styles.flexAlignSelfStart}>
									<QuestionVote
										score={topicData.questionVotes}
										hasVotedUp={topicData.vote == "UP"}
										hasVotedDown={topicData.vote == "DOWN"}
										canVoteUp={topicData.canVoteUp}
										canVoteDown={topicData.canVoteDown}
										downvoteEnabled={this.props.site.settings.forums_questions_downvote}
										onVoteUp={this.onVoteQuestionUp}
										onVoteDown={this.onVoteQuestionDown}
									/>
								</View>
							)}
							<View style={[styles.flexGrow, styles.flexBasisZero, styles.flexAlignSelfCenter, topicData.isQuestion ? styles.prWide : styles.phWide]}>
								<View>
									<Text style={[styles.contentTitle, headerAlignClass, hidden && styles.moderatedTitle]}>{topicData.title}</Text>
									<Text
										onPress={this.onPressAuthor}
										style={[styles.lightText, styles.standardText, headerAlignClass, styles.mtVeryTight, hidden && styles.moderatedLightText]}
									>
										{Lang.get("started_by_x", { name: topicData.author.name })}, {Lang.formatTime(topicData.started, "long")}
									</Text>
								</View>
								{Boolean(topicData.tags.length || topicData.isLocked || topicData.isHot || topicData.isPinned || topicData.isFeatured || hidden) && (
									<View>
										{Boolean(topicData.tags.length) && (
											<TagList centered={!topicData.isQuestion} style={styles.mtTight}>
												{topicData.tags.map(tag => (
													<Tag key={tag.name}>{tag.name}</Tag>
												))}
											</TagList>
										)}
										<View
											style={[
												styles.flexRow,
												styles.flexAlignCenter,
												topicData.isQuestion ? styles.flexJustifyStart : styles.flexJustifyCenter,
												styles.mtTight,
												componentStyles.metaInfo
											]}
										>
											{Boolean(topicData.hiddenStatus === "DELETED") && <TopicStatus style={styles.mrStandard} type="deleted" />}
											{Boolean(topicData.hiddenStatus === "PENDING") && <TopicStatus style={styles.mrStandard} type="unapproved" />}
											{Boolean(topicData.hiddenStatus === "HIDDEN") && <TopicStatus style={styles.mrStandard} type="hidden" />}
											{Boolean(topicData.isArchived) && <TopicStatus style={styles.mrStandard} type="archived" />}
											{Boolean(topicData.isLocked) && <TopicStatus style={styles.mrStandard} type="locked" />}
											{Boolean(topicData.isHot) && <TopicStatus style={styles.mrStandard} type="hot" />}
											{Boolean(topicData.isPinned) && <TopicStatus style={styles.mrStandard} type="pinned" />}
											{Boolean(topicData.isFeatured) && <TopicStatus style={styles.mrStandard} type="featured" />}
										</View>
									</View>
								)}
							</View>
						</Animated.View>
					</ViewMeasure>
				</ShadowedArea>
				{topicData.poll !== null && <PollPreview data={topicData.poll} onPress={this.goToPollScreen} />}
				{this.getLoadPreviousButton()}
			</ViewMeasure>
		);
	}

	/**
	 * Handles navigating to the Poll screen
	 *
	 * @return 	void
	 */
	goToPollScreen() {
		/*this.setState({
			pollModalVisible: !this.state.pollModalVisible
		});*/
		this.props.navigation.navigate("Poll", {
			data: this.props.data.forums.topic.poll,
			itemID: this.props.data.forums.topic.id
		});
	}

	/**
	 * Returns a "Load earlier posts" button, for cases where we're starting the post listing
	 * halfway through (e.g. when user chooses to go to first unread).
	 *
	 * @return 	Component
	 */
	getLoadPreviousButton() {
		if (this.state.earlierPostsAvailable) {
			return <LoadMoreComments loading={this.state.loadingEarlierPosts} onPress={this.loadEarlierComments} label={Lang.get("load_earlier")} />;
		}

		return null;
	}

	/**
	 * Render a post
	 *
	 * @param 	object 	item 		A post object (already transformed by this.buildPostData)
	 * @return 	Component
	 */
	renderItem({ item, index }) {
		const topicData = this.props.data.forums.topic;
		const settings = this.props.site.settings;

		// If this is the unread bar, just return it
		if (item.id === "unread") {
			return <UnreadBar label={Lang.get("unread_posts")} onLayout={this.onPostLayout} />;
		} else if (item.id === "loginPrompt") {
			return (
				<LoginRegisterPrompt
					style={{ marginBottom: 7 }}
					register={settings.allow_reg !== "DISABLED"}
					registerUrl={settings.allow_reg_target || null}
					navigation={this.props.navigation}
					message={Lang.get(settings.allow_reg !== "DISABLED" ? "login_register_prompt_comment" : "login_prompt_comment", {
						siteName: settings.board_name
					})}
					onLayout={this.onPostLayout}
				/>
			);
		}

		const voteControl = this.getAnswerVoteComponent(item);
		const questionHeaderControl = this.getQuestionHeaderComponent(item);
		const additionalPostStyle = this.getAdditionalPostStyles(item);

		return (
			<Post
				data={item}
				key={item.id}
				canReply={topicData.itemPermissions.canComment}
				topic={topicData}
				leftComponent={voteControl}
				topComponent={questionHeaderControl}
				style={additionalPostStyle}
				onLayout={this.onPostLayout}
				position={this.state.startingOffset + index + 1}
				reportTitle={Lang.get("someones_x", {
					name: item.author.name,
					thing: item.articleLang.definiteNoItem
				})}
				shortShareTitle={Lang.get("share_x", {
					name: item.author.name,
					thing: item.articleLang.definiteNoItem
				})}
				shareTitle={Lang.get("share_x_on_x_at_x", {
					name: item.author.name,
					thing: item.articleLang.definiteNoItem,
					title: topicData.title,
					site: settings.board_name
				})}
			/>
		);
	}

	/**
	 * Callback for when the header has a layoutchange
	 * This callback handles the *outer* header height; that is, the header box,
	 * the poll box and the Load Earlier Posts button
	 *
	 * @param 	object 		data
	 * @return 	void
	 */
	onHeaderLayout(data) {
		const { height } = data.measure;
		this._headerHeight = height;
	}

	/**
	 * Callback for when the inner header has a layoutchange
	 * This callback handles the *inner* header height; that is,
	 * just the title/author box
	 *
	 * @param 	object 		data
	 * @return 	void
	 */
	onInnerHeaderLayout(data) {
		const { height: innerHeaderHeight } = data.measure;
		this.setState({ innerHeaderHeight });
	}

	/**
	 * Callback passed to each Post, called when the Post's layout changes
	 * We use this to store the height of each post component, used later when scrolling
	 * to specific posts.
	 *
	 * @param 	object 		data 	{id: the post ID unmounting, height: the post's height}
	 * @return 	void
	 */
	onPostLayout(data) {
		const { height } = data.measure;
		this._cellHeights[data.id] = height;
	}

	/**
	 * Return additional styles to be applied to a Post component for a post
	 *
	 * @param 	object 	post	A post object
	 * @return 	array|null
	 */
	getAdditionalPostStyles(post) {
		const { styles } = this.props;

		if (!this.props.data.forums.topic.isQuestion) {
			return null;
		}

		if (post.isQuestion || post.isBestAnswer) {
			return [styles.mbStandard];
		}
	}

	/**
	 * Return a header component when our topic is a question
	 * Displays "question asked by" or "best answer" string
	 *
	 * @param 	object 	post	A post object
	 * @return 	Component|null
	 */
	getQuestionHeaderComponent(post) {
		if (!this.props.data.forums.topic.isQuestion) {
			return null;
		}

		const { styles } = this.props;

		if (post.isQuestion) {
			return (
				<View style={[styles.mhWide, styles.pbStandard, styles.mbStandard, styles.bBorder, styles.mediumBorder]}>
					<Text style={[styles.standardText, styles.mediumText, styles.text]}>
						{Lang.get("question_asked_by", { name: this.props.data.forums.topic.author.name })}
					</Text>
				</View>
			);
		}

		if (post.isBestAnswer) {
			return (
				<View style={[styles.mhWide, styles.pbStandard, styles.mbStandard, styles.bBorder, styles.mediumBorder]}>
					<Text style={[styles.standardText, styles.mediumText, styles.text]}>{Lang.get("this_is_best_answer")}</Text>
				</View>
			);
		}
	}

	/**
	 * Return a vote control and best answer control if our topic is a question
	 *
	 * @param 	object 	post	A post object
	 * @return 	Component|null
	 */
	getAnswerVoteComponent(post) {
		const topicData = this.props.data.forums.topic;

		if (!topicData.isQuestion || post.isQuestion) {
			return null;
		}

		const { styles } = this.props;

		return (
			<View>
				<QuestionVote
					score={post.answerVotes}
					hasVotedUp={post.vote == "UP"}
					hasVotedDown={post.vote == "DOWN"}
					canVoteUp={post.canVoteUp}
					canVoteDown={post.canVoteDown}
					downvoteEnabled={this.props.site.settings.forums_questions_downvote}
					onVoteUp={this.getQuestionVoteUpHandler(post.id)}
					onVoteDown={this.getQuestionVoteDownHandler(post.id)}
					smaller
				/>

				{Boolean(post.isBestAnswer || topicData.canSetBestAnswer) && (
					<View style={[styles.flexRow, styles.flexJustifyCenter, styles.mvStandard]}>
						<BestAnswer
							setBestAnswer={Boolean(topicData.canSetBestAnswer) && !Boolean(post.isBestAnswer) ? this.getSetBestAnswerHandler(post.id) : null}
							isBestAnswer={post.isBestAnswer}
						/>
					</View>
				)}
			</View>
		);
	}

	/**
	 * Memoization function, stores event handlers for marking a post as best answer
	 *
	 * @param 	number 		id 		Post ID
	 * @return 	function
	 */
	getSetBestAnswerHandler(id) {
		if (_.isUndefined(this._bestAnswerHandlers[id])) {
			this._bestAnswerHandlers[id] = () => this.onSetBestAnswer(id);
		}

		return this._bestAnswerHandlers[id];
	}

	/**
	 * Memoization function, stores event handlers for downvoting an answer
	 *
	 * @param 	number 		id 		Post ID
	 * @return 	function
	 */
	getQuestionVoteDownHandler(id) {
		if (_.isUndefined(this._answerVoteDownHandlers[id])) {
			this._answerVoteDownHandlers[id] = () => this.onVoteAnswer(id, "DOWN");
		}

		return this._answerVoteDownHandlers[id];
	}

	/**
	 * Memoization function, stores event handlers for upvoting an answer
	 *
	 * @param 	number 		id 		Post ID
	 * @return 	function
	 */
	getQuestionVoteUpHandler(id) {
		if (_.isUndefined(this._answerVoteUpHandlers[id])) {
			this._answerVoteUpHandlers[id] = () => this.onVoteAnswer(id, "UP");
		}

		return this._answerVoteUpHandlers[id];
	}

	/**
	 * Event handler for setting a best answer. Prompts user to confirm if an existing post is already
	 * marked as best answer, then calls `this.updateBestAnswer` to execute the change.
	 *
	 * @param 	number 		id 		Post ID to set as best answer
	 * @return 	void
	 */
	onSetBestAnswer(id) {
		const topicData = this.props.data.forums.topic;

		// If the selected post isn't the same as the one that's already best answer, prompt for the change
		if (topicData.hasBestAnswer && parseInt(topicData.bestAnswerID) !== parseInt(id)) {
			Alert.alert(
				Lang.get("replace_best_answer_title"),
				Lang.get("replace_best_answer_text"),
				[{ text: Lang.get("cancel"), onPress: () => console.log("cancel") }, { text: Lang.get("replace"), onPress: () => this.updateBestAnswer(id) }],
				{ cancelable: false }
			);
		} else {
			this.updateBestAnswer(id);
		}
	}

	/**
	 * executes query to set a post as the best answer in a topic
	 *
	 * @param 	number 		id 		Post ID to set as best answer
	 * @return 	void
	 */
	async updateBestAnswer(id) {
		const topicData = this.props.data.forums.topic;
		const newBestAnswer = _.find(topicData.posts, post => parseInt(post.id) === parseInt(id));
		const existingBestAnswer = topicData.hasBestAnswer ? _.find(topicData.posts, post => parseInt(post.id) === parseInt(topicData.bestAnswerID)) : null;

		try {
			const { data } = await this.props.client.mutate({
				mutation: SetBestAnswer,
				variables: {
					id
				},
				optimisticResponse: {
					mutateForums: {
						__typename: "mutate_Forums",
						setBestAnswer: {
							...newBestAnswer,
							isBestAnswer: true
						}
					}
				},
				update: proxy => {
					// So, what's happening here...
					// We need to update both the topic and the existing Best Answer (if one is set) in our local cache so that the UI reflects
					// this change. We do this by writing fragments to the local cache in GraphQL syntax.
					try {
						proxy.writeQuery({
							query: gql`
								query Topic {
									__typename
									forums {
										__typename
										topic(id: ${topicData.id}) {
											id
											__typename
											bestAnswerID
											hasBestAnswer
										}
									}
								}
							`,
							data: {
								__typename: "Query",
								forums: {
									__typename: "forums",
									topic: {
										__typename: "forums_Topic",
										id: topicData.id,
										bestAnswerID: newBestAnswer.id,
										hasBestAnswer: true
									}
								}
							}
						});
					} catch (err) {
						console.log(err);
					}

					if (existingBestAnswer !== null) {
						try {
							proxy.writeQuery({
								query: gql`
									query Post {
										__typename
										forums {
											__typename
											post(id: ${existingBestAnswer.id}) {
												id
												__typename
												isBestAnswer
											}
										}
									}
								`,
								data: {
									__typename: "Query",
									forums: {
										__typename: "forums",
										post: {
											id: existingBestAnswer.id,
											__typename: "forums_Post",
											isBestAnswer: false
										}
									}
								}
							});
						} catch (err) {
							console.log(err);
						}
					}
				}
			});
		} catch (err) {
			console.log("Couldn't set post as best answer: " + err); // @todo error
		}
	}

	/**
	 * Modify our raw posts array to insert components for login prompt, unread bar etc.
	 * This function inserts a dummy object that renderItem() will see to use the correct component
	 *
	 * @return 	array
	 */
	getListData() {
		const topicData = this.props.data.forums.topic;
		const returnedData = [...topicData.posts]; // Need to clone here in case we splice shortly...

		// If they're a guest, insert an item so that a login prompt will show
		// Only if we're at the start of the topic
		if (!this.props.auth.isAuthenticated && !topicData.isArchived && topicData.posts[0].isFirstPost && topicData.itemPermissions.canCommentIfSignedIn) {
			returnedData.splice(1, 0, {
				id: "loginPrompt"
			});
		}

		// Figure out if we need to show the unread bar. Get the index of the first
		// unread item and insert an unread object into our post array.
		if (this.props.auth.isAuthenticated && topicData.unreadCommentPosition && topicData.timeLastRead) {
			let firstUnread = topicData.posts.findIndex(post => post.timestamp > topicData.timeLastRead);

			if (firstUnread !== -1) {
				returnedData.splice(firstUnread, 0, {
					id: "unread" // We need a dummy id for keyExtractor to read
				});
			}
		}

		return returnedData;
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
					area: "topic",
					id: this.props.data.forums.topic.id,
					anonymous: Boolean(followData.anonymous) || false,
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
					area: "topic",
					id: this.props.data.forums.topic.id,
					followID: this.props.data.forums.topic.follow.followID
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
	 * Event handler for tapping the Add Reply bar. Opens reply modal.
	 *
	 * @return 	void
	 */
	addReply() {
		this.props.navigation.navigate("ReplyTopic", {
			topicID: this.props.data.forums.topic.id,
			topicTitle: this.props.data.forums.topic.title
		});
	}

	/**
	 * Return the placeholder text for the reply box, contextulaized to permissions
	 *
	 * @return 	string
	 */
	getReplyPlaceholder() {
		const topicData = this.props.data.forums.topic;
		const { commentInformation } = topicData.itemPermissions;

		if (commentInformation === null) {
			return Lang.get("write_reply");
		}

		return Lang.get(`topic_${commentInformation}`);
	}

	/**
	 * Shows an alert indicating the reason why replying isn't available
	 *
	 * @return 	void
	 */
	showNoReplyMessage() {
		const topicData = this.props.data.forums.topic;
		const { canComment, commentInformation } = topicData.itemPermissions;

		// If we can comment or there's no message to show, leave
		if (canComment || commentInformation == null) {
			return;
		}

		Alert.alert(Lang.get("topic_cannot_reply"), Lang.get(`topic_${commentInformation}`), [{ text: Lang.get("ok") }], { cancelable: false });
	}

	/**
	 * Event handler, called when the FlatList scrolls and the visible posts change.
	 * We need to then figure out the real post position of the visible item and set state to track it.
	 * We can't go by simple index because we may have unread bar/guest login prompt/etc. showing.
	 *
	 * @param 	object 		Callback args. `viewableItems` is an array containing data about each item in the viewport.
	 * @return 	void
	 */
	onViewableItemsChanged({ viewableItems }) {
		// Get an array of visible items that contains only posts
		const postItems = _.reject(viewableItems, item => item.key == "unread" || item.key == "loginPrompt");

		// We may have no posts that are 50% viewable right now
		if (!postItems.length) {
			return;
		}

		// Get the first item, which represents the first post we can see
		const firstItem = _.first(postItems);
		// Get the ID from it, which we'll use to locate the true index from our main post array
		const firstItemID = parseInt(firstItem.item.id);
		// Find the index of this item in our main posts array
		const postIndex = this.props.data.forums.topic.posts.findIndex(post => parseInt(post.id) === firstItemID);

		// Get the true position of this post once offset is considered. +1 since we started with zero-index array.
		let realIndex = this.state.startingOffset + postIndex + 1;

		// Since we don't consider a post the 'current position' unless it's the first completely-visible post on the screen,
		// that causes a problem with the last post - if it's short, the previous post will always be visible, and thus
		// our tracker bar will never get to the end. In that case, we'll check if the last post is visible, and if so,
		// force that as our current position.
		// We're basically repeating the same as above, but for the last post
		const lastItem = _.last(postItems);
		const lastItemID = parseInt(lastItem.item.id);
		const lastPostIndex = this.props.data.forums.topic.posts.findIndex(post => parseInt(post.id) === lastItemID);

		// Now check whether the last post in our viewable array matches the last post of the topic
		if (this.state.startingOffset + lastPostIndex === this.props.data.forums.topic.postCount - 1) {
			realIndex = this.state.startingOffset + lastPostIndex + 1;
		}

		// After all that, set our state which will update the Pager bar
		this.setState({
			currentPosition: Math.min(this.props.data.forums.topic.postCount, realIndex)
		});
	}

	render() {
		const { styles } = this.props;

		// status 3 == fetchMore, status 4 == refreshing
		if ((this.props.data.loading && this.props.data.networkStatus !== 3 && this.props.data.networkStatus !== 4) || this.state.loadingUnseenPosts) {
			return (
				<PlaceholderRepeater repeat={4}>
					<Post loading={true} />
				</PlaceholderRepeater>
			);
		} else if (this.props.data.error) {
			const error = getErrorMessage(this.props.data.error, TopicViewScreen.errors);
			const message = error ? error : Lang.get("topic_view_error");
			return <ErrorBox message={message} />;
		} else {
			const topicData = this.props.data.forums.topic;

			return (
				<View style={styles.flex}>
					<View style={[styles.flex, styles.flexGrow]}>
						<Animated.FlatList
							style={styles.flex}
							ref={flatList => (this._flatList = flatList)}
							extraData={this.props.data.forums.topic}
							keyExtractor={item => item.id}
							ListHeaderComponent={this.getHeaderComponent()}
							ListFooterComponent={this.getFooterComponent()}
							renderItem={this.renderItem}
							initialNumToRender={8}
							data={this.state.listData}
							refreshing={this.props.data.networkStatus == 4}
							onEndReached={this.onEndReached}
							onViewableItemsChanged={this.onViewableItemsChanged}
							viewabilityConfig={this._viewabilityConfig}
							initialScrollIndex={0}
							onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: this._nScroll } } }], { useNativeDriver: true })}
							onScrollEndDrag={this.onScrollEnd}
							onMomentumScrollEnd={this.onScrollEnd}
						/>
						<CopilotStep text="The Pager bar shows your position in the topic. You can tap and drag to jump to another post." order={1} name="pager">
							<Pager
								total={topicData.postCount}
								currentPosition={Math.max(1, this.state.currentPosition)}
								onChange={this.scrollToPost}
								unreadIndicator={topicData.isUnread ? topicData.unreadCommentPosition : false}
							/>
						</CopilotStep>
						{!Boolean(topicData.isArchived) && Boolean(this.props.auth.isAuthenticated) && (
							<FollowModal
								isVisible={this.state.followModalVisible}
								followData={topicData.follow}
								onFollow={this.onFollow}
								onUnfollow={this.onUnfollow}
								close={this.toggleFollowModal}
							/>
						)}
						{topicData.poll !== null && <PollModal isVisible={this.state.pollModalVisible} data={topicData.poll} />}
						{Boolean(topicData.itemPermissions.canComment) && !Boolean(topicData.isArchived) && (
							<ActionBar light>
								<DummyTextInput onPress={this.addReply} placeholder={this.getReplyPlaceholder()} />
							</ActionBar>
						)}
						{((!Boolean(topicData.itemPermissions.canComment) &&
							Boolean(topicData.forum.nodePermissions.canCreate) &&
							topicData.itemPermissions.commentInformation !== null) ||
							Boolean(topicData.isArchived)) && (
							<ActionBar light>
								<TouchableOpacity onPress={this.showNoReplyMessage}>
									<Text style={[styles.text, styles.standardText, styles.lightText]}>{Lang.get("cannot_reply_with_info")}</Text>
								</TouchableOpacity>
							</ActionBar>
						)}
					</View>
				</View>
			);
		}
	}
}

const _componentStyles = {
	innerHeader: {
		paddingTop: 44
	}
};

export default compose(
	connect(state => ({
		app: state.app,
		auth: state.auth,
		site: state.site,
		user: state.user
	})),
	graphql(TopicViewQuery, {
		options: props => {
			let offsetPosition = "FIRST";
			let offsetAdjust = 0;
			let findComment = null;

			if (_.isNumber(props.navigation.state.params.findComment)) {
				offsetPosition = "ID";
				findComment = props.navigation.state.params.findComment;
			} else if (props.navigation.state.params.showLastComment || props.app.settings.contentView == "last") {
				// If we're showing the last comment, we'll load the previous 'page' of posts too
				// via the offsetAdjust arg
				offsetPosition = "LAST";
				offsetAdjust = Expo.Constants.manifest.extra.per_page * -1;
			} else {
				if (props.app.settings.contentView == "unread") {
					offsetPosition = "UNREAD";
				}

				offsetAdjust = props.navigation.state.params.offsetAdjust || 0;
			}

			return {
				notifyOnNetworkStatusChange: true,
				fetchPolicy: "network-only",
				variables: {
					id: props.navigation.state.params.id,
					limit: Expo.Constants.manifest.extra.per_page,
					offsetPosition,
					offsetAdjust,
					findComment
				}
			};
		}
	}),
	withApollo,
	copilot({
		stepNumberComponent: View,
		tooltipComponent: Tooltip
	}),
	withTheme(_componentStyles)
)(TopicViewScreen);
