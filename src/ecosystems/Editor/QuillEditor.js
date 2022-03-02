import React, { Fragment, Component } from "react";
import { View, ScrollView, TextInput, Alert, Text, TouchableOpacity, Image, StyleSheet, LayoutAnimation } from "react-native";
import { WebView } from "react-native-webview";
import gql from "graphql-tag";
import { graphql, compose, withApollo } from "react-apollo";
import Modal from "react-native-modal";
import * as FileSystem from "expo-file-system";
import * as Permissions from "expo-permissions";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AssetUtils from "expo-asset-utils";
import _ from "lodash";
import { connect } from "react-redux";
import isURL from "validator/lib/isURL";

import {
	setFocus,
	setFormatting,
	resetEditor,
	resetImagePicker,
	resetCamera,
	addImageToUpload,
	closeLinkModal,
	showMentionBar,
	hideMentionBar,
	loadingMentions,
	updateMentionResults,
	insertMentionSymbolDone,
	uploadImage,
	setUploadStatus,
	UPLOAD_STATUS
} from "../../redux/actions/editor";
import ContentRow from "../../ecosystems/ContentRow";
import Button from "../../atoms/Button";
import Lang from "../../utils/Lang";
import ViewMeasure from "../../atoms/ViewMeasure";
import { withTheme } from "../../themes";

const EDITOR_VIEW = require("../../../web/dist/index.html");
const MESSAGE_PREFIX = Expo.Constants.manifest.extra.message_prefix;

const formattingOptions = {
	bold: true,
	italic: true,
	underline: true,
	list: ["bullet", "ordered"],
	link: true
};

const MentionQuery = gql`
	query MentionQuery($term: String) {
		core {
			search(term: $term, type: core_members, orderBy: name, orderDir: ASC, limit: 10) {
				results {
					... on core_Member {
						id
						name
						photo
						url
					}
				}
			}
		}
	}
`;

class QuillEditor extends Component {
	constructor(props) {
		super(props);
		this.webview = null;
		this.urlInput = null;
		this._mentionHandlers = {};
		this._editorHtml = null;
		this._editorMinHeight = 150;

		// Set up initial state for our formatting options. Format types with options are
		// created as camelCase keys in the state, e.g. listUnordered or listOrdered
		const formattingState = {};
		Object.entries(formattingOptions).forEach(pair => {
			if (_.isBoolean(pair[1])) {
				formattingState[pair[0]] = false;
			} else {
				for (let i = 0; i < pair[1].length; i++) {
					const stateKey = pair[0] + (pair[1][i].charAt(0).toUpperCase() + pair[1][i].slice(1));
					formattingState[stateKey] = false;
				}
			}
		});

		this.getEditorHtml();

		this.state = {
			debug: [],
			loading: true,
			linkModal: {
				visible: false,
				url: "",
				text: ""
			},
			formatting: formattingState,
			content: "",
			currentHeight: 200
		};

		this.blur = this.blur.bind(this);
		this.onMessage = this.onMessage.bind(this);
		this.closeLinkModal = this.closeLinkModal.bind(this);
		this.insertLink = this.insertLink.bind(this);

		// Optionally set a height on the webview
		// We need this if we're showing the editor in a scrollview,
		// which doesn't support flex elements
		this.inlineStyles = {};
		if (props.height) {
			this.inlineStyles = {
				height: props.height
			};
		}
	}

	/**
	 * Since react-native-webkit requires a URI source file, we need to download the
	 * local HTMl file as an asset and get the localUri. This won't change so no need
	 * to put it in state, but we will toggle our loading status.
	 *
	 * @return 	void
	 */
	async getEditorHtml() {
		const file = await AssetUtils.resolveAsync(EDITOR_VIEW);
		const fileContents = await FileSystem.readAsStringAsync(file.localUri);

		this._editorHtml = fileContents;

		this.setState({
			loading: false
		});
	}

	/**
	 * When mounted we need to reset the editor state
	 * This is because we only maintain one global editor state
	 *
	 * @return 	void
	 */
	componentDidMount() {
		this.props.dispatch(resetEditor());

		if (this.props.receiveOnBlurCallback) {
			this.props.receiveOnBlurCallback(this.blur);
		}
	}

