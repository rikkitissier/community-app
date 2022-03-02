import React, { Component } from "react";
import { Text, Alert, Button, TextInput, View, ScrollView, StyleSheet, KeyboardAvoidingView, ActivityIndicator } from "react-native";
import gql from "graphql-tag";
import { graphql, compose } from "react-apollo";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { NavigationActions, Header } from "react-navigation";
import { connect } from "react-redux";
import _ from "underscore";

import getErrorMessage from "../../utils/getErrorMessage";
import { QuillEditor, QuillToolbar } from "../../ecosystems/Editor";
import { PostFragment } from "../../ecosystems/Post";
import TwoLineHeader from "../../atoms/TwoLineHeader";
import RichTextContent from "../../ecosystems/RichTextContent";
import UserPhoto from "../../atoms/UserPhoto";
import HeaderButton from "../../atoms/HeaderButton";
import ShadowedArea from "../../atoms/ShadowedArea";
import uniqueID from "../../utils/UniqueID";
import Lang from "../../utils/Lang";
import { withTheme, currentStyleSheet } from "../../themes";
import { processToSend } from "../../utils/richText";
import icons from "../../icons";

const ReplyTopicMutation = gql`
	mutation ReplyTopicMutation($topicID: ID!, $content: String!, $replyingTo: ID, $postKey: String!) {
		mutateForums {
			replyTopic(topicID: $topicID, content: $content, replyingTo: $replyingTo, postKey: $postKey) {
				...PostFragment
			}
		}
	}
	${PostFragment}
`;

class ReplyTopicScreen extends Component {
	static navigationOptions = ({ navigation }) => {
		return {
			headerTitle: navigation.getParam("submitting") ? (
				<React.Fragment>
					<ActivityIndicator size="small" color="#fff" />
					<Text style={currentStyleSheet.headerTitle}> {Lang.get("submitting")}...</Text>
				</React.Fragment>
			) : (
				<TwoLineHeader title={Lang.get("reply_screen")} subtitle={navigation.getParam("topicTitle")} />
			),
			headerTintColor: "white",
			//headerLeft: navigation.getParam("submitting") ? null : <HeaderButton position="left" label="Cancel" onPress={navigation.getParam("cancelReply")} />,
			headerRight: navigation.getParam("submitting") ? null : (
				<HeaderButton position="right" label="Post" icon={icons.SUBMIT} onPress={navigation.getParam("submitReply")} />
			)
		};
	};

	static errors = {
		NO_TOPIC: "The topic you are replying to does not exist.",
		NO_POST: "You didn't provide a post."
	};

	constructor(props) {
		super(props);
		this.offset = null;

		this.editorID = uniqueID();
		this.state = {
			content: ""
		};

		this._onBlurCallback = null;

		this.updateContentState = this.updateContentState.bind(this);
		this.focusPositionCallback = this.focusPositionCallback.bind(this);
		this.onEditorLayout = this.onEditorLayout.bind(this);
		this.onEditorFocus = this.onEditorFocus.bind(this);
	}

