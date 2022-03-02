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
import ContentRow from "../../ecosystems/ContentRow";
import ToggleRow from "../../atoms/ToggleRow";
import CheckList from "../../ecosystems/CheckList";
import { withTheme } from "../../themes";
//import styles from "../../styles";
import icons from "../../icons";

const NotificationSettingMutation = gql`
	mutation NotificationSettingMutation($id: String!, $extension: String!, $type: String!, $email: Boolean, $push: Boolean, $inline: Boolean) {
		mutateCore {
			changeNotificationSetting(id: $id, extension: $extension, type: $type, email: $email, push: $push, inline: $inline) {
				__typename
				id
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

class NotificationsSettingsTypeScreen extends Component {
	static navigationOptions = ({ navigation }) => {
		return {
			title: navigation.getParam("title") || ""
		};
	};

	constructor(props) {
		super(props);
		this.updateFromToggle = this.updateFromToggle.bind(this);
		this.updateFromChecklist = this.updateFromChecklist.bind(this);
		this.updateEmail = this.updateEmail.bind(this);

		const { email, inline, push } = this.props.navigation.state.params;

		this.state = {
			email: email.value,
			inline: inline.value && !push.value,
			push: push.value
		};
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevState.email !== this.state.email || prevState.push !== this.state.push || prevState.inline !== this.state.inline) {
			this.updatePreferences();
		}
	}

	async updatePreferences() {
		const { email, inline, push } = this.state;
		const { extension, type, id } = this.props.navigation.state.params;

		try {
			const { data } = await this.props.client.mutate({
				mutation: NotificationSettingMutation,
				variables: {
					id,
					extension,
					type,
					email,
					inline,
					push
				}
			});
		} catch (err) {
			// @todo show error
			console.log(err);
		}
	}

	getInlineToggle() {
		const { inline } = this.props.navigation.state.params;
		return <ToggleRow title={Lang.get("notification_inline_only")} value={this.state.inline} enabled={!inline.disabled} onToggle={this.updateFromToggle} />;
	}

	updateFromChecklist(item) {
		this.setState({
			push: item.key === "push",
			inline: item.key === "inline"
		});
	}

	updateFromToggle() {}

	updateEmail() {
		this.setState({
			email: !this.state.email
		});
	}

	getInlineChecklist() {
		const { inline, push } = this.props.navigation.state.params;

		const data = [
			{
				key: "push",
				title: Lang.get("notification_both"),
				checked: this.state.push
			},
			{
				key: "inline",
				title: Lang.get("notification_inline"),
				checked: this.state.inline
			},
			{
				key: "none",
				title: Lang.get("notification_none"),
				checked: !this.state.push && !this.state.inline
			}
		];

		return (
			<React.Fragment>
				<SectionHeader title={Lang.get("notification_types")} />
				<CheckList data={data} onPress={this.updateFromChecklist} />
			</React.Fragment>
		);
	}

	render() {
		const { email, inline, push, description } = this.props.navigation.state.params;
		const { styles } = this.props;

		return (
			<View style={styles.flex}>
				{description && (
					<View style={[styles.pWide, styles.mtStandard, styles.mbWide, styles.flexRow, styles.flexAlignStart]}>
						<Image source={icons.INFO} resizeMode="contain" style={[{ width: 20, height: 20 }, styles.lightImage, styles.mrStandard]} />
						<Text style={[styles.smallText, styles.backgroundLightText, styles.flexBasisZero, styles.flexGrow]}>{description}</Text>
					</View>
				)}
				{_.isNull(push) ? this.getInlineToggle() : this.getInlineChecklist()}
				{!_.isNull(email) && (
					<View style={styles.mtWide}>
						<View style={styles.rowsWrap}>
							<ToggleRow title={Lang.get("email_notification")} lastRow={true} value={this.state.email} enabled={!email.disabled} onToggle={this.updateEmail} />
						</View>
						<View style={[styles.mtTight, styles.mhWide]}>
							<Text style={[styles.lightText, styles.smallText]}>{Lang.get("email_notification_desc", { email: this.props.user.email })}</Text>
						</View>
					</View>
				)}
			</View>
		);
	}
}

export default compose(
	connect(state => ({
		user: state.user
	})),
	withApollo,
	withTheme()
)(NotificationsSettingsTypeScreen);
