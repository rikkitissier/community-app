import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

export default class PlaceholderRepeater extends PureComponent {
	constructor(props) {
		super(props);
	}

	render() {
		const output = [];
		const count = this.props.repeat || 5;

		for (let i = 0; i < count; i++) {
			output.push(
				React.Children.map(this.props.children, child => {
					return React.cloneElement(child, {
						key: i
					});
				})
			);
		}

		return <View style={[{ flex: 1 }, this.props.style]}>{output}</View>;
	}
}
