import React, { Component } from "react";
import { Button, Image, Alert, Text, View, StyleSheet, TouchableHighlight, TouchableOpacity, Share, Clipboard } from "react-native";
import Modal from "react-native-modal";
import ActionSheet from "react-native-actionsheet";
import gql from "graphql-tag";
import { graphql, compose } from "react-apollo";
import { connect } from "react-redux";
import * as Animatable from "react-native-animatable";
import { withNavigation } from "react-navigation";
import _ from "underscore";

import Lang from "../../utils/Lang";
import { PlaceholderElement, PlaceholderContainer } from "../../ecosystems/Placeholder";
import { pushToast } from "../../redux/actions/app";
import { WhoReactedModal, WhoReactedFragment } from "../../ecosystems/Reaction";
import ShadowedArea from "../../atoms/ShadowedArea";
import ViewMeasure from "../../atoms/ViewMeasure";
import UserPhoto from "../../atoms/UserPhoto";
import PostControls from "../../atoms/PostControls";
import PostControl from "../../atoms/PostControl";
import RichTextContent from "../../ecosystems/RichTextContent";
import Reaction from "../../atoms/Reaction";
import ReactionModal from "../../atoms/ReactionModal";
import { IgnoreUserModal } from "../../ecosystems/Ignore";
import CommentFlag from "../../atoms/CommentFlag";
import Time from "../../atoms/Time";
import getErrorMessage from "../../utils/getErrorMessage";
import PostFragment from "./PostFragment";
import { withTheme } from "../../themes";
import icons from "../../icons";

const PostReactionMutation = gql`
	mutation PostReactionMutation($postID: ID!, $reactionID: Int, $removeReaction: Boolean) {
		mutateForums {
			postReaction(postID: $postID, reactionID: $reactionID, removeReaction: $removeReaction) {
				...PostFragment
			}
		}
	}
	${PostFragment}
`;

const WhoReactedQuery = gql`
	query WhoReactedQuery($id: ID!, $reactionId: Int) {
		app: forums {
			type: post(id: $id) {
				reputation {
					whoReacted(id: $reactionId) {
						...WhoReactedFragment
					}
				}
			}
		}
	}
	${WhoReactedFragment}
`;

const ReportPostMutation = gql`
	mutation ReportPostMutation($id: ID!, $reason: Int, $additionalInfo: String) {
		mutateForums {
			reportPost(id: $id, reason: $reason, additionalInfo: $additionalInfo) {
				...PostFragment
			}
		}
	}
	${PostFragment}
`;

const RevokeReportMutation = gql`
	mutation RevokeReportMutation($id: ID!, $reportID: ID!) {
		mutateForums {
			revokePostReport(id: $id, reportID: $reportID) {
				...PostFragment
			}
		}
	}
	${PostFragment}
`;

class Post extends Component {
	constructor(props) {
		super(props);
		this.state = {
			reactionModalVisible: false,
			whoReactedModalVisible: false,
			whoReactedCount: 0,
			whoReactedReaction: 0,
			whoReactedImage: "",
			ignoreOverride: false,
			ignoreModalVisible: false
		};
		this.onPressReaction = this.onPressReaction.bind(this);
		this.onPressProfile = this.onPressProfile.bind(this);
		this.hideWhoReactedModal = this.hideWhoReactedModal.bind(this);
		this.onPressReply = this.onPressReply.bind(this);
		this.hideReactionModal = this.hideReactionModal.bind(this);
		this.onLongPressReputation = this.onLongPressReputation.bind(this);
		this.onPressReputation = this.onPressReputation.bind(this);
		this.onReactionPress = this.onReactionPress.bind(this);
		this.onPressPostDots = this.onPressPostDots.bind(this);
		this.onPressIgnoredPost = this.onPressIgnoredPost.bind(this);
		this.onShare = this.onShare.bind(this);
		this.actionSheetPress = this.actionSheetPress.bind(this);
		this.hideIgnoreModal = this.hideIgnoreModal.bind(this);
	}

