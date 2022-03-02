import React, { Component } from "react";
import { Text, View, SectionList, TouchableOpacity } from "react-native";
import { compose } from "react-apollo";
import { connect } from "react-redux";
import _ from "underscore";

import SectionHeader from "../../atoms/SectionHeader";
import SettingRow from "../../atoms/SettingRow";
import { ContentView } from "../../ecosystems/AppSettings";
import { loadCommunityLanguages } from "../../redux/actions/app";
import { withTheme } from "../../themes";

class MultiSettingsScreen extends Component {
	static navigationOptions = ({ navigation }) => ({
		title: "Preferences"
	});

	constructor(props) {
		super(props);

		this.state = {
			showLogs: false
		};

		this.renderSectionHeader = this.renderSectionHeader.bind(this);
		this.showLogs = this.showLogs.bind(this);
	}

	/**
	 * Load items in this category as soon as we mount
	 *
	 * @return 	void
	 */
	componentDidMount() {
		this.props.dispatch(loadCommunityLanguages());
	}

	showLogs() {
		this.setState({
			showLogs: true
		});
	}

	/**
	 * Return the settings list items
	 *
	 * @return array
	 */
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
			}
			/*{
				title: "Enabled Notifications",
				first: false,
				data: []
			}*/
		];
	}

	/**
	 * Render a setting list item. Uses generic row unless otherwise directed
	 *
	 * @return Component
	 */
	renderItem({ item, index, section }) {
		if (item.key == "content_order") {
			return <ContentView />;
		}

		return <SettingRow data={item} />;
	}

	/**
	 * Render a section header, applying extra top padding if we're not the first section
	 *
	 * @return array
	 */
	renderSectionHeader({ section }) {
		const { styles } = this.props;
		return (
			<View style={!section.first ? styles.mtExtraWide : null}>
				<SectionHeader title={section.title} />
			</View>
		);
	}

	render() {
		const { styles } = this.props;

		return (
			<React.Fragment>
				<SectionList
					sections={this.getAccountSections()}
					renderItem={this.renderItem}
					renderSectionHeader={this.renderSectionHeader}
					SectionSeparatorComponent={this.renderSectionSeparator}
					stickySectionHeadersEnabled={false}
				/>

				{this.state.showLogs && (
					<View>
						<Text style={[styles.lightText]}>{this.props.app.messages.join("\n")}</Text>
					</View>
				)}
			</React.Fragment>
		);
	}
}

export default compose(
	connect(state => ({
		app: state.app
	})),
	withTheme()
)(MultiSettingsScreen);