	/**
	 * Blur the editor
	 *
	 * @return 	void
	 */
	blur() {
		this.sendMessage("BLUR");
	}

	/**
	 * Component update
	 *
	 * @param 	prevProps
	 * @param 	prevState
	 * @return 	void
	 */
	componentDidUpdate(prevProps, prevState) {
		// If our state has changed
		if (prevProps.enabled !== this.props.enabled) {
			this.sendMessage("TOGGLE_STATE", {
				enabled: this.props.enabled
			});
		}

		// If we're now focused, but were not before, call the callback
		if (!prevProps.editor.focused && this.props.editor.focused) {
			if (this.props.onFocus) {
				this.props.onFocus.call(null, this.measurer);
			}
		}

		// Are we inserting the mention symbol?
		if (!prevProps.editor.mentions.insertSymbol && this.props.editor.mentions.insertSymbol) {
			this.insertMentionSymbol();
		}

		// Are we opening the link modal?
		if (!prevProps.editor.linkModalActive && this.props.editor.linkModalActive) {
			this.showLinkModal();
		} else if (prevProps.editor.linkModalActive && !this.props.editor.linkModalActive) {
			this.doHideLinkModal();
		}

		// Are we opening the image picker?
		if (!prevProps.editor.imagePickerOpened && this.props.editor.imagePickerOpened) {
			this.showImagePicker();
			this.props.dispatch(resetImagePicker());
		}

		// Are we opening the camera?
		if (!prevProps.editor.cameraOpened && this.props.editor.cameraOpened) {
			this.showCamera();
			this.props.dispatch(resetCamera());
		}

		// If any of our formatting options have changed, send a SET_FORMAT command to the WebView
		if (!_.isEqual(prevProps.editor.formatting, this.props.editor.formatting)) {
			Object.entries(this.props.editor.formatting).forEach(pair => {
				if (_.isObject(pair[1])) {
					// Buttons with options
					// Compare the previously-active option with the current option, and if they're different
					// send the SET_FORMAT command. If no options are active, send false to turn off format.
					const prevActiveOption = _.find(Object.keys(prevProps.editor.formatting[pair[0]]), val => {
						return prevProps.editor.formatting[pair[0]][val] === true;
					});
					const activeOption = _.find(Object.keys(this.props.editor.formatting[pair[0]]), val => {
						return this.props.editor.formatting[pair[0]][val] === true;
					});

					if (prevActiveOption !== activeOption) {
						this.sendMessage("SET_FORMAT", {
							type: pair[0],
							option: activeOption || false
						});
					}
				} else {
					// If this is a simple boolean button, send it
					if (prevProps.editor.formatting[pair[0]] !== this.props.editor.formatting[pair[0]]) {
						this.sendMessage("SET_FORMAT", {
							type: pair[0],
							option: pair[1]
						});
					}
				}
			});
		}
	}

	/**
	 * Get mentions from the server
	 *
	 * @param 	string 	searchTerm 		string used to match users
	 * @return 	void
	 */
	async fetchMentions(searchTerm) {
		try {
			//console.log(`Fetching mentions for ${searchTerm}`);
			this.props.dispatch(loadingMentions());

			let mentions = [];
			const { data } = await this.props.client.query({
				query: MentionQuery,
				variables: { term: searchTerm }
			});

			if (data.core.search.results.length) {
				mentions = data.core.search.results.map(mention => {
					return {
						...mention,
						handler: this.getMentionHandler(mention)
					};
				});
			}

			//LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
			this.props.dispatch(updateMentionResults(mentions));
		} catch (err) {
			console.log(err);
		}
	}

	/**
	 * Memoization function that returns a handler for tapping on a mention
	 *
	 * @param 	object 		mention 	Data for a particular mention
	 * @return 	function
	 */
	getMentionHandler(mention) {
		if (_.isUndefined(this._mentionHandlers[mention.id])) {
			this._mentionHandlers[mention.id] = () => this.onPressMention(mention);
		}

		return this._mentionHandlers[mention.id];
	}

