import React, { Component } from "react";
import { Text, Alert, Button, TextInput, View, KeyboardAvoidingView, ActivityIndicator, Platform } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import gql from "graphql-tag";
import { graphql, compose } from "react-apollo";
import { NavigationActions, Header } from "react-navigation";
import { connect } from "react-redux";
import _ from "underscore";

import TagEdit from "../../ecosystems/TagEdit";
import { QuillEditor, QuillToolbar } from "../../ecosystems/Editor";
import { UPLOAD_STATUS } from "../../redux/actions/editor";
import HeaderButton from "../../atoms/HeaderButton";
import TwoLineHeader from "../../atoms/TwoLineHeader";
import uniqueID from "../../utils/UniqueID";
import Lang from "../../utils/Lang";
//import styles from "../../styles";
import withInsets from "../../hocs/withInsets";
import { withTheme, currentStyleSheet } from "../../themes";
import { processToSend } from "../../utils/richText";
import icons from "../../icons";

const CreateTopicMutation = gql`
	mutation CreateTopicMutation($forumID: ID!, $title: String!, $content: String!, $tags: [String], $postKey: String!) {
		mutateForums {
			createTopic(forumID: $forumID, title: $title, content: $content, tags: $tags, postKey: $postKey) {
				__typename
				id
				hiddenStatus
				url {
					__typename
					full
					app
					module
					controller
				}
			}
		}
	}
`;

class CreateTopicScreen extends Component {
	// @todo language
	static navigationOptions = ({ navigation }) => {
		return {
			headerTitle: navigation.getParam("submitting") ? (
				<React.Fragment>
					<ActivityIndicator size="small" color="#fff" />
					<Text style={currentStyleSheet.headerTitle}> {Lang.get("submitting")}...</Text>
				</React.Fragment>
			) : (
				<TwoLineHeader title={Lang.get("create_topic")} subtitle={Lang.get("in_container", { container: navigation.getParam("forumName") })} />
			),
			headerTintColor: "white",
			//headerLeft: navigation.getParam("submitting") ? null : <HeaderButton position="left" onPress={navigation.getParam("cancelTopic")} label="Cancel" />,
			headerRight: navigation.getParam("submitting") ? null : (
				<HeaderButton position="right" onPress={navigation.getParam("submitTopic")} label={Lang.get("post_action")} icon={icons.SUBMIT} />
			)
		};
	};

	static errors = {
		NO_FORUM: "The forum does not exist.",
		NO_TITLE: "You didn't provide a title.",
		NO_POST: "You didn't provide a post"
	};

	/**
	 * Constructor
	 *
	 * @param 	object 	props
	 * @return 	void
	 */
	constructor(props) {
		super(props);
		this.state = {
			title: "",
			content: "",
			tags: [],
			submitting: false
		};
		this.editorID = uniqueID();
		this._onBlurCallback = null;
		this._editorTop = 0;

		this.updateTags = this.updateTags.bind(this);
		this.updateContentState = this.updateContentState.bind(this);
		this.focusPositionCallback = this.focusPositionCallback.bind(this);
		this.onEditorLayout = this.onEditorLayout.bind(this);
	}

	/**
	 * Mount
	 */
	componentDidMount() {
		this.props.navigation.setParams({
			submitTopic: this.submitTopic.bind(this),
			cancelTopic: this.cancelTopic.bind(this)
		});
	}

