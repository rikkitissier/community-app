import React, { Component } from "react";
import { TouchableOpacity, ScrollView, Image, SectionList, Text, View, StyleSheet, Alert } from "react-native";
import Modal from "react-native-modal";
import { compose } from "react-apollo";
import _ from "underscore";

import Lang from "../../utils/Lang";
import UserPhoto from "../../atoms/UserPhoto";
import CheckList from "../../ecosystems/CheckList";
import Button from "../../atoms/Button";
import SectionHeader from "../../atoms/SectionHeader";
import ToggleRow from "../../atoms/ToggleRow";
import UserPhotoList from "../../atoms/UserPhotoList";
import withInsets from "../../hocs/withInsets";
import { withTheme } from "../../themes";

class FollowModal extends Component {
	constructor(props) {
		super(props);

		const selectedItem = this.props.followData.followOptions.find(item => item.selected);
		const isAnonymous = this.props.followData.followType === "ANONYMOUS";

		this.state = {
			selectedFollowOption: selectedItem ? selectedItem.type : this.props.followData.followOptions[0].type,
			isAnonymous
		};

		this.toggleNotificationOption = this.toggleNotificationOption.bind(this);
		this.toggleAnonymousOption = this.toggleAnonymousOption.bind(this);
	}

	getFollowers() {
		const { styles, componentStyles, followData } = this.props;

		if (followData.followers !== null && !followData.followers.length && followData.anonFollowCount === 0) {
			return null;
		}

		const totalCount = followData.followCount + followData.anonFollowCount;
		const userPhotoData = _.sample(followData.followers, 10).map(user => ({
			id: user.id,
			url: user.photo,
			online: user.isOnline
		}));
		const extraNumber = totalCount - userPhotoData.length;

		return (
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={[styles.phWide, styles.pvExtraWide]}
				contentContainerStyle={[styles.flexRow, styles.flexAlignCenter, styles.flexJustifyStart]}
			>
				<View style={[styles.flex, styles.flexAlignCenter, styles.flexBasisZero, styles.prWide, componentStyles.followerCountWrap]}>
					<Text style={[styles.smallText, styles.lightText]}>{Lang.get("followers")}</Text>
					<Text style={[styles.text, styles.mediumText, styles.largeText]}>{totalCount}</Text>
				</View>
				{Boolean(userPhotoData.length) && (
					<View style={[styles.flexRow, styles.flexGrow, styles.flexAlignCenter]}>
						<UserPhotoList data={userPhotoData} size={36} />
						{extraNumber > 0 && <Text style={[styles.lightText, styles.contentText, styles.mlStandard]}>+{extraNumber}</Text>}
					</View>
				)}
			</ScrollView>
		);
	}

	renderFollowUser(item) {
		if (item.id == "andMore") {
			return (
				<View style={componentStyles.andMoreBubble}>
					<Text style={componentStyles.andMoreText}>+{Lang.pluralize(Lang.get("x_more"), item.count)}</Text>
				</View>
			);
		}

		return <UserPhoto url={item.photo} size={36} />;
	}

	/**
	 * Return the buttons that will show in the follow modal
	 *
	 * @return 	Component
	 */
	getFollowButtons() {
		const { styles, componentStyles } = this.props;

		if (this.props.followData.isFollowing) {
			return (
				<View style={componentStyles.buttonWrap}>
					<Button type="primary" filled size="large" title={Lang.get("follow_save")} style={styles.mbTight} onPress={() => this._follow()} />
					<Button type="warning" filled size="large" title={Lang.get("unfollow")} onPress={this.props.onUnfollow} />
				</View>
			);
		} else {
			return (
				<View style={componentStyles.buttonWrap}>
					<Button type="primary" filled size="large" title={Lang.get("follow")} onPress={() => this._follow()} />
				</View>
			);
		}
	}

	/**
	 * onPress handler for Follow or Save button which in turn calls
	 * the handler passed down to us, with the selected options
	 *
	 * @return 	void
	 */
	_follow() {
		const data = {
			option: this.state.selectedFollowOption,
			anonymous: this.state.isAnonymous
		};

		if (this.state.selectedFollowOption === null) {
			Alert.alert(Lang.get("error"), Lang.get("error_select_follow_option"), [{ text: Lang.get("ok") }], { cancelable: false });
			return;
		}

		this.props.onFollow(data);
	}

