import React, { Component } from "react";
import { View, StyleSheet, ScrollView, Text, TextInput, Animated, TouchableOpacity, Image } from "react-native";
import { KeyboardAccessoryView } from "react-native-keyboard-accessory";
import { connect } from "react-redux";
import { compose } from "react-apollo";
import * as Animatable from "react-native-animatable";
import _ from "underscore";

import QuillToolbarButton from "./QuillToolbarButton";
import QuillToolbarSeparator from "./QuillToolbarSeparator";
import MentionRow from "./MentionRow";
import UploadedImage from "./UploadedImage";
import {
	setFocus,
	setButtonState,
	openLinkModal,
	openImagePicker,
	openCamera,
	insertMentionSymbol,
	abortImageUpload,
	deleteImageUpload,
	UPLOAD_STATUS
} from "../../redux/actions/editor";
import ActionSheet from "react-native-actionsheet";
import Lang from "../../utils/Lang";
import { PlaceholderRepeater } from "../../ecosystems/Placeholder";
import icons from "../../icons";
import { withTheme } from "../../themes";

const TOOLBAR_HEIGHT = 44;

class QuillToolbar extends Component {
	constructor(props) {
		super(props);

		this.state = {
			showToolbar: true,
			showImageToolbar: false,
			showMentionToolbar: false,
			overrideMentionBar: false
		};

		this._formattingHandlers = {};
		this._abortHandlers = {};
		this._deleteHandlers = {};

		this.openLinkModal = this.openLinkModal.bind(this);
		this.openImageActionSheet = this.openImageActionSheet.bind(this);
		this.toggleFormatting = this.toggleFormatting.bind(this);
		this.showImageToolbar = this.showImageToolbar.bind(this);
		this.showMentionToolbar = this.showMentionToolbar.bind(this);
		this.hideImageToolbar = this.hideImageToolbar.bind(this);
		this.insertMention = this.insertMention.bind(this);
		this.closeMentionBar = this.closeMentionBar.bind(this);
		this.actionSheetPress = this.actionSheetPress.bind(this);
	}

	componentDidUpdate(prevProps, prevState) {
		// Check if we need to show the mention bar
		if (!prevProps.editor.mentions.active && this.props.editor.mentions.active) {
			// Doing this immediately caused significant lag on the animation
			// Putting it in a timeout to do once the event loop has finished seems to improve it
			setTimeout(() => this.showMentionToolbar(), 1);
		}

		// Check if we need to hide the mention bar
		if (
			this.state.showMentionToolbar &&
			((!this.props.editor.mentions.active && prevProps.editor.mentions.active) || (!prevState.overrideMentionBar && this.state.overrideMentionBar))
		) {
			this._wrapper.transitionTo({ height: TOOLBAR_HEIGHT });
			this._toolbar.transitionTo({ opacity: 1 });
			this._mentionToolbar.transitionTo({ opacity: 0 });

			this.setState({
				showMentionToolbar: false,
				overrideMentionBar: false
			});
		}
	}

	/**
	 * Event handler that dispatches actions when formatting buttons are tapped
	 *
	 * @param 	string 			button 		Button tapped
	 * @param 	string|null		option 		Some buttons (e.g. lists) use option values instead of booleans
	 * @return 	void
	 */
	toggleFormatting(button, option = null) {
		let state = false;

		// Some buttons e.g. list have options, in which case we want to reverse
		// the state of the option, not the button
		if (!_.isBoolean(this.props.editor.formatting[button])) {
			state = !this.props.editor.formatting[button][option];
		} else {
			state = !this.props.editor.formatting[button];
		}

		this.props.dispatch(
			setButtonState({
				button,
				option,
				state
			})
		);
	}

	showImageToolbar() {
		this.setState(
			{
				showImageToolbar: true,
				showMentionToolbar: false
			},
			() => {
				this._wrapper.transitionTo({ height: 75 });
				this._imageToolbar.transitionTo({ opacity: 1 });
				this._toolbar.transitionTo({ opacity: 0 });

				if (!Object.keys(this.props.editor.attachedImages).length) {
					this.openImageActionSheet();
				}
			}
		);
	}

	showMentionToolbar() {
		this.setState(
			{
				showMentionToolbar: true,
				showImageToolbar: false,
				overrideMentionBar: false
			},
			() => {
				this._wrapper.transitionTo({ height: 130 });
				this._mentionToolbar.transitionTo({ opacity: 1 });
				this._toolbar.transitionTo({ opacity: 0 });
			}
		);
	}

	async hideImageToolbar() {
		this._wrapper.transitionTo({ height: TOOLBAR_HEIGHT });
		this._toolbar.transitionTo({ opacity: 1 });
		await this._imageToolbar.transitionTo({ opacity: 0 }, null);

		this.setState({
			showImageToolbar: false
		});
	}

