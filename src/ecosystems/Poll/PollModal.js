import React, { Component } from "react";
import { Text, View, StyleSheet } from "react-native";
import Modal from "react-native-modal";
import _ from "underscore";

import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";
import icons from "../../icons";

const PollModal = ({ styles, componentStyles, ...props }) => (
	<Modal style={[styles.modal, componentStyles.modal]} swipeDirection="down" onSwipeComplete={props.close} isVisible={props.isVisible}>
		<View style={[styles.modalInner]}>
			<View style={styles.modalHeader}>
				<Text>title</Text>
			</View>
			<View style={styles.flex}>
				<Text>content</Text>
			</View>
		</View>
	</Modal>
);

const _componentStyles = {
	modal: {
		marginTop: 80,
		marginBottom: 80
	}
};

export default withTheme(_componentStyles)(PollModal);