	/**
	 * GraphQL error types
	 */
	static errors = {
		NO_POST: Lang.get("no_post")
	};

	//====================================================================
	// LOADING
	/**
	 * Return the loading placeholder
	 *
	 * @return 	Component
	 */
	loadingComponent() {
		const { styles, componentStyles } = this.props;

		return (
			<ShadowedArea style={[componentStyles.post, styles.pWide, styles.mbVeryTight]}>
				<PlaceholderContainer height={40}>
					<PlaceholderElement circle radius={40} left={0} top={0} />
					<PlaceholderElement width={160} height={15} top={0} left={50} />
					<PlaceholderElement width={70} height={14} top={23} left={50} />
				</PlaceholderContainer>
				<PlaceholderContainer height={100} style={styles.mvWide}>
					<PlaceholderElement width="100%" height={12} />
					<PlaceholderElement width="70%" height={12} top={20} />
					<PlaceholderElement width="82%" height={12} top={40} />
					<PlaceholderElement width="97%" height={12} top={60} />
				</PlaceholderContainer>
			</ShadowedArea>
		);
	}

	//====================================================================
	// ACTION SHEET CONFIG

	/**
	 * Handle tapping an action sheet item
	 *
	 * @return 	void
	 */
	actionSheetPress(i) {
		if (i === 1) {
			Clipboard.setString(this.props.data.url.full);

			this.props.dispatch(
				pushToast({
					message: Lang.get("copied_permalink")
				})
			);
		} else if (i === 2) {
			if (this.props.data.author.canBeIgnored && this.props.data.author.id && this.props.data.author.id !== this.props.user.id) {
				this.showIgnoreModal();
			} else if (this.props.data.commentPermissions.canShare) {
				this.onShare();
			} else {
				this.onReport();
			}
		} else if (i === 3) {
			if (this.props.data.commentPermissions.canShare) {
				this.onShare();
			} else {
				this.onReport();
			}
		} else if (i > 2) {
			this.onReport();
		}
	}

	/**
	 * Return the options to be shown in the action sheet
	 *
	 * @return 	array
	 */
	actionSheetOptions() {
		const options = [Lang.get("cancel")];

		options.push(Lang.get("copy_permalink"));

		if (this.props.data.author.canBeIgnored && this.props.data.author.id && this.props.data.author.id !== this.props.user.id) {
			if (this.props.data.isIgnored) {
				options.push(Lang.get("unignore", { name: this.props.data.author.name }));
			} else {
				options.push(Lang.get("ignore", { name: this.props.data.author.name }));
			}
		}
		if (this.props.data.commentPermissions.canShare) {
			options.push(Lang.get("share"));
		}
		if (this.props.data.commentPermissions.canReportOrRevoke) {
			options.push(Lang.get("report"));
		}

		return options;
	}

	/**
	 * Return the index of the 'cancel' option
	 *
	 * @return 	number
	 */
	actionSheetCancelIndex() {
		return 0;
	}

	//====================================================================

	/**
	 * Show the ignore user modal screen
	 *
	 * @return 	void
	 */
	showIgnoreModal() {
		this.setState({
			ignoreModalVisible: true
		});
	}

	/**
	 * Hide the ignore user modal screen
	 *
	 * @return 	void
	 */
	hideIgnoreModal() {
		this.setState({
			ignoreModalVisible: false
		});
	}

	/**
	 * Handle tapping a reaction count
	 *
	 * @param 	number 		reactionID 		ID of tapped reaction
	 * @return 	void
	 */
	onPressReaction(reaction) {
		console.log(reaction);
		this.setState({
			whoReactedModalVisible: true,
			whoReactedReaction: reaction.reactionId,
			whoReactedCount: reaction.count || 0,
			whoReactedImage: reaction.image
		});
	}

