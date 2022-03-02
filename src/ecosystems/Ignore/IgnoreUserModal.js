import React, { Component } from "react";
import { Text, View, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from "react-native";
import gql from "graphql-tag";
import { graphql, compose, withApollo } from "react-apollo";
import Modal from "react-native-modal";
import _ from "underscore";

import Lang from "../../utils/Lang";
import ContentRow from "../../ecosystems/ContentRow";
import ToggleRow from "../../atoms/ToggleRow";
import getErrorMessage from "../../utils/getErrorMessage";
import { PlaceholderRepeater } from "../../ecosystems/Placeholder";
import { withTheme } from "../../themes";

const LIMIT = 25;

const IgnoreUserMutation = gql`
	mutation IgnoreUser($member: Int!, $type: String!, $isIgnoring: Boolean!) {
		mutateCore {
			ignoreMember(member: $member, type: $type, isIgnoring: $isIgnoring) {
				id
				type
				isBeingIgnored
			}
		}
	}
`;

class IgnoreUserModal extends Component {
	constructor(props) {
		super(props);
		this.state = {};

		this._toggleHandlers = {};

		this.toggleIgnore = this.toggleIgnore.bind(this);

		this.errors = {
			INVALID_TYPE: Lang.get("error_ignore_type"),
			INVALID_MEMBER: Lang.get("error_ignore_member"),
			NO_IGNORE_SELF: Lang.get("error_ignore_no_self"),
			NO_IGNORE_MEMBER: Lang.get("error_ignore_member")
		};
	}

	getToggleHandler(type) {
		if (_.isUndefined(this._toggleHandlers[type])) {
			this._toggleHandlers[type] = value => {
				this.toggleIgnore(type, value);
			};
		}

		return this._toggleHandlers[type];
	}

	async toggleIgnore(type, value) {
		this.setState({
			[`ignore_${type}`]: value
		});

		try {
			const { data } = await this.props.mutate({
				variables: {
					member: parseInt(this.props.member),
					type: type,
					isIgnoring: Boolean(value)
				}
			});
		} catch (err) {
			console.log(err);
			const errorMessage = getErrorMessage(err, this.errors);
			Alert.alert(Lang.get("error"), Lang.get("error_ignoring_member") + errorMessage, [{ text: Lang.get("ok") }], { cancelable: false });
		}
	}

	render() {
		const { styles, componentStyles } = this.props;
		let height = 250;

		const content = this.props.ignoreTypes.map(type => {
			const value = !_.isUndefined(this.state[`ignore_${type.type}`]) ? this.state[`ignore_${type.type}`] : type.isBeingIgnored;

			return (
				<ContentRow key={type.type}>
					<ToggleRow title={type.lang} value={value} onToggle={this.getToggleHandler(type.type)} />
				</ContentRow>
			);
		});

		return (
			<Modal
				style={styles.modalAlignBottom}
				swipeDirection="down"
				onSwipeComplete={this.props.close}
				onBackdropPress={this.props.close}
				isVisible={this.props.visible}
				propagateSwipe={true}
			>
				<View style={styles.modalInner}>
					<View style={styles.modalHandle} />
					<View style={styles.modalHeader}>
						<View style={componentStyles.titleBar}>
							<Text style={[styles.modalTitle, componentStyles.title]}>{Lang.get("ignore_options", { name: this.props.memberName })}</Text>
						</View>
						<TouchableOpacity onPress={this.props.close} style={styles.modalCloseTouchable}>
							<Image source={require("../../../resources/close_circle.png")} resizeMode="contain" style={styles.modalClose} />
						</TouchableOpacity>
					</View>
					<View style={{ height }}>
						<View>{content}</View>
					</View>
				</View>
			</Modal>
		);
	}
}

const _componentStyles = styleVars => ({
	titleBar: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center"
	},
	title: {
		marginHorizontal: 0,
		marginRight: styleVars.spacing.standard
	}
});

export default compose(
	graphql(IgnoreUserMutation),
	withApollo,
	withTheme(_componentStyles)
)(IgnoreUserModal);