	/**
	 * Handler for tapping on a mention
	 *
	 * @param 	object 		mention 		Mention data
	 * @return 	void
	 */
	onPressMention(mention) {
		this.sendMessage("INSERT_MENTION", {
			name: mention.name,
			id: mention.id,
			url: mention.url
		});

		this.props.dispatch(hideMentionBar());
	}

	/**
	 * Insert the mention
	 *
	 * @param 	object 		mention 		Mention data
	 * @return 	void
	 */
	insertMentionSymbol() {
		this.sendMessage("INSERT_MENTION_SYMBOL");
		this.props.dispatch(insertMentionSymbolDone());
	}

	/**
	 * Handle messages sent from the WebView
	 *
	 * @param 	event 	e
	 * @return 	void
	 */
	onMessage(e) {
		try {
			const messageData = JSON.parse(e.nativeEvent.data);
			const supported = ["DEBUG", "READY", "EDITOR_BLUR", "EDITOR_STATUS", "DOCUMENT_HEIGHT"];

			if (messageData.hasOwnProperty("message") && messageData.message.startsWith(MESSAGE_PREFIX)) {
				const messageType = messageData.message.replace(MESSAGE_PREFIX, "");

				if (supported.indexOf(messageType) !== -1 && this[messageType]) {
					this[messageType].call(this, messageData);
				}
			}
		} catch (err) {
			console.error(err);
		}
	}

	/**
	 * ========================================================================
	 * MESSAGE HANDLERS
	 * ========================================================================
	 */
	READY() {
		this.sendMessage("INSERT_STYLES", {
			style: this.buildCustomStyles()
		});

		if (this.props.autoFocus) {
			setTimeout(() => {
				this.sendMessage("FOCUS");
			}, 500);
		}
	}

	EDITOR_BLUR() {
		this.props.dispatch(
			setFocus({
				focused: false
			})
		);
	}

	EDITOR_STATUS(messageData) {
		for (let key in messageData) {
			const handler = `handle${key.charAt(0).toUpperCase()}${key.slice(1)}`;

			if (_.isFunction(this[handler])) {
				this[handler].call(this, messageData[key]);
			}
		}
	}

	DEBUG(messageData) {
		console.log(`WEBVIEW DEBUG: ${messageData.debugMessage}`);
	}

	DOCUMENT_HEIGHT(messageData) {
		this.handleHeight(messageData.height);
	}

	/**
	 * ========================================================================
	 * EDITOR STATUS HANDLERS
	 * ========================================================================
	 */
	/**
	 * Highlight appropriate formatting buttons
	 *
	 * @param 	object 	data 		Formatting data from Quill
	 * @return 	void
	 */
	handleFormatting(data) {
		// Set editor focus
		this.props.dispatch(
			setFocus({
				focused: true
			})
		);

		// Update current selection formatting
		const formatState = data;
		const newFormatting = {};

		Object.entries(this.props.editor.formatting).forEach(pair => {
			if (_.isBoolean(pair[1])) {
				// Normal boolean button - if it's in the object received from quill, that formatting is currently applied
				newFormatting[pair[0]] = !_.isUndefined(formatState[pair[0]]);
			} else {
				// Buttons with options. If the button type is in the object received, set the current option to true
				newFormatting[pair[0]] = {};
				Object.entries(pair[1]).forEach(subPair => {
					newFormatting[pair[0]][subPair[0]] = !_.isUndefined(formatState[pair[0]]) && formatState[pair[0]] == subPair[0];
				});
			}
		});

		this.props.dispatch(setFormatting(newFormatting));
	}

	/**
	 * Handle showing Mention list
	 *
	 * @param 	object 	data 		Mention data
	 * @return 	void
	 */
	handleMention(data) {
		if (data === null) {
			if (this.props.editor.mentions.active) {
				this.props.dispatch(hideMentionBar());
			}
			return;
		} else {
			this.props.dispatch(showMentionBar());

			if (data.text !== this.props.editor.mentions.searchText) {
				this.fetchMentions(data.text);
			}
		}
	}

	/**
	 * Handle receivig editor content, which we store in state so we can use it
	 *
	 * @param 	string 	data 	The editor contents
	 * @return 	void
	 */
	handleContent(data) {
		this.setState({
			content: data
		});

		this.props.update.call(null, data);
	}