	/**
	 * Hide the Who Reacted modal
	 *
	 * @return 	void
	 */
	hideWhoReactedModal() {
		this.setState({
			whoReactedModalVisible: false
		});
	}

	/**
	 * Called onLongPress on the react button; trigger the modal
	 *
	 * @return 	void
	 */
	showReactionModal() {
		this.setState({
			reactionModalVisible: true
		});
	}

	/**
	 * This method is passed as a callback into the reaction modal, to allow it
	 * to close itself.
	 *
	 * @return 	void
	 */
	hideReactionModal() {
		this.setState({
			reactionModalVisible: false
		});
	}

	/**
	 * Render the PostControl for the reaction button
	 *
	 * @return 	Component
	 */
	getReputationButton() {
		if (!this.props.data.reputation.canReact) {
			return null;
		}

		if (this.props.data.reputation.hasReacted) {
			return (
				<PostControl
					testId="repButton"
					image={this.props.data.reputation.givenReaction.image}
					label={this.props.data.reputation.givenReaction.name}
					selected
					onPress={this.onPressReputation}
					onLongPress={this.onLongPressReputation}
				/>
			);
		} else {
			return (
				<PostControl
					testId="repButton"
					image={icons.HEART}
					label={this.props.data.reputation.defaultReaction.name}
					onPress={this.onPressReputation}
					onLongPress={this.onLongPressReputation}
				/>
			);
		}
	}

	/**
	 * Handle long press on rep button. Only do something if we aren't using
	 * like mode
	 *
	 * @return 	void
	 */
	onLongPressReputation() {
		if (this.props.data.reputation.isLikeMode) {
			return null;
		}

		return this.showReactionModal();
	}

	/**
	 * Handle regular press on reputation. Apply our default rep if not already reacted,
	 * otherwise remove current rep
	 *
	 * @return 	void
	 */
	onPressReputation() {
		if (this.props.data.reputation.hasReacted) {
			this.removeReaction();
		} else {
			this.onReactionPress(this.props.data.reputation.defaultReaction.id);
		}
	}

	/**
	 * A callback method for removing a reaction from the post
	 * Calls a mutation to update the user's choice of reaction.
	 *
	 * @return 	void
	 */
	async removeReaction() {
		try {
			await this.props.mutate({
				variables: {
					postID: this.props.data.id,
					removeReaction: true
				},
				// This is a little difficult to understand, but basically we must return a data structure
				// in *exactly* the same format that the server will send us. That means we have to manually
				// specify the __typenames too where they don't already exist in the fetched data.
				optimisticResponse: {
					mutateForums: {
						__typename: "mutate_Forums",
						postReaction: {
							...this.props.data,
							reputation: {
								...this.props.data.reputation,
								hasReacted: false,
								givenReaction: null
							}
						}
					}
				}
			});
		} catch (err) {
			const errorMessage = getErrorMessage(err, Post.errors);
			Alert.alert(Lang.get("error"), Lang.get("error_remove_reaction"), [{ text: Lang.get("ok") }], { cancelable: false });
		}
	}

	/**
	 * A callback method passed into the reaction modal to handle tapping a reaction choice.
	 * Calls a mutation to update the user's choice of reaction.
	 *
	 * @param 	number 		reaction 		ID of selected reaction
	 * @return 	void
	 */
	async onReactionPress(reaction) {
		// Get the reaction object from available reactions
		const givenReaction = _.find(this.props.data.reputation.availableReactions, function(type) {
			return type.id === reaction;
		});

		try {
			await this.props.mutate({
				variables: {
					postID: this.props.data.id,
					reactionID: parseInt(reaction)
				},
				// This is a little difficult to understand, but basically we must return a data structure
				// in *exactly* the same format that the server will send us. That means we have to manually
				// specify the __typenames too where they don't already exist in the fetched data.
				optimisticResponse: {
					mutateForums: {
						__typename: "mutate_Forums",
						postReaction: {
							...this.props.data,
							reputation: {
								...this.props.data.reputation,
								hasReacted: true,
								givenReaction: {
									__typename: "core_Reaction",
									id: givenReaction.id,
									name: givenReaction.name,
									image: givenReaction.image
								}
							}
						}
					}
				}
			});
		} catch (err) {
			console.log(err);
			// @todo abstract/improve errors
			const errorMessage = getErrorMessage(err, Post.errors);
			Alert.alert(Lang.get("error"), Lang.get("error_reacting"), [{ text: Lang.get("ok") }], { cancelable: false });
		}
	}