	/**
	 * Dispatch action to open the link modal in the editor
	 *
	 * @return 	void
	 */
	openLinkModal() {
		this.props.dispatch(openLinkModal());
	}

	/**
	 * Dispatch action to open the image picker in the editor
	 *
	 * @return 	void
	 */
	openImageActionSheet() {
		this._actionSheet.show();
	}

	/**
	 * Dispatch action to open the mention modal
	 *
	 * @return 	void
	 */
	insertMention() {
		this.props.dispatch(insertMentionSymbol());
	}

	/**
	 * The user has manually hidden the mention bar
	 *
	 * @return 	void
	 */
	closeMentionBar() {
		this.setState({
			overrideMentionBar: true
		});
	}

	/**
	 * Memoization function that returns a formatting handler
	 *
	 * @param 	{string} 			button 		The format button that was pressed
	 * @param 	{object\null} 		option		An additional optional param for the formatting
	 * @return 	void
	 */
	getFormattingHandler(button, option = null) {
		const buttonID = `${button}${option ? "-" + option : ""}`;

		if (_.isUndefined(this._formattingHandlers[buttonID])) {
			this._formattingHandlers[buttonID] = () => this.toggleFormatting(button, option);
		}

		return this._formattingHandlers[buttonID];
	}

	getActionSheetOptions() {
		// @todo language
		return [Lang.get("cancel"), Lang.get("take_photo"), Lang.get("camera_roll")];
	}

	getAbortUploadHandler(id) {
		if (_.isUndefined(this._abortHandlers[id])) {
			this._abortHandlers[id] = () => this.props.dispatch(abortImageUpload(id));
		}

		return this._abortHandlers[id];
	}

	getDeleteUploadHandler(id, attachmentID) {
		if (_.isUndefined(this._deleteHandlers[id])) {
			this._deleteHandlers[id] = () => this.props.dispatch(deleteImageUpload(id, attachmentID));
		}

		return this._deleteHandlers[id];
	}

	/**
	 * Handle tapping an action sheet item. Triggers the relevant action.
	 *
	 * @param 	number 	i 	THe index of the item that was tapped
	 * @return 	void
	 */
	actionSheetPress(i) {
		if (i === 2) {
			this.props.dispatch(openImagePicker());
		} else if (i === 1) {
			this.props.dispatch(openCamera());
		}
	}

