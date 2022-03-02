import React, { Component } from "react";
import { Text, Image, ScrollView, View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import _ from "underscore";

class NoopScreen extends Component {
	static navigationOptions = ({ navigation }) => {
		return {
			title: ""
		};
	};

	constructor(props) {
		super(props);
	}

	render() {
		return null;
	}
}

export default NoopScreen;
