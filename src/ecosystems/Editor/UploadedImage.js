import React, { PureComponent } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from "react-native";
import ActionSheet from "react-native-actionsheet";
import * as Animatable from "react-native-animatable";

import { UPLOAD_STATUS } from "../../redux/actions/editor";
import { AnimatedCircularProgress } from "../../ecosystems/CircularProgress";
import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";
import icons from "../../icons";

class UploadedImage extends PureComponent {
	constructor(props) {
		super(props);
		this.actionSheetPress = this.actionSheetPress.bind(this);
		this.onPressImage = this.onPressImage.bind(this);

		this._uploadOverlay = null;
		this._uploadProgress = null;
		// If our status is already done when mounted, it means we've reshown the
		// image toolbar. In that case, note the state here so we can skip showing
		// the upload overlay.
		this._doneAtMount = this.props.status == UPLOAD_STATUS.DONE;

		this.state = {
			destructiveButtonIndex: this.props.status === UPLOAD_STATUS.DONE ? 1 : -1,
			actionSheetOptions: this.getActionSheetOptions()
		};
	}

	componentDidUpdate(prevProps) {
		if (prevProps.status !== this.props.status) {
			if (this.props.status === UPLOAD_STATUS.DONE) {
				this._uploadProgress.zoomOut(200).then(() => {
					if (this._uploadOverlay) {
						this._uploadOverlay.fadeOut();
					}
				});

				this.setState({
					destructiveButtonIndex: 1,
					actionSheetOptions: this.getActionSheetOptions()
				});
			}
		}
	}

	componentWillMount() {
		clearTimeout(this._animationTimer);
	}

	getActionSheetOptions() {
		if (this.props.status === UPLOAD_STATUS.DONE) {
			return [Lang.get("cancel"), Lang.get("delete_image")];
		} else {
			return [Lang.get("cancel"), Lang.get("cancel_upload")];
		}
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
			if (this.props.status === UPLOAD_STATUS.DONE) {
				this.props.delete();
			}
		}
	}

	onPressImage() {
		if (this.props.status === UPLOAD_STATUS.ERROR) {
			Alert.alert(Lang.get("error"), this.props.error, [{ text: Lang.get("ok") }], { cancelable: false });
		} else if (this.props.status === UPLOAD_STATUS.UPLOADING) {
			// If progress is already 100, we can't abort so just ignore
			if (this.props.progress !== 100) {
				this.props.abort();
			}
		} else {
			this._actionSheet.show();
		}
	}

	getStatusOverlay() {
		const { styles, componentStyles } = this.props;

		if (this.props.status === UPLOAD_STATUS.UPLOADING || this.props.status === UPLOAD_STATUS.DONE) {
			// If we're uploading (but not at 100%), or already finished, show the upload progress
			return (
				<Animatable.View
					ref={ref => (this._uploadOverlay = ref)}
					style={[styles.flex, styles.flexAlignCenter, styles.flexJustifyCenter, componentStyles.uploadingOverlay]}
				>
					<Animatable.View ref={ref => (this._uploadProgress = ref)}>
						<AnimatedCircularProgress size={36} width={4} rotation={0} fill={this.props.progress || 0} backgroundColor="rgba(255,255,255,0.2)" tintColor="#fff">
							{fill => {
								return fill < 100 ? (
									<Image source={icons.STOP} resizeMode="contain" style={componentStyles.abortButton} />
								) : (
									<ActivityIndicator size="small" color="#fff" />
								);
							}}
						</AnimatedCircularProgress>
					</Animatable.View>
				</Animatable.View>
			);
		} else if (this.props.status === UPLOAD_STATUS.REMOVING) {
			// If we're removing the upload, show an activity spinner
			return (
				<Animatable.View
					ref={ref => (this._uploadOverlay = ref)}
					style={[styles.flex, styles.flexAlignCenter, styles.flexJustifyCenter, componentStyles.uploadingOverlay, { opacity: 1 }]}
				>
					<ActivityIndicator size="small" color="#fff" />
				</Animatable.View>
			);
		} else if (this.props.status === UPLOAD_STATUS.ERROR) {
			// If we've hit an error, show an error icon
			return (
				<View style={[styles.flex, styles.flexAlignCenter, styles.flexJustifyCenter, componentStyles.uploadingOverlay]}>
					<Image source={icons.ERROR} resizeMode="contain" style={componentStyles.errorIcon} />
					<Text style={[componentStyles.errorText]}>{Lang.get("failed")}</Text>
				</View>
			);
		}

		return null;
	}

	render() {
		const { styles, componentStyles } = this.props;

		return (
			<TouchableOpacity style={[styles.mrStandard, componentStyles.uploadedImageWrapper]} onPress={this.onPressImage}>
				<Image source={{ uri: this.props.image }} resizeMode="cover" style={componentStyles.uploadedImage} />
				{!this._doneAtMount && this.getStatusOverlay()}
				<ActionSheet
					ref={o => (this._actionSheet = o)}
					options={this.state.actionSheetOptions}
					cancelButtonIndex={0}
					destructiveButtonIndex={this.state.destructiveButtonIndex}
					onPress={this.actionSheetPress}
				/>
			</TouchableOpacity>
		);
	}
}

//<ActivityIndicator size='small' color='#fff' />

const _componentStyles = styleVars => ({
	uploadedImageWrapper: {
		width: 60,
		height: 60,
		borderRadius: 6,
		overflow: "hidden"
	},
	uploadedImage: {
		backgroundColor: styleVars.greys.medium,
		width: 60,
		height: 60
	},
	uploadingOverlay: {
		backgroundColor: "rgba(0,0,0,0.4)",
		...StyleSheet.absoluteFillObject
	},
	errorIcon: {
		width: 24,
		height: 24,
		tintColor: "#fff"
	},
	errorText: {
		color: "#fff",
		fontSize: 10,
		fontWeight: "500",
		marginTop: 2
	},
	abortButton: {
		width: 12,
		height: 12,
		tintColor: "#fff"
	}
});

export default withTheme(_componentStyles)(UploadedImage);