	/**
	 * Check state for submitting flag
	 *
	 * @return 	void
	 */
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
	 * Event handler for clicking the Cancel button in the modal
	 *
	 * @return 	void
	 */
	cancelTopic() {
		// @todo language
		if (this.state.title || this.state.content) {
			Alert.alert(
				Lang.get("confirm"),
				Lang.get("confirm_discard_topic"),
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

	/**
	 * Event handler for lcicking the Post button in the modal
	 *
	 * @return 	void
	 */
	async submitTopic() {
		console.log("submit topic");

		// @todo language
		if (!this.state.title) {
			Alert.alert(Lang.get("title_required"), Lang.get("title_required_desc"), [{ text: Lang.get("ok") }], { cancelable: false });
			return;
		}

		if (!this.state.content) {
			Alert.alert(Lang.get("post_required"), Lang.get("post_required_desc"), [{ text: Lang.get("ok") }], { cancelable: false });
			return;
		}

		if (this.props.site.settings.tags_enabled && this.props.user.group.canTag) {
			if (this.props.site.settings.tags_max && this.state.tags.length > this.props.site.settings.tags_max) {
				Alert.alert(Lang.get("too_many_tags"), Lang.pluralize(Lang.get("tags_max_error"), this.props.site.settings.tags_max), [{ text: Lang.get("ok") }], {
					cancelable: false
				});
				return;
			}

			if (this.props.site.settings.tags_min && this.state.tags.length < this.props.site.settings.tags_min) {
				Alert.alert(Lang.get("too_few_tags"), Lang.pluralize(Lang.get("tags_min_error"), this.props.site.settings.tags_min), [{ text: Lang.get("ok") }], {
					cancelable: false
				});
				return;
			}
		}

		// Check for any uploading files
		const attachedImages = this.props.attachedImages;
		const uploadingFiles = Object.keys(attachedImages).find(
			imageID => [UPLOAD_STATUS.UPLOADING, UPLOAD_STATUS.PENDING].indexOf(attachedImages[imageID].status) !== -1
		);

		if (!_.isUndefined(uploadingFiles)) {
			Alert.alert(Lang.get("upload_in_progress"), Lang.get("upload_in_progress_desc"), [{ text: Lang.get("ok") }], {
				cancelable: false
			});
			return;
		}

		this.setState({
			submitting: true
		});

		try {
			const { data } = await this.props.mutate({
				variables: {
					forumID: this.props.navigation.state.params.forumID,
					title: this.state.title,
					content: processToSend(this.state.content),
					tags: this.state.tags,
					postKey: this.editorID
				},
				refetchQueries: ["TopicListQuery"]
			});

			const newTopicData = data.mutateForums.createTopic;
			const navigateAction = NavigationActions.navigate({
				params: {
					highlightTopic: newTopicData.id
				},
				routeName: "TopicList"
			});
			this.props.navigation.dispatch(navigateAction);
		} catch (err) {
			console.log(err);
			this.setState({
				submitting: false
			});

			const errorMessage = getErrorMessage(err, CreateTopicScreen.errors);
			Alert.alert(Lang.get("error"), Lang.get("error_posting_topic") + errorMessage, [{ text: Lang.get("ok") }], { cancelable: false });
		}
	}

	/**
	 * Event handler passed into our Editor, allowing us to modify the state with the given content
	 *
	 * @param 	string 	content 	The editor content
	 * @return 	void
	 */
	updateContentState(content) {
		this.setState({
			content
		});
	}

	updateTags(tagData) {
		this.setState({
			tags: tagData.tags
		});
	}

	focusPositionCallback(bounds) {
		if (bounds.top > 50) {
			this.scroll.props.scrollToPosition(0, bounds.top + this._editorTop, false);
		}
	}

	onEditorLayout(data) {
		this._editorTop = Math.round(data.measure.y);
	}

	/**
	 * Render
	 */
	render() {
		const settings = this.props.site.settings;
		const { styles, styleVars } = this.props;

		return (
			<React.Fragment>
				<KeyboardAwareScrollView
					style={[styles.stackCardStyle, { flex: 1, backgroundColor: styleVars.formField.background }]}
					resetScrollToCoords={{ x: 0, y: 0 }}
					scrollEnabled={true}
					enableOnAndroid={true}
					innerRef={ref => {
						this.scroll = ref;
					}}
				>
					<View style={styles.flex}>
						<TextInput
							style={[styles.field, styles.fieldText]}
							placeholder={Lang.get("topic_title")}
							placeholderTextColor={styleVars.formField.placeholderText}
							editable={!this.state.submitting}
							onChangeText={text => this.setState({ title: text })}
						/>
						{Boolean(this.props.site.settings.tags_enabled) && Boolean(this.props.user.group.canTag) && (
							<TagEdit
								definedTags={this.props.navigation.state.params.definedTags || null}
								maxTags={settings.tags_max}
								minTags={settings.tags_min}
								maxTagLen={settings.tags_len_max}
								minTagLen={settings.tags_len_min}
								minRequiredIfAny={settings.tags_min_req}
								onSubmit={this.updateTags}
								freeChoice={settings.tags_open_system}
							/>
						)}
						<QuillEditor
							placeholder={Lang.get("post_title")}
							update={this.updateContentState}
							style={styles.flex}
							editorID={this.editorID}
							enabled={!this.state.submitting}
							receiveOnBlurCallback={callback => (this._onBlurCallback = callback)}
							focusPositionCallback={this.focusPositionCallback}
							onEditorLayout={this.onEditorLayout}
						/>
					</View>
				</KeyboardAwareScrollView>
				<QuillToolbar editorID={this.editorID} />
			</React.Fragment>
		);
	}
}

export default compose(
	graphql(CreateTopicMutation),
	connect(state => ({
		site: state.site,
		user: state.user,
		attachedImages: state.editor.attachedImages
	})),
	withInsets,
	withTheme()
)(CreateTopicScreen);