	/**
	 * On update, check whether our reaction count has changed. If so, animate the reaction wrap in
	 *
	 * @return 	void
	 */
	componentDidUpdate(prevProps) {
		if (!this.props.loading) {
			if (prevProps.data.reputation.reactions.length == 0 && this.props.data.reputation.reactions.length !== 0) {
				this._reactionWrap.fadeInRight(200);
			}
		}
	}

	/**
	 * Handler for tapping the author to go to profile
	 *
	 * @return 	void
	 */
	onPressProfile() {
		this.props.navigation.navigate("Profile", {
			id: this.props.data.author.id,
			name: this.props.data.author.name,
			photo: this.props.data.author.photo
		});
	}

	/**
	 * Handler for tapping the Reply button
	 *
	 * @return 	void
	 */
	onPressReply() {
		this.props.navigation.navigate("ReplyTopic", {
			topicID: this.props.topic.id,
			quotedPost: this.props.data
		});
	}

	/**
	 * Handler for tapping ... in a post for more options
	 *
	 * @return 	void
	 */
	onPressPostDots() {
		this._actionSheet.show();
	}

	/**
	 * Handler for showing/hiding an ignored post
	 *
	 * @return 	void
	 */
	onPressIgnoredPost() {
		this.setState({
			ignoreOverride: !this.state.ignoreOverride
		});
	}

	/**
	 * Handles launching the share dialog
	 *
	 * @return 	void
	 */
	async onShare() {
		try {
			const result = await Share.share(
				{
					message: this.props.shareTitle,
					url: this.props.data.url.full
				},
				{
					dialogTitle: this.props.shortShareTitle || "",
					subject: this.props.shortShareTitle || ""
				}
			);
		} catch (err) {
			console.warn("Failed to share");
			Alert.alert(Lang.get("error"), Lang.get("error_sharing_content"), [{ text: Lang.get("ok") }], { cancelable: false });
		}
	}

	/**
	 * Handles launching the share dialog
	 *
	 * @return 	void
	 */
	onReport() {
		// @todo language
		this.props.navigation.navigate("ReportContent", {
			id: this.props.data.id,
			contentTitle: this.props.topic.title,
			thingTitle: this.props.reportTitle,
			reportData: this.props.data.reportStatus,
			reportMutation: ReportPostMutation,
			revokeReportMutation: RevokeReportMutation
		});
	}

	/**
	 * Render the bar that indicates this post is ignored
	 *
	 * @return 	Component
	 */
	renderIgnoreBar() {
		const { styles } = this.props;

		return (
			<ShadowedArea style={this.state.ignoreOverride ? styles.lightBackground : null}>
				<TouchableOpacity style={[styles.flexRow, styles.flexJustifyBetween, styles.pvStandard, styles.phWide]} onPress={this.onPressIgnoredPost}>
					<Text style={[styles.standardText, styles.veryLightText]}>{Lang.get("ignoring_user")}</Text>
					<Text style={[styles.standardText, styles.accentText]}>{Lang.get(this.state.ignoreOverride ? "hide" : "show")}</Text>
				</TouchableOpacity>
			</ShadowedArea>
		);
	}