	/**
	 * Set navigation params as function references so the header buttons work
	 *
	 * @return 	void
	 */
	componentDidMount() {
		this.props.navigation.setParams({
			submitReply: this.submitReply.bind(this),
			cancelReply: this.cancelReply.bind(this)
		});
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevState.submitting !== this.state.submitting) {
			this.props.navigation.setParams({
				submitting: this.state.submitting
			});

			if (this._onBlurCallback && this.state.submitting) {
				this._onBlurCallback();
			}
		}
	}

	/**
	 * Callback to store editor content in state
	 *
	 * @param 	string 		content 	Content HTML provided by editor
	 * @return 	void
	 */
	updateContentState(content) {
		this.setState({
			content
		});
	}

	/**
	 * Event handler for lcicking the Post button in the modal
	 *
	 * @return 	void
	 */
	async submitReply() {
		if (!this.state.content) {
			Alert.alert(Lang.get("post_required"), Lang.get("post_required_desc"), [{ text: Lang.get("ok") }], { cancelable: false });
			return;
		}

		this.setState({
			submitting: true
		});

		try {
			await this.props.mutate({
				variables: {
					topicID: this.props.navigation.state.params.topicID,
					content: processToSend(this.state.content),
					replyingTo: !_.isUndefined(this.props.navigation.state.params.quotedPost) ? this.props.navigation.state.params.quotedPost.id : null,
					postKey: this.editorID
				},
				refetchQueries: ["TopicViewQuery", "TopicListQuery"]
			});

			const navigateAction = NavigationActions.navigate({
				params: {
					showLastComment: true
				},
				routeName: "TopicView"
			});
			this.props.navigation.dispatch(navigateAction);
			//this.props.navigation.goBack();
		} catch (err) {
			this.setState({
				submitting: false
			});

			const errorMessage = getErrorMessage(err, ReplyTopicScreen.errors);
			Alert.alert(Lang.get("error"), Lang.get("error_posting_post") + err, [{ text: Lang.get("ok") }], { cancelable: false });
		}
	}

	/**
	 * Cancel replying to the topic
	 *
	 * @return 	void
	 */
	cancelReply() {
		if (this.state.content) {
			Alert.alert(
				Lang.get("confirm"),
				Lang.get("confirm_discard_post"),
				[
					{
						text: Lang.get("discard"),
						onPress: () => {
							this.props.navigation.goBack();
						},
						style: "cancel"
					},
					{
						text: Lang.get("stay_here"),
						onPress: () => console.log("OK Pressed")
					}
				],
				{ cancelable: false }
			);
		} else {
			this.props.navigation.goBack();
		}
	}

	focusPositionCallback(bounds) {
		if (bounds.top > 50) {
			this.scrollview.props.scrollToPosition(0, bounds.top + this._editorTop, false);
		}
	}

	onEditorLayout(data) {
		this._editorTop = Math.round(data.measure.y);
	}

	onEditorFocus(measurer) {
		this.scrollview.props.scrollToPosition(0, this._editorTop, true);
	}

	render() {
		const { styles, styleVars, componentStyles } = this.props;

		// If we're quoting an existing post, build that now
		let quotedPostComponent = null;
		if (this.props.navigation.state.params.quotedPost) {
			const quotedPost = this.props.navigation.state.params.quotedPost;

			quotedPostComponent = (
				<ShadowedArea style={[styles.pStandard, styles.flexRow, styles.flexAlignStart]}>
					<UserPhoto url={quotedPost.author.photo} size={36} />
					<View style={[styles.flex, styles.flexJustifyCenter, styles.mlStandard]}>
						<Text style={[styles.smallItemTitle, styles.mbVeryTight]}>{Lang.get("quoting_x", { name: quotedPost.author.name })}</Text>
						<RichTextContent removeQuotes>{quotedPost.content.original}</RichTextContent>
					</View>
				</ShadowedArea>
			);
		}

		return (
			<React.Fragment>
				<KeyboardAwareScrollView
					style={[styles.stackCardStyle, { flex: 1, backgroundColor: styleVars.formField.background }]}
					resetScrollToCoords={{ x: 0, y: 0 }}
					scrollEnabled={true}
					enableOnAndroid={true}
					innerRef={ref => {
						this.scrollview = ref;
					}}
					keyboardShouldPersistTaps="handled"
				>
					{quotedPostComponent}
					<QuillEditor
						placeholder={Lang.get("your_reply")}
						update={this.updateContentState}
						height={400}
						autoFocus={!_.isObject(this.props.navigation.state.params.quotedPost)}
						editorID={this.editorID}
						receiveOnBlurCallback={callback => (this._onBlurCallback = callback)}
						enabled={!this.state.submitting}
						focusPositionCallback={this.focusPositionCallback}
						onEditorLayout={this.onEditorLayout}
						onFocus={this.onEditorFocus}
					/>
				</KeyboardAwareScrollView>
				<QuillToolbar editorID={this.editorID} />
			</React.Fragment>
		);
	}
}

const _componentStyles = styleVars => ({});

export default compose(
	graphql(ReplyTopicMutation),
	connect(state => ({
		attachedImages: state.editor.attachedImages
	})),
	withTheme(_componentStyles)
)(ReplyTopicScreen);
