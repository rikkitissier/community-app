import React, { Component, memo } from "react";
import { Text, View, FlatList, Image, StyleSheet, TouchableOpacity } from "react-native";
import { compose } from "react-apollo";
import { connect } from "react-redux";
import _ from "underscore";

import NavigationService from "../../utils/NavigationService";
import ContentRow from "../../ecosystems/ContentRow";
import LargeTitle from "../../atoms/LargeTitle";
import licenseJson from "../../../licenses.json";
import { withTheme } from "../../themes";

const reg = /((https?:\/\/)?(www\.)?github\.com\/)?(@|#!\/)?([A-Za-z0-9_]{1,15})(\/([-a-z]{1,20}))?/i;

class LicensesScreen extends Component {
	static navigationOptions = ({ navigation }) => ({
		headerTitle: "Legal"
	});

	constructor(props) {
		super(props);
		this.renderItem = this.renderItem.bind(this);
		this.keyExtractor = this.keyExtractor.bind(this);
	}

	renderItem({ item }) {
		const { styles } = this.props;

		return (
			<ContentRow unread style={[styles.pvStandard, styles.phWide]} showArrow>
				<TouchableOpacity onPress={() => item.licenseUrl && NavigationService.navigate(item.licenseUrl, {}, { forceBrowser: true })}>
					<Text style={styles.smallItemTitle}>
						{item.name} by {item.username}
					</Text>
					<Text style={styles.lightText}>{item.licenses}</Text>
				</TouchableOpacity>
			</ContentRow>
		);
	}

	keyExtractor(item) {
		return item.id;
	}

	getLicenseData() {
		if (!this._licenseData) {
			this._licenseData = Object.keys(licenseJson).map(pkg => {
				const { licenses, ...license } = licenseJson[pkg];
				const [name, version] = pkg.split("@");
				let username = this.getUsernameFromGithub(license.repository) || this.getUsernameFromGithub(license.licenseUrl);

				if (username) {
					username = username.charAt(0).toUpperCase() + username.slice(1);
				}

				return {
					id: pkg,
					pkg,
					name,
					version,
					username,
					licenses: licenses.slice(0, 405),
					userUrl: username ? `http://github.com/${username}` : "",
					userImage: username ? `http://github.com/${username}.png` : "",
					...license
				};
			});
		}

		return this._licenseData;
	}

	getUsernameFromGithub(url) {
		if (!url) {
			return null;
		}

		const components = reg.exec(url);
		if (components && components.length > 5) {
			return components[5];
		}

		return null;
	}

	getHeaderComponent() {
		const { styles } = this.props;
		return (
			<React.Fragment>
				<LargeTitle>Third-party Licenses</LargeTitle>
				<View style={[styles.mhWide, styles.mbWide]}>
					<Text style={[styles.text, styles.standardText]}>
						We are grateful to the following authors and organizations, who make their projects freely available to all.
					</Text>
				</View>
			</React.Fragment>
		);
	}

	render() {
		const { styles } = this.props;
		const licenseData = this.getLicenseData();

		return (
			<FlatList
				ListHeaderComponent={this.getHeaderComponent()}
				keyExtractor={this.keyExtractor}
				renderItem={this.renderItem}
				data={licenseData}
				style={styles.flex}
			/>
		);
	}
}

export default compose(
	connect(state => ({
		site: state.site
	})),
	withTheme()
)(LicensesScreen);

const componentStyles = StyleSheet.create({
	pkgImage: {
		width: 50,
		minHeight: 50
	}
});
