import React, { PureComponent } from "react";
import { Text, Image, View, StatusBar, StyleSheet, TouchableOpacity } from "react-native";
import Modal from "react-native-modal";
import ImageViewer from "react-native-image-zoom-viewer";
import _ from "underscore";

import Lang from "../../utils/Lang";
import getImageUrl from "../../utils/getImageUrl";
import { withTheme } from "../../themes";
import icons from "../../icons";

class Lightbox extends PureComponent {
	constructor(props) {
		super(props);
		this.close = this.close.bind(this);
	}

	close() {
		this.props.close();
	}

	/**
	 * Reformat our incoming data to the format ImageViewer needs:
	 * [{ url: ... }, { url: ... }]
	 *
	 * @param 	number 		offset 		Offset to set
	 * @return 	void
	 */
	getImages() {
		return Object.keys(this.props.data).map(url => ({ url: getImageUrl(url) }));
	}

	/**
	 * Return the index of the initial image to show
	 *
	 * @return 	int
	 */
	getInitialIndex() {
		if (this.props.initialImage) {
			const index = Object.keys(this.props.data).findIndex(url => url === this.props.initialImage);

			return index < 0 ? 0 : index;
		}

		return 0;
	}

	/**
	 * Render
	 *
	 * @return 	Component
	 */
	render() {
		const { componentStyles } = this.props;

		return (
			<Modal style={componentStyles.modal} avoidKeyboard={true} animationIn="fadeIn" isVisible={this.props.isVisible} onBackButtonPress={this.close}>
				<StatusBar hidden showHideTransition="fade" />
				<ImageViewer imageUrls={this.getImages()} index={this.getInitialIndex()} enableSwipeDown onSwipeDown={this.close} />
				<TouchableOpacity style={componentStyles.closeButton} onPress={this.close}>
					<Image source={icons.CROSS} style={componentStyles.closeButtonIcon} />
				</TouchableOpacity>
			</Modal>
		);
	}
}

const _componentStyles = {
	modal: {
		...StyleSheet.absoluteFillObject,
		padding: 0,
		margin: 0
	},
	closeButton: {
		position: "absolute",
		top: 30,
		left: 20
	},
	closeButtonIcon: {
		tintColor: "#fff",
		width: 34,
		height: 34
	}
};

export default withTheme(_componentStyles)(Lightbox);