	/**
	 * Update the height of the webview
	 *
	 * @param 	int 	height 	The editor height
	 * @return 	void
	 */
	handleHeight(height) {
		this._currentHeight = parseInt(height);

		//const currentHeight = Math.max(this._editorMinHeight, parseInt(height));
		/*if (currentHeight !== this.state.currentHeight) {
			//console.log(`setting height to ${currentHeight}`);

			this.setState({
				currentHeight
			});
		}*/
	}

	handleBounds(bounds) {
		const top = bounds.top;
		const minHeight = Math.max(this._editorMinHeight, top + 100);

		if (minHeight !== this.state.currentHeight) {
			this.setState({
				currentHeight: minHeight
			});
		}

		if (_.isFunction(this.props.focusPositionCallback)) {
			this.props.focusPositionCallback.call(null, bounds);
		}
	}

	/**
	 * ========================================================================
	 * / END EDITOR STATUS HANDLERS
	 * ========================================================================
	 */

	buildCustomStyles() {
		const { styleVars } = this.props;
		const style = [
			`body {
				background: ${styleVars.formField.background} !important;
				color: ${styleVars.formField.text} !important;
			}`,
			`a {
				color: ${styleVars.accentColor};
			}`,
			`.ql-editor.ql-blank:before {
				color: ${styleVars.formField.placeholderText} !important;
			}`,
			`.ipsMention {
				background: ${styleVars.accentColor};
				color: ${styleVars.reverseText};
				font-size: 14px;
				margin-top: -2px;
				border-radius: 3px;
				padding-top: 2px;
				padding-bottom: 2px;
				vertical-align: middle;
				text-decoration: none;
			}`
		];

		return style;
	}

	/**
	 * Send a message to WebView
	 *
	 * @param 	string 	message 	The message type to send
	 * @param 	object 	data 		Any additional data to send with message
	 * @return 	void
	 */
	sendMessage(message, data) {
		if (!this.webview) {
			console.error("Webview not ready");
			return;
		}

		const messageToSend = JSON.stringify({
			message: `${MESSAGE_PREFIX}${message}`,
			...data
		});

		console.log(`Sending ${message}`);
		this.webview.postMessage(messageToSend, "*");
	}

	/**
	 * Show the Insert Link modal
	 *
	 * @return 	void
	 */
	showLinkModal() {
		this.setState(
			{
				linkModal: {
					visible: true,
					url: "",
					text: ""
				}
			},
			() => {
				setTimeout(() => {
					this.urlInput.focus();
				}, 250);
			}
		);

		this.props.dispatch(
			setFocus({
				focused: false
			})
		);
	}

	closeLinkModal() {
		this.props.dispatch(closeLinkModal());
	}

	/**
	 * Hide the Insert Link modal
	 *
	 * @return 	void
	 */
	doHideLinkModal() {
		this.setState({
			linkModal: {
				visible: false,
				url: "",
				text: ""
			}
		});

		this.props.dispatch(
			setFocus({
				focused: true
			})
		);
	}

	/**
	 * Event handler for submitting the Insert Link modal, to send the link to quill WebView
	 *
	 * @return 	void
	 */
	insertLink() {
		let url = this.state.linkModal.url;

		if (!url.startsWith("http")) {
			url = `http://${url}`;
		}

		if (
			!isURL(url, {
				require_protocol: true
			})
		) {
			Alert.alert(Lang.get("invalid_link"), Lang.get("invalid_link_desc"), [{ text: Lang.get("ok") }], { cancelable: false });
			return;
		}

		this.closeLinkModal();

		const linkText = this.state.linkModal.text.trim();

		this.sendMessage("FOCUS");

		setTimeout(() => {
			this.sendMessage("INSERT_LINK", {
				url,
				text: linkText !== "" ? linkText : url
			});
		}, 750);

		console.log("Insert:", url, this.state.linkModal.text);
	}

