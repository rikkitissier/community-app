import React, { Component } from "react";
import { Text, Image, View, StyleSheet, TouchableHighlight } from "react-native";
import { compose } from "react-apollo";
import { connect } from "react-redux";
import { withNavigation } from "react-navigation";

import Lang from "../../utils/Lang";
import { PlaceholderElement, PlaceholderContainer } from "../../ecosystems/Placeholder";
import Time from "../../atoms/Time";
import TopicInfo from "./TopicInfo";
import QuestionInfo from "./QuestionInfo";
import TopicStatus from "../../atoms/TopicStatus";
import UserPhoto from "../../atoms/UserPhoto";
import ContentRow from "../../ecosystems/ContentRow";
import { withTheme } from "../../themes";

class TopicRow extends Component {
	constructor(props) {
		super(props);
		this.onPress = this.onPress.bind(this);
	}

	/**
	 * Return the placeholder component structure
	 *
	 * @return 	Component
	 */
	loadingComponent() {
		const { componentStyles } = this.props;

		return (
			<ContentRow withSpace>
				<PlaceholderContainer height={48} style={componentStyles.topicRowLoading}>
					<PlaceholderElement width="80%" height={15} top={4} />
					<PlaceholderElement width="70%" height={12} top={26} />
					<PlaceholderElement circle radius={30} right={0} top={0} />
				</PlaceholderContainer>
				<PlaceholderContainer height={20} style={componentStyles.topicStatusesLoading}>
					<PlaceholderElement width="30%" height={14} />
				</PlaceholderContainer>
			</ContentRow>
		);
	}

	/**
	 * Event handler for tapping on the topic row
	 *
	 * @return 	void
	 */
	onPress() {
		this.props.navigation.navigate("TopicView", {
			id: this.props.data.id,
			title: this.props.data.title,
			author: this.props.data.author,
			posts: this.props.data.replies,
			started: this.props.data.started
		});
	}

	render() {
		const { styles, componentStyles } = this.props;

		if (this.props.loading) {
			return this.loadingComponent();
		}

		// Only show as unread if we're a member and unread flag is true
		const showAsUnread = this.props.auth.isAuthenticated && this.props.data.unread;
		const InfoComponent = this.props.data.isQuestion ? QuestionInfo : TopicInfo;
		const hidden = this.props.data.hiddenStatus !== null;

		return (
			<ContentRow withSpace hidden={hidden} unread={showAsUnread} onPress={this.props.onPress || this.onPress}>
				<InfoComponent data={this.props.data} showCategory={this.props.showCategory} showAsUnread={showAsUnread} rowStyles={componentStyles} />
				<View style={[componentStyles.topicStatusesWrap, hidden ? componentStyles.topicStatusesWrapHidden : null]}>
					<View style={componentStyles.topicMeta}>
						{Boolean(this.props.data.hiddenStatus === "DELETED") && (
							<TopicStatus style={componentStyles.topicStatus} textStyle={componentStyles.topicStatusesText} type="deleted" />
						)}
						{Boolean(this.props.data.hiddenStatus === "PENDING") && (
							<TopicStatus style={componentStyles.topicStatus} textStyle={componentStyles.topicStatusesText} type="unapproved" />
						)}
						{Boolean(this.props.data.hiddenStatus === "HIDDEN") && (
							<TopicStatus style={componentStyles.topicStatus} textStyle={componentStyles.topicStatusesText} type="hidden" />
						)}
						{Boolean(this.props.data.isHot) && <TopicStatus style={componentStyles.topicStatus} textStyle={componentStyles.topicStatusesText} type="hot" />}
						{Boolean(this.props.data.isPinned) && (
							<TopicStatus style={componentStyles.topicStatus} textStyle={componentStyles.topicStatusesText} type="pinned" />
						)}
						{Boolean(this.props.data.isFeatured) && (
							<TopicStatus style={componentStyles.topicStatus} textStyle={componentStyles.topicStatusesText} type="featured" />
						)}

						<Time
							style={[
								componentStyles.topicStatusesText,
								componentStyles.topicMetaText,
								componentStyles.lastPostTime,
								hidden ? componentStyles.topicMetaTextHidden : null
							]}
							timestamp={this.props.data.lastPostDate}
						/>
						<Text style={[componentStyles.topicStatusesText, componentStyles.topicMetaText, hidden ? componentStyles.topicMetaTextHidden : null]}>
							{Lang.pluralize(Lang.get("replies"), Lang.formatNumber(this.props.data.replies))}
						</Text>
					</View>
					<View style={[styles.flexRow, componentStyles.userPhotos]}>
						<UserPhoto url={this.props.data.author.photo} size={32} />
						{this.props.data.author.id !== this.props.data.lastPostAuthor.id && (
							<UserPhoto url={this.props.data.lastPostAuthor.photo} size={32} style={componentStyles.lastPostAuthor} />
						)}
					</View>
				</View>
			</ContentRow>
		);
	}
}

