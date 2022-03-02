import React, { Component } from "react";
import { Text, View, FlatList, ScrollView, SectionList, Platform, Image } from "react-native";
import * as Permissions from "expo-permissions";
import gql from "graphql-tag";
import { graphql, withApollo, compose } from "react-apollo";
import { connect } from "react-redux";
import _ from "underscore";

import Lang from "../../utils/Lang";
import { PlaceholderRepeater } from "../../ecosystems/Placeholder";
import NotificationSettingRow from "../../atoms/NotificationSettingRow";
import SectionHeader from "../../atoms/SectionHeader";
import ErrorBox from "../../atoms/ErrorBox";
import { withTheme } from "../../themes";
import icons from "../../icons";

/* Main query, passed as a HOC */
const NotificationQuery = gql`
	query NotificationTypeQuery {
		core {
			notificationTypes {
				id
				extension
				group
				type
				name
				description
				lang
				inline {
					disabled
					default
					value
				}
				push {
					disabled
					default
					value
				}
				email {
					disabled
					default
					value
				}
			}
		}
	}
`;

const COMBINED_GROUPS = ["core_content", "core_mystuff", "core_messenger", "core_clubs", "core_profile"];

class NotificationsSettingsScreen extends Component {
	static navigationOptions = ({ navigation }) => ({
		title: Lang.get("notification_settings")
	});

	constructor(props) {
		super(props);

		this.state = {
			hasPermission: true // We'll assume true to start with, rather than flashing the error
		};
	}

	componentDidMount() {
		this.checkNotificationPermissions();
	}

	async checkNotificationPermissions() {
		const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);

		if (status !== "granted") {
			this.setState({
				hasPermission: false
			});
		}
	}

	getNotificationSections() {
		const sections = {};
		const types = this.props.data.core.notificationTypes;

		types.forEach(type => {
			let section = "core";

			if (COMBINED_GROUPS.indexOf(type.extension.toLowerCase()) === -1) {
				section = type.extension;
			}

			if (_.isUndefined(sections[section])) {
				sections[section] = {
					title: section === "core" ? Lang.get("notification_group_core") : type.group,
					data: []
				};
			}

			if (type.push !== null) {
				sections[section].data.push(type);
			}

			if (type.type === "content") {
				console.log(type);
			}
		});

		return Object.values(sections).filter(section => section.data.length);
	}

	getListFooter() {
		if (Platform.OS !== "android") {
			return;
		}

		const { styles } = this.props;

		return (
			<View style={styles.pWide}>
				<Text style={[styles.backgroundLightText, styles.standardText]}>{Lang.get("notification_android_extra")}</Text>
				<Text style={[styles.backgroundLightText, styles.standardText]}>{Lang.get("notification_android_extra_desc")}</Text>
			</View>
		);
	}

	getListHeader() {
		if (this.state.hasPermission) {
			return null;
		}

		let platformInstructions;

		if (Platform.OS === "ios") {
			platformInstructions = Lang.get("notification_instructions_ios");
		} else {
			platformInstructions = Lang.get("notification_instructions_android");
		}

		const { styles } = this.props;

		return (
			<View style={[styles.pWide, styles.mtStandard, styles.flexRow, styles.flexAlignStart]}>
				<Image source={icons.INFO} resizeMode="contain" style={[{ width: 20, height: 20 }, styles.mrStandard, styles.lightImage]} />
				<Text style={[styles.smallText, styles.backgroundLightText, styles.flexBasisZero, styles.flexGrow]}>
					{Lang.get("notification_instructions")} {platformInstructions}
				</Text>
			</View>
		);
	}

	render() {
		if (this.props.data.loading) {
			return (
				<PlaceholderRepeater repeat={7}>
					<NotificationSettingRow loading />
				</PlaceholderRepeater>
			);
		} else if (this.props.data.error) {
			return <ErrorBox message={Lang.get("notifications_error")} />;
		} else {
			return (
				<View style={{ flex: 1 }}>
					<SectionList
						sections={this.getNotificationSections()}
						extraData={this.props.data.core.notificationTypes}
						keyExtractor={item => item.id}
						renderItem={({ item }) => <NotificationSettingRow data={item} />}
						renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
						ListFooterComponent={this.getListFooter()}
						ListHeaderComponent={this.getListHeader()}
					/>
				</View>
			);
		}
	}
}

export default compose(
	connect(state => ({
		user: state.user
	})),
	withApollo,
	graphql(NotificationQuery),
	withTheme()
)(NotificationsSettingsScreen);