	/**
	 * Event handler for image button; show the OS image picker
	 *
	 * @return 	void
	 */
	async showImagePicker() {
		const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

		if (status !== "granted") {
			throw new Error("Permission not granted");
		}

		let selectedFile = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: "Images",
			base64: true
		});

		if (selectedFile.cancelled) {
			return;
		}

		this.doUploadImage(selectedFile);
	}

	/**
	 * Event handler for image button; show the OS camera
	 *
	 * @return 	void
	 */
	async showCamera() {
		const { status: statusRoll } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
		if (statusRoll !== "granted") {
			throw new Error("Permission not granted");
		}

		const { status: statusCamera } = await Permissions.askAsync(Permissions.CAMERA);
		if (statusCamera !== "granted") {
			throw new Error("Permission not granted");
		}

		let selectedFile = await ImagePicker.launchCameraAsync({
			base64: true
		});

		if (selectedFile.cancelled) {
			return;
		}

		this.doUploadImage(selectedFile);
	}

	/**
	 * Uploads a provided image resource
	 *
	 * @param 	object 		selectedFile 		Object containing resource info for an image
	 * @return 	void
	 */
	async doUploadImage(selectedFile) {
		const { dispatch } = this.props;
		const maxImageDim = Expo.Constants.manifest.extra.max_image_dim;
		const { allowedFileTypes, chunkingSupported, maxChunkSize } = this.props.editor.settings;
		//const maxChunkSize = 3000;

		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

		// If width or height is > 1000, resize
		if (selectedFile.width > maxImageDim || selectedFile.height > maxImageDim) {
			selectedFile = await ImageManipulator.manipulateAsync(
				selectedFile.uri,
				[{ resize: selectedFile.width > maxImageDim ? { width: maxImageDim } : { height: maxImageDim } }],
				{
					compress: 0.7,
					format: "jpeg",
					base64: true
				}
			);
		}

		const fileName = selectedFile.uri.split("/").pop();
		const fileExt = fileName.split(".").pop();

		// Check the extension is permitted
		if (_.isArray(allowedFileTypes) && allowedFileTypes.indexOf(fileExt) === -1) {
			// OK so this type isn't allowed. What if we change it to a jpg or png?
			if (allowedFileTypes.indexOf("jpg") !== -1 || allowedFileTypes.indexOf("png") !== -1) {
				selectedFile = await ImageManipulator.manipulateAsync(selectedFile.uri, {
					format: allowedFileTypes.indexOf("jpg") !== -1 ? "jpeg" : "png",
					base64: true
				});
			} else {
				// Nope, not even that. wtf.
				Alert.alert(Lang.get("error"), Lang.get("error_upload_type"), [{ text: Lang.get("ok") }], { cancelable: false });
				return;
			}
		}

		// Build data object to pass into action
		const uploadData = {
			// We need to figure out the max allowed size of a chunk, allowing for the fact it'll be base64'd
			// which adds approx 33% to the size. The -3 is to allow for up to three padding characters that
			// base64 will add
			maxActualChunkSize: Math.floor((maxChunkSize / 4) * 3 - 3),
			maxChunkSize: maxChunkSize,
			fileData: selectedFile,
			postKey: this.props.editorID,
			chunkingSupported: chunkingSupported
		};

		// Get the file stream
		try {
			const fileBuffer = Buffer.from(selectedFile.base64, "base64");

			// Check we have space for it
			if (this.props.user.maxUploadSize !== null) {
				if (fileBuffer.length > parseInt(this.props.user.maxUploadSize) - this.getCurrentUploadSize()) {
					Alert.alert(Lang.get("error"), Lang.get("error_upload_space"), [{ text: Lang.get("ok") }], { cancelable: false });
					return;
				}
			}

			dispatch(uploadImage({ base64file: selectedFile.base64, fileBuffer }, uploadData));
		} catch (err) {
			dispatch(
				setUploadStatus({
					id: selectedFile.uri,
					status: UPLOAD_STATUS.ERROR,
					error: Lang.get("error_upload_other")
				})
			);
		}
	}

	/**
	 * Returns the currently-used upload allowance
	 *
	 * @return 	int 	Upload size currently used
	 */
	getCurrentUploadSize() {
		const attachedImages = this.props.editor.attachedImages;
		const totalUploadSize = Object.keys(attachedImages).reduce((previous, current) => {
			// Don't count errored/aborted files in the total size calc
			if ([UPLOAD_STATUS.ERROR, UPLOAD_STATUS.ABORTED].indexOf(attachedImages[current].status) !== -1) {
				return previous;
			}
			return previous + attachedImages[current].fileSize;
		}, 0);

		return totalUploadSize;
	}

	render() {
		const { styles, styleVars, componentStyles } = this.props;
		const placeholder = this.props.placeholder ? `"${this.props.placeholder}"` : `null`;
		const injectedJavaScript = `
			if (!window.ReactNativeWebView) {
				window.ReactNativeWebView = window['ReactABI33_0_0NativeWebView'];
			}

			window._PLACEHOLDER = ${placeholder};
			window._readyToGo = true;
			true;
		`;

		return (
			<ViewMeasure
				onLayout={this.props.onEditorLayout || null}
				id="editor"
				pointerEvents="box-none"
				style={{ flex: 1, backgroundColor: styleVars.formField.background }}
			>
				<Modal style={styles.flex} avoidKeyboard={true} animationIn="fadeInUp" isVisible={this.state.linkModal.visible} onBackdropPress={this.closeLinkModal}>
					<View style={[styles.modal, componentStyles.modal]}>
						<View style={[styles.modalInner, componentStyles.modalInner]}>
							<View style={styles.pvWide}>
								<View style={[styles.flexRow, styles.flexJustifyCenter, styles.flexAlignCenter]}>
									<Text style={[styles.modalTitle]}>Insert Link</Text>
								</View>
								<TouchableOpacity onPress={this.closeLinkModal} style={styles.modalCloseTouchable}>
									<Image source={require("../../../resources/close_circle.png")} resizeMode="contain" style={styles.modalClose} />
								</TouchableOpacity>
							</View>
							<View style={[styles.pbWide, styles.phWide]}>
								<TextInput
									onChangeText={url =>
										this.setState({
											linkModal: { ...this.state.linkModal, url }
										})
									}
									value={this.state.linkModal.url}
									placeholder={Lang.get("link_url")}
									placeholderTextColor={styleVars.formField.placeholderText}
									style={[styles.textInput, styles.pStandard]}
									ref={urlInput => (this.urlInput = urlInput)}
									textContentType="URL"
									autoCapitalize="none"
								/>

								<TextInput
									onChangeText={text =>
										this.setState({
											linkModal: { ...this.state.linkModal, text }
										})
									}
									value={this.state.linkModal.text}
									placeholder={Lang.get("link_text")}
									placeholderTextColor={styleVars.formField.placeholderText}
									style={[styles.textInput, styles.pStandard]}
								/>
								<Button filled type="primary" size="medium" title={Lang.get("insert")} style={styles.mtWide} onPress={this.insertLink} />
							</View>
						</View>
					</View>
				</Modal>
				<View ref={measurer => (this.measurer = measurer)} style={{ height: 1, backgroundColor: styleVars.formField.background }} />
				{!this.state.loading && (
					<WebView
						source={{ html: this._editorHtml }}
						originWhitelist={["*"]}
						onMessage={this.onMessage}
						ref={webview => (this.webview = webview)}
						javaScriptEnabled={true}
						injectedJavaScript={injectedJavaScript}
						mixedContentMode="always"
						style={[editorStyles.editor, this.inlineStyles, { backgroundColor: "transparent" }]}
						containerStyle={{ flex: 0, minHeight: this.state.currentHeight + 80 }}
						hideAccessory={true}
						hideKeyboardAccessoryView={true}
						keyboardDisplayRequiresUserAction={false}
						useWebKit={true}
						allowFileAccess={true}
						scrollEnabled={false}
					/>
				)}
			</ViewMeasure>
		);
	}
}

const _componentStyles = styleVars => ({
	modal: {
		backgroundColor: styleVars.greys.medium
	},
	modalInner: {
		backgroundColor: styleVars.appBackground,
		paddingBottom: 0
	}
});

const editorStyles = StyleSheet.create({
	editor: {
		flex: 1,
		borderBottomWidth: 0
	}
});

export default compose(
	withApollo,
	connect(state => ({
		editor: state.editor,
		user: state.user
	})),
	withTheme(_componentStyles)
)(QuillEditor);