const _componentStyles = styleVars => ({
	// Loading styles
	topicRowLoading: {
		paddingLeft: 15,
		paddingRight: 15,
		paddingVertical: 10
	},
	topicStatusesLoading: {
		backgroundColor: styleVars.contentRowTint,
		height: 32,
		paddingHorizontal: 15,
		paddingVertical: 8
	},

	// Regular styles
	topicRowInner: {
		paddingLeft: 15,
		paddingRight: 16,
		paddingVertical: 10,
		flexDirection: "row",
		justifyContent: "space-between",
		alignContent: "stretch"
	},
	/*topicRowInnerWithImage: {
		paddingRight: 90
	},*/
	topicInfo: {
		flex: 1,
		paddingTop: 4,
		paddingRight: 20
	},
	topicIcon: {
		marginTop: 5,
		marginRight: 4,
		alignSelf: "flex-start"
	},
	lockedIcon: {
		marginTop: 1,
		marginRight: 4,
		alignSelf: "center",
		width: 12,
		height: 12
	},
	topicTitle: {
		marginBottom: 2,
		flexDirection: "row"
	},
	topicTitleText: {
		fontSize: 17,
		fontWeight: "600",
		color: "#000"
	},
	topicSnippet: {
		fontSize: 15,
		marginBottom: 4
	},
	lastPoster: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
		marginRight: styleVars.spacing.tight
	},
	lastPostTime: {
		marginRight: styleVars.spacing.wide
	},
	lastPosterPhoto: {
		marginRight: styleVars.spacing.veryTight
	},
	topicStatusesWrap: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: styleVars.contentRowTint,
		height: 32,
		paddingHorizontal: 15
	},
	topicStatus: {
		marginRight: styleVars.spacing.wide
	},
	topicStatusesText: {
		fontSize: 13,
		color: styleVars.lightText
	},
	topicStatusesWrapHidden: {
		backgroundColor: styleVars.moderatedBackground.medium
	},
	topicMeta: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center"
	},
	topicMetaText: {
		color: styleVars.lightText
	},
	topicMetaTextHidden: {
		color: styleVars.moderatedText.light
	},
	repliesIcon: {
		width: 14,
		height: 14,
		tintColor: styleVars.lightText,
		marginRight: styleVars.spacing.veryTight,
		opacity: 0.5
	},
	thumbnail: {
		width: 75,
		position: "absolute",
		right: 8,
		top: 8,
		bottom: 8
	},
	thumbnailImage: {
		...StyleSheet.absoluteFillObject
	},
	userPhotos: {
		marginTop: -12
	},
	lastPostAuthor: {
		marginLeft: -8
	}
});

export default compose(
	withNavigation,
	connect(state => ({
		auth: state.auth
	})),
	withTheme(_componentStyles)
)(TopicRow);
