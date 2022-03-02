import React, { Component } from "react";
import { Text, Image, View, StyleSheet, TouchableHighlight, Alert } from "react-native";
import Swipeable from "react-native-swipeable";
import { graphql, compose, withApollo } from "react-apollo";
import gql from "graphql-tag";
import { connect } from "react-redux";
import { withNavigation } from "react-navigation";
import _ from "underscore";

import ForumItemFragment from "./ForumItemFragment";
import Lang from "../../utils/Lang";
import ContentRow from "../../ecosystems/ContentRow";
import { PlaceholderContainer, PlaceholderElement } from "../../ecosystems/Placeholder";
import ForumIcon from "../../atoms/ForumIcon";
import LastPostInfo from "../../ecosystems/LastPostInfo";
import { withTheme } from "../../themes";
import icons from "../../icons";

const MarkForumRead = gql`
	mutation MarkForumRead($id: ID!) {
		mutateForums {
			markForumRead(id: $id) {
				...ForumItemFragment
			}
		}
	}
	${ForumItemFragment}
`;

class ForumItem extends Component {
	constructor(props) {
		super(props);
		this._swipeable = null;
		this._markReadTimeout = null;
		this.onPress = this.onPress.bind(this);
		this.markForumRead = this.markForumRead.bind(this);
	}

	componentWillUnmount() {
		clearTimeout(this._markReadTimeout);
	}

	/**
	 * Event handler for tappig a forum row
	 *
	 * @param 	object 	section 	The section we're rendering
	 * @return 	Component|null
	 */
	onPress() {
		this.props.navigation.navigate({
			routeName: "TopicList",
			params: {
				id: this.props.data.id,
				title: this.props.data.name,
				subtitle: Lang.pluralize(Lang.get("topics"), Lang.formatNumber(this.props.data.topicCount))
			},
			key: `forum_${this.props.data.id}`
		});
	}

	markForumRead() {
		this._swipeable.recenter();
		this._markReadTimeout = setTimeout(async () => {
			try {
				await this.props.client.mutate({
					mutation: MarkForumRead,
					variables: {
						id: this.props.data.id
					},
					optimisticResponse: {
						mutateForums: {
							__typename: "mutate_Forums",
							markForumRead: {
								...this.props.data,
								subforums: _.isArray(this.props.data.subforums) ? this.props.data.subforums.slice() : null,
								hasUnread: false
							}
						}
					}
				});
			} catch (err) {
				console.log(err);

				Alert.alert(Lang.get("error_marking_read"), Lang.get("error_marking_read_desc"), [{ text: Lang.get("ok") }], { cancelable: false });
			}
		}, 500);
	}

	render() {
		const { styles, componentStyles, styleVars } = this.props;

		if (this.props.loading) {
			return (
				<ContentRow>
					<PlaceholderContainer height={60} style={[styles.mrWide, styles.mlWide, styles.mtTight, styles.mbTight]}>
						<PlaceholderElement circle radius={20} left={0} top={styleVars.spacing.tight} />
						<PlaceholderElement
							width={250}
							height={17}
							top={styleVars.spacing.tight}
							left={20 + styleVars.spacing.standard}
							right={20 + styleVars.spacing.veryWide}
						/>
						<PlaceholderElement width={100} height={13} top={25 + styleVars.spacing.tight} left={20 + styleVars.spacing.standard} />
						<PlaceholderElement circle radius={30} right={0} top={0} />
						<PlaceholderElement width={30} height={12} top={33} right={4} />
					</PlaceholderContainer>
				</ContentRow>
			);
		}

		const rightButtons = [
			<TouchableHighlight style={[styles.flex, styles.flexJustifyCenter, styles.swipeItemWrap]} onPress={this.markForumRead}>
				<View style={[styles.flexColumn, styles.flexAlignCenter, styles.swipeItem]}>
					<Image source={icons.CHECKMARK2} style={styles.swipeItemIcon} resizeMode="contain" />
					<Text style={styles.swipeItemText}>Read</Text>
				</View>
			</TouchableHighlight>
		];

		const lastPostInfo = {
			photo: this.props.data.lastPostAuthor ? this.props.data.lastPostAuthor.photo : null,
			date: this.props.data.lastPostDate
		};

		return (
			<Swipeable rightButtons={rightButtons} onRef={ref => (this._swipeable = ref)}>
				<ContentRow style={componentStyles.forumItem} onPress={this.props.onPress || this.onPress}>
					<View style={componentStyles.iconAndInfo}>
						<ForumIcon style={componentStyles.forumIcon} unread={this.props.data.hasUnread} type={this.props.data.isRedirectForum ? "redirect" : "normal"} />
						<View style={componentStyles.forumInfo}>
							<Text style={[styles.itemTitle, componentStyles.forumTitle]} numberOfLines={1}>
								{this.props.data.name}
							</Text>
							{!this.props.data.isRedirectForum && (
								<Text testId="postCount" style={[styles.lightText, styles.standardText]}>
									{Lang.pluralize(Lang.get("posts"), Lang.formatNumber(this.props.data.topicCount))}
								</Text>
							)}
						</View>
					</View>
					{!Boolean(this.props.data.isRedirectForum) && (
						<LastPostInfo style={componentStyles.lastPost} photo={lastPostInfo.photo} photoSize={30} timestamp={lastPostInfo.date} />
					)}
				</ContentRow>
			</Swipeable>
		);
	}
}

const _componentStyles = styleVars => ({
	forumItem: {
		paddingHorizontal: styleVars.spacing.wide,
		paddingVertical: styleVars.spacing.wide,
		flexDirection: "row",
		justifyContent: "space-between",
		alignContent: "stretch",
		alignItems: "center"
	},
	iconAndInfo: {
		flexDirection: "row",
		flex: 1,
		paddingRight: 20
	},
	forumInfo: {
		marginLeft: 9
	},
	forumTitle: {
		lineHeight: 18
	}
});

export default compose(
	withNavigation,
	withApollo,
	withTheme(_componentStyles)
)(ForumItem);

export { ForumItem as TestForumItem }; // For test runner only
