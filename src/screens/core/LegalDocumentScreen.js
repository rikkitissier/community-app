import React, { Component } from "react";
import { Text, ScrollView, View } from "react-native";
import { compose } from "react-apollo";
import { connect } from "react-redux";
import _ from "underscore";

import Lang from "../../utils/Lang";
import RichTextContent from "../../ecosystems/RichTextContent";
import LargeTitle from "../../atoms/LargeTitle";
import { withTheme } from "../../themes";

class LegalDocumentScreen extends Component {
	static navigationOptions = ({ navigation }) => ({
		headerTitle: "Legal"
	});

	constructor(props) {
		super(props);
	}

	render() {
		const { styles } = this.props;

		return (
			<ScrollView style={styles.flex}>
				<LargeTitle>{Lang.get(`legal_${this.props.navigation.getParam("type")}`)}</LargeTitle>
				<View style={[styles.phWide]}>
					<RichTextContent>{this.props.navigation.getParam("content")}</RichTextContent>
				</View>
			</ScrollView>
		);
	}
}

export default compose(
	connect(state => ({
		site: state.site
	})),
	withTheme()
)(LegalDocumentScreen);