	render() {
		const { styles, componentStyles } = this.props;
		const {
			attachedImages,
			settings: { allowedFileTypes }
		} = this.props.editor;
		const sortedAttachedImages = Object.keys(attachedImages)
			.sort((a, b) => (attachedImages[a].position > attachedImages[b].position ? 1 : -1))
			.map(imageID => attachedImages[imageID]);
		const allowImageUploads = allowedFileTypes === null || (_.isArray(allowedFileTypes) && _.intersection(["jpg", "png"], allowedFileTypes).length);

		return (
			<KeyboardAccessoryView hideBorder alwaysVisible={this.props.editor.focused} visibleOpacity={this.props.editor.focused ? 1 : 0}>
				<View style={componentStyles.toolbarOuter}>
					<Animatable.View style={[componentStyles.toolbarInner]} ref={ref => (this._wrapper = ref)}>
						{Boolean(this.state.showToolbar) && (
							<Animatable.View
								style={[styles.flexRow, styles.flexAlignCenter, componentStyles.toolbarIcons]}
								useNativeDriver={true}
								ref={ref => (this._toolbar = ref)}
							>
								{allowImageUploads && <QuillToolbarButton icon={icons.IMAGE} onPress={this.showImageToolbar} />}
								<QuillToolbarButton active={this.props.editor.linkModalActive} icon={icons.LINK} onPress={this.openLinkModal} />
								<QuillToolbarButton active={this.props.editor.mentionModalActive} icon={icons.MENTION} onPress={this.insertMention} />
								<QuillToolbarSeparator />
								<QuillToolbarButton active={this.props.editor.formatting.bold} icon={icons.BOLD} onPress={this.getFormattingHandler("bold")} />
								<QuillToolbarButton active={this.props.editor.formatting.italic} icon={icons.ITALIC} onPress={this.getFormattingHandler("italic")} />
								<QuillToolbarButton active={this.props.editor.formatting.underline} icon={icons.UNDERLINE} onPress={this.getFormattingHandler("underline")} />
								<QuillToolbarButton
									active={this.props.editor.formatting.list.bullet}
									icon={icons.LIST_UNORDERED}
									onPress={this.getFormattingHandler("list", "bullet")}
								/>
								<QuillToolbarButton
									active={this.props.editor.formatting.list.ordered}
									icon={icons.LIST_ORDERED}
									onPress={this.getFormattingHandler("list", "ordered")}
								/>
							</Animatable.View>
						)}
						{Boolean(this.state.showMentionToolbar) && (
							<Animatable.View style={[styles.flex, componentStyles.mentionToolbar]} ref={ref => (this._mentionToolbar = ref)}>
								<ScrollView style={[styles.ptVeryTight]}>
									<View style={componentStyles.mentionContainer}>
										{Boolean(this.props.editor.mentions.loading) && !Boolean(this.props.editor.mentions.matches.length) && (
											<PlaceholderRepeater repeat={6}>
												<MentionRow loading />
											</PlaceholderRepeater>
										)}
										{!Boolean(this.props.editor.mentions.loading) && !Boolean(this.props.editor.mentions.matches.length) && (
											<Text style={[styles.mvTight, styles.mhStandard, styles.veryLightText]}>{Lang.get("no_matching_members")}</Text>
										)}
										{Boolean(this.props.editor.mentions.matches.length) &&
											this.props.editor.mentions.matches.map(mention => (
												<MentionRow key={mention.id} onPress={mention.handler} name={mention.name} id={mention.id} photo={mention.photo} />
											))}
									</View>
									<TouchableOpacity onPress={this.closeMentionBar} style={componentStyles.closeMentionBar}>
										<Image source={icons.CROSS} resizeMode="contain" style={componentStyles.closeMentionBarIcon} />
									</TouchableOpacity>
								</ScrollView>
							</Animatable.View>
						)}
						{Boolean(this.state.showImageToolbar) && (
							<Animatable.View style={[styles.flexRow, styles.pvTight, styles.plTight, componentStyles.imageToolbar]} ref={ref => (this._imageToolbar = ref)}>
								<ScrollView horizontal style={[styles.flexRow, styles.flexGrow]} showsHorizontalScrollIndicator={false}>
									<TouchableOpacity
										onPress={this.openImageActionSheet}
										style={[styles.flexRow, styles.flexAlignCenter, styles.flexJustifyCenter, styles.mrStandard, componentStyles.addImage]}
									>
										<Image source={icons.PLUS_CIRCLE} resizeMode="contain" style={componentStyles.addImageIcon} />
									</TouchableOpacity>
									{sortedAttachedImages.reverse().map(image => (
										<UploadedImage
											image={image.localFilename}
											status={image.status}
											id={image.id}
											attachmentID={image.attachmentID || null}
											abort={this.getAbortUploadHandler(image.id)}
											delete={image.status === UPLOAD_STATUS.DONE ? this.getDeleteUploadHandler(image.id, image.attachmentID) : null}
											key={image.id}
											progress={image.progress}
											error={image.error}
										/>
									))}
								</ScrollView>
								<TouchableOpacity onPress={this.hideImageToolbar} style={[styles.pvTight, componentStyles.closeImageToolbar]}>
									<View style={[styles.flex, styles.flexJustifyCenter, styles.phTight, componentStyles.closeImageToolbarInner]}>
										<Image source={icons.CROSS} resizeMode="contain" style={componentStyles.closeIcon} />
									</View>
								</TouchableOpacity>
							</Animatable.View>
						)}
					</Animatable.View>
				</View>
				<ActionSheet ref={o => (this._actionSheet = o)} cancelButtonIndex={0} options={this.getActionSheetOptions()} onPress={this.actionSheetPress} />
			</KeyboardAccessoryView>
		);
	}
}

const _componentStyles = styleVars => ({
	toolbarOuter: {
		backgroundColor: styleVars.accessoryToolbar.background,
		borderTopWidth: 1,
		borderTopColor: styleVars.borderColors.medium
	},
	toolbarInner: {
		height: TOOLBAR_HEIGHT
	},
	toolbarIcons: {
		...StyleSheet.absoluteFillObject,
		opacity: 1
	},
	imageToolbar: {
		...StyleSheet.absoluteFillObject,
		opacity: 0
	},
	mentionToolbar: {
		...StyleSheet.absoluteFillObject,
		opacity: 0
	},
	addImage: {
		backgroundColor: styleVars.accessoryToolbar.background,
		borderWidth: 1,
		borderColor: styleVars.accessoryToolbar.border,
		width: 60,
		height: 60,
		borderRadius: 6
	},
	addImageIcon: {
		width: 20,
		height: 20,
		tintColor: styleVars.accessoryToolbar.text
	},
	closeImageToolbarInner: {
		borderLeftWidth: 1,
		borderLeftColor: styleVars.accessoryToolbar.border
	},
	closeIcon: {
		width: 20,
		height: 20,
		tintColor: styleVars.accessoryToolbar.text
	},
	mentionContainer: {
		marginRight: 36
	},
	closeMentionBar: {
		position: "absolute",
		right: 8,
		top: 8
	},
	closeMentionBarIcon: {
		width: 20,
		height: 20,
		tintColor: styleVars.accessoryToolbar.text
	}
});

export default compose(
	connect(state => ({
		editor: state.editor
	})),
	withTheme(_componentStyles)
)(QuillToolbar);
