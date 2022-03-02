import React, { Component } from "react";
import { Text, View, FlatList, ScrollView, SectionList } from "react-native";
import { compose } from "react-apollo";
import { connect } from "react-redux";

import SectionHeader from "../../../atoms/SectionHeader";
import SettingRow from "../../../atoms/SettingRow";
import ToggleRow from "../../../atoms/ToggleRow";
import { ContentView } from "../../../ecosystems/AppSettings";
import { toggleDarkMode } from "../../../redux/actions/app";
import { withTheme } from "../../../themes";

class AccountSettingsScreen extends Component {
	static navigationOptions = {
		title: "Account Settings"
	};

	constructor(props) {
		super(props);
		this.renderItem = this.renderItem.bind(this);
		this.renderSectionHeader = this.renderSectionHeader.bind(this);
		this.toggleDarkMode = this.toggleDarkMode.bind(this);

		this.state = {
			settingDarkMode: null
		};
	}

	toggleDarkMode() {
		this.setState({
			settingDarkMode: !this.props.app.darkMode
		});

		this.props.dispatch(toggleDarkMode(!this.props.app.darkMode));
	}

	getAccountSections() {
		return [
			{
				title: "Content View Behavior",
				first: true,
				data: [
					{
						key: "content_order"
					}
				]
			},
			{
				title: "Display Settings",
				first: true,
				data: [
					{
						key: "dark_mode"
					}
				]
			}
		];
	}

	renderItem({ item, index, section }) {
		if (item.key == "content_order") {
			return <ContentView />;
		} else if (item.key == "dark_mode") {
			return <ToggleRow title="Dark Mode" value={this.props.app.darkMode || this.state.settingDarkMode} onToggle={this.toggleDarkMode} />;
		}

		return <SettingRow data={item} />;
	}

	renderSectionHeader({ section }) {
		const { styles } = this.props;
		return (
			<View style={!section.first ? styles.mtExtraWide : null}>
				<SectionHeader title={section.title} />
			</View>
		);
	}

	render() {
		return (
			<SectionList
				sections={this.getAccountSections()}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				stickySectionHeadersEnabled={false}
			/>
		);
	}
}

export default compose(
	connect(state => ({
		app: state.app
	})),
	withTheme()
)(AccountSettingsScreen);
