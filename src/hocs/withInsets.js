import React, { Component } from "react";
import { Text, View, FlatList, ScrollView, StyleSheet } from "react-native";
import _ from "underscore";
import { SafeAreaConsumer } from "react-native-safe-area-context";
import hoistNonReactStatics from "hoist-non-react-statics";

const withInsets = WrappedComponent => {
	class wrappedClass extends Component {
		constructor(props) {
			super(props);
		}

		render() {
			return <SafeAreaConsumer>{insets => <WrappedComponent insets={insets} {...this.props} />}</SafeAreaConsumer>;
		}
	}

	// This is necessary to bring static properties (e.g. react-navigation data) from components into the wrapped component
	hoistNonReactStatics(wrappedClass, WrappedComponent);

	return wrappedClass;
};

export default withInsets;