	/**
	 * Render the corner 'highlighted' badge if necessary
	 *
	 * @return 	Component|null
	 */
	renderCommentFlag() {
		if (!this.props.site.settings.reputation_enabled || !this.props.site.settings.reputation_highlight) {
			return null;
		}

		if (this.props.data.reputation.reactionCount >= this.props.site.settings.reputation_highlight) {
			return <CommentFlag />;
		}

		return null;
	}

	/**
	 * Render a message explaining the post is hidden
	 *
	 * @return 	Component|null
	 */
	renderHiddenMessage() {
		const { styles, componentStyles } = this.props;
		const data = this.props.data;

		if (data.hiddenStatus === null) {
			return null;
		}

		const statuses = {
			HIDDEN: [Lang.get("status_hidden"), Lang.get("status_hidden_desc"), icons.HIDDEN],
			DELETED: [Lang.get("status_deleted"), Lang.get("status_deleted_desc"), icons.CROSS_CIRCLE_SOLID],
			PENDING: [Lang.get("status_unapproved"), Lang.get("status_unapproved_desc"), icons.PENDING]
		};

		return (
			<View style={[styles.moderatedBackground, styles.mtWide, styles.pWide, styles.flexRow, componentStyles.hiddenMessage]}>
				<Image source={statuses[data.hiddenStatus][2]} resizeMode="contain" style={componentStyles.hiddenMessageIcon} />
				<View style={[styles.flexGrow, styles.flexBasisZero, styles.mlTight]}>
					<Text style={[styles.contentText, styles.mediumText, styles.moderatedTitle]}>{statuses[data.hiddenStatus][0]}</Text>
					<Text style={[styles.standardText, styles.moderatedText]}>{statuses[data.hiddenStatus][1]}</Text>
				</View>
			</View>
		);
	}

	isIgnored() {
		const postData = this.props.data;

		if (!postData.author.id || postData.author.id === this.props.user.id || !postData.author.canBeIgnored || !postData.author.ignoreStatus.length) {
			return false;
		}

		// Otherwise figure out if posts are ignored
		const topicsIgnored = postData.author.ignoreStatus.find(type => type.type === "topics");

		if (!_.isUndefined(topicsIgnored)) {
			return topicsIgnored.isBeingIgnored;
		}

		return false;
	}

