import React, { Component } from "react";
import { View, SectionList } from "react-native";
import _ from "underscore";

import SectionHeader from "../../atoms/SectionHeader";
import ProfileField from "./ProfileField";

class ProfileOverview extends Component {
	constructor(props) {
		super(props);

		this.renderItem = this.renderItem.bind(this);
		this.renderSectionHeader = this.renderSectionHeader.bind(this);
	}

	renderItem({ item }) {
		return <ProfileField key={item.key} title={item.data.title} value={item.data.value} type={item.data.type} />;
	}

	renderSectionHeader({ section }) {
		return <SectionHeader title={section.title} />;
	}

	render() {
		if (!this.props.isActive) {
			return <View />;
		}

		return (
			<View style={this.props.style}>
				<SectionList scrollEnabled={false} renderItem={this.renderItem} renderSectionHeader={this.renderSectionHeader} sections={this.props.profileData} />
			</View>
		);
	}
}

export default ProfileOverview;
