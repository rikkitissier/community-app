import React, { Component } from "react";
import { View, Animated } from "react-native";
import Modal from "react-native-modal";
import _ from "underscore";

import ReactionChoice from "./ReactionChoice";
import { withTheme } from "../themes";

class ReactionModal extends Component {
	constructor(props) {
		super(props);
		this.animatedValue = [];
		this._pressHandlers = {};

		props.reactions.map(reaction => {
			this.animatedValue[reaction.id] = new Animated.Value(-400);
		});

		this.onModalHide = this.onModalHide.bind(this);
		this.onModalShow = this.onModalShow.bind(this);
	}

	/**
	 * Starts the animation, staggering each reaction to create a cascade effect
	 *
	 * @return 	void
	 */
	startAnimation() {
		const animations = this.props.reactions.map(reaction => {
			return Animated.timing(this.animatedValue[reaction.id], {
				toValue: 0,
				duration: 450,
				useNativeDriver: false
			});
		});

		Animated.stagger(35, animations).start();
	}

	/**
	 * Event handler for modal showing
	 *
	 * @return 	void
	 */
	onModalShow() {
		this.startAnimation();
	}

	/**
	 * Event handler for modal hiding
	 *
	 * @return 	void
	 */
	onModalHide() {
		// Reset animated values
		this.props.reactions.map(reaction => {
			this.animatedValue[reaction.id] = new Animated.Value(-400);
		});
	}

	/**
	 * Event handler for tapping a reaction. CLoses the modal and fires a callback passed in as a prop
	 *
	 * @return 	void
	 */
	pressReaction(reactionID) {
		this.props.closeModal();
		this.props.onReactionPress(reactionID);
	}

	/**
	 * Memoization function that returns an event handler for a reaction
	 *
	 * @param 	number 		id 		Reaction ID
	 * @return 	function
	 */
	getPressReactionHandler(id) {
		if (_.isUndefined(this._pressHandlers[id])) {
			this._pressHandlers[id] = () => this.pressReaction(id);
		}

		return this._pressHandlers[id];
	}

	render() {
		const { componentStyles } = this.props;
		const animatedComponents = this.props.reactions.map(reaction => (
			<View key={reaction.id} style={{ height: 50 }}>
				<Animated.View style={{ position: "absolute", right: this.animatedValue[reaction.id] }}>
					<ReactionChoice name={reaction.name} image={reaction.image} onPress={this.getPressReactionHandler(reaction.id)} />
				</Animated.View>
			</View>
		));

		return (
			<Modal
				style={componentStyles.modal}
				isVisible={this.props.visible}
				animationInTiming={100}
				onBackdropPress={this.props.closeModal}
				onModalHide={this.onModalHide}
				onModalShow={this.onModalShow}
			>
				<View style={componentStyles.container}>{animatedComponents}</View>
			</Modal>
		);
	}
}

const _componentStyles = {
	modal: {
		flex: 1,
		display: "flex",
		justifyContent: "flex-end"
	}
};

export default withTheme(_componentStyles)(ReactionModal);