	render() {
		const { styles, componentStyles } = this.props;
		let content;

		if (this.props.loading) {
			return this.loadingComponent();
		}

		const postData = this.props.data;

		if (this.isIgnored() && !this.state.ignoreOverride) {
			content = <View style={styles.mbVeryTight}>{this.renderIgnoreBar()}</View>;
		} else {
			const repButton = this.getReputationButton();
			// <Text>{this.props.position}</Text>

			content = (
				<ViewMeasure onLayout={this.props.onLayout} id={parseInt(this.props.data.id)}>
					<View style={styles.mbVeryTight}>
						{this.isIgnored() && this.state.ignoreOverride && this.renderIgnoreBar()}
						<ShadowedArea style={[styles.pvWide, componentStyles.post, this.props.style]}>
							{this.props.topComponent}
							<View style={styles.flexRow}>
								{this.props.leftComponent}
								<View style={[this.props.leftComponent ? styles.mrWide : styles.mhWide, styles.flexBasisZero, styles.flexGrow]}>
									<View style={[styles.flexRow, styles.flexAlignStart]} testId="postAuthor">
										<TouchableOpacity style={styles.flex} onPress={postData.author.id ? this.onPressProfile : null}>
											<View style={[styles.flex, styles.flexRow, styles.flexAlignStart]}>
												<UserPhoto url={postData.author.photo} online={postData.author.isOnline || null} size={36} />
												<View style={[styles.flexColumn, styles.flexJustifyCenter, styles.mlStandard]}>
													<Text style={styles.itemTitle}>{postData.author.name}</Text>
													<Time style={[styles.standardText, styles.lightText]} timestamp={postData.timestamp} format="long" />
												</View>
											</View>
										</TouchableOpacity>
										{Boolean(postData.commentPermissions.canShare || postData.commentPermissions.canReportOrRevoke) && (
											<TouchableOpacity style={styles.flexAlignSelfStart} onPress={this.onPressPostDots}>
												<Image style={[styles.lightImage, componentStyles.postMenu]} resizeMode="contain" source={icons.DOTS} />
											</TouchableOpacity>
										)}
									</View>
									{Boolean(postData.hiddenStatus !== null) && this.renderHiddenMessage()}
									<View style={styles.mvWide}>
										<RichTextContent>{postData.content.original}</RichTextContent>
										<Animatable.View ref={r => (this._reactionWrap = r)}>
											{Boolean(postData.reputation.reactions.length) && (
												<View style={[styles.mtWide, styles.flexRow, styles.flexJustifyEnd, styles.flexWrap]} testId="reactionList">
													{postData.reputation.reactions.map(reaction => {
														return (
															<Reaction
																style={styles.mlStandard}
																key={reaction.id}
																id={reaction.id}
																reactionId={reaction.reactionId}
																image={reaction.image}
																count={reaction.count}
																onPress={postData.reputation.canViewReps ? this.onPressReaction : null}
															/>
														);
													})}
												</View>
											)}
										</Animatable.View>
									</View>
								</View>
							</View>
							{Boolean(repButton || this.props.canReply) && (
								<PostControls style={styles.mhWide}>
									{Boolean(this.props.canReply) && postData.hiddenStatus === null && (
										<PostControl testId="replyButton" image={icons.QUOTE} label={Lang.get("quote")} onPress={this.onPressReply} />
									)}
									{repButton}
								</PostControls>
							)}
							<ReactionModal
								visible={this.state.reactionModalVisible}
								closeModal={this.hideReactionModal}
								reactions={postData.reputation.availableReactions}
								onReactionPress={this.onReactionPress}
							/>
							<WhoReactedModal
								visible={this.state.whoReactedModalVisible}
								close={this.hideWhoReactedModal}
								expectedCount={this.state.whoReactedCount}
								reactionImage={this.state.whoReactedImage}
								query={WhoReactedQuery}
								variables={{
									id: postData.id,
									reactionId: parseInt(this.state.whoReactedReaction)
								}}
							/>
							{this.renderCommentFlag()}
						</ShadowedArea>
					</View>
				</ViewMeasure>
			);
		}

		return (
			<React.Fragment>
				{content}
				<ActionSheet
					ref={o => (this._actionSheet = o)}
					title={Lang.get("post_options")}
					options={this.actionSheetOptions()}
					cancelButtonIndex={this.actionSheetCancelIndex()}
					onPress={this.actionSheetPress}
				/>
				{postData.author.canBeIgnored && postData.author.id && postData.author.id !== this.props.user.id && (
					<IgnoreUserModal
						member={postData.author.id}
						memberName={postData.author.name}
						ignoreTypes={postData.author.ignoreStatus}
						visible={this.state.ignoreModalVisible}
						close={this.hideIgnoreModal}
					/>
				)}
			</React.Fragment>
		);
	}
}

const _componentStyles = styleVars => ({
	post: {
		//padding: styleVars.spacing.wide,
		paddingBottom: 0
	},
	postMenu: {
		width: 24,
		height: 24,
		opacity: 0.5
	},
	hiddenMessage: {
		marginHorizontal: styleVars.spacing.wide * -1
	},
	hiddenMessageIcon: {
		width: 14,
		height: 14,
		tintColor: styleVars.moderatedText.title,
		marginTop: 2
	}
});

export default compose(
	graphql(PostReactionMutation),
	withNavigation,
	connect(state => ({
		site: state.site,
		user: state.user
	})),
	withTheme(_componentStyles)
)(Post);

export { Post as TestPost }; // For test runner only