	/**
	 * Return the CheckList component with the follow options the user can select
	 *
	 * @return 	Component
	 */
	getChecklist() {
		const { styles } = this.props;

		if (this.props.followData.followOptions.length <= 1) {
			return null;
		}

		const followOptions = this.props.followData.followOptions.map(item => ({
			key: item.type,
			title: Lang.get("follow_" + item.type),
			checked: this.state.selectedFollowOption === item.type
		}));

		return (
			<View style={styles.rowsWrap}>
				<CheckList type="radio" data={followOptions} onPress={this.toggleNotificationOption} />
			</View>
		);
	}

	/**
	 * Returns the structure we'll pass into SectionList
	 *
	 * @return 	array
	 */
	getSectionData() {
		return [
			...(this.props.followData.followOptions.length > 1
				? [
						{
							title: Lang.get("follow_freq"),
							data: ["followChoices"]
						}
				  ]
				: []),
			{
				title: Lang.get("follow_privacy"),
				data: ["anonToggle"]
			}
		];
	}

	/**
	 * Event handler for selecting a CheckList option. Update our state with
	 * the selected choice.
	 *
	 * @param 	object 		option 		The full data for the selected it
	 * @return 	void
	 */
	toggleNotificationOption(option) {
		if (!option || !option.key) {
			this.setState({
				selectedFollowOption: null
			});
		}

		this.setState({
			selectedFollowOption: option.key
		});
	}

	/**
	 * Event handler for toggling the anonymous option. Update state with the new value.
	 *
	 * @param 	boolean 	value 		Anonymous on or off
	 * @return 	void
	 */
	toggleAnonymousOption(value) {
		this.setState({
			isAnonymous: value
		});
	}

	/**
	 * Renders a cell for the SectionList. We use SectionList here so that we have header
	 * support without needing to build them manually
	 *
	 * @param 	object 		item 		The current item we're building
	 * @return 	Component
	 */
	renderItem(item) {
		const { styles } = this.props;

		if (item.item === "followChoices") {
			return this.getChecklist();
		} else if (item.item === "followers") {
			return this.getFollowers();
		} else {
			return (
				<View style={styles.rowsWrap}>
					<ToggleRow title={Lang.get("follow_anon")} value={this.state.isAnonymous} onToggle={this.toggleAnonymousOption} />
				</View>
			);
		}
	}

	render() {
		const { componentStyles, styles, styleVars } = this.props;
		return (
			<Modal
				style={styles.modalAlignBottom}
				swipeDirection="down"
				onSwipeComplete={this.props.close}
				onBackdropPress={this.props.close}
				isVisible={this.props.isVisible}
			>
				<View style={[styles.modalInner, { paddingBottom: 0 }]}>
					<View style={styles.modalHandle} />
					<View style={styles.modalHeader}>
						<Text style={[styles.modalTitle]}>{Lang.get("follow")}</Text>
						<TouchableOpacity style={styles.modalCloseTouchable} onPress={this.props.close}>
							<Image source={require("../../../resources/close_circle.png")} resizeMode="contain" style={styles.modalClose} />
						</TouchableOpacity>
					</View>
					{this.getFollowers()}
					<SectionList
						sections={this.getSectionData()}
						renderItem={item => this.renderItem(item)}
						renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
						keyExtractor={item => item}
					/>
					<View
						style={[
							styles.lightBackground,
							componentStyles.modalBody,
							this.props.insets.bottom > 0 ? { paddingBottom: this.props.insets.bottom + styleVars.spacing.standard } : null
						]}
					>
						{this.getFollowButtons()}
					</View>
				</View>
			</Modal>
		);
	}
}

const _componentStyles = styleVars => ({
	modal: {
		justifyContent: "flex-end",
		margin: 0,
		padding: 0
	},
	followerCountWrap: {
		minWidth: 100
	},
	andMore: {
		backgroundColor: "#f0f0f0",
		height: 36,
		borderRadius: 36,
		paddingHorizontal: 15,
		display: "flex",
		justifyContent: "center",
		alignItems: "center"
	},
	andMoreText: {
		color: "#888",
		fontSize: 13
	},
	modalBody: {
		padding: styleVars.spacing.wide
	},
	buttonWrap: {
		marginTop: -1
	}
});

export default compose(
	withInsets,
	withTheme(_componentStyles)
)(FollowModal);
