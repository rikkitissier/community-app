import React, { PureComponent } from "react";
import { View } from "react-native";

import { withTheme } from "../themes";

class ShadowedArea extends PureComponent {
	constructor(props) {
		super(props);
	}

	setNativeProps(nativeProps) {
		this._root.setNativeProps(nativeProps);
	}

	render() {
		const { styles, componentStyles, style, hidden, children, ...props } = this.props;

		return (
			<View ref={component => (this._root = component)} style={[componentStyles.shadowedArea, hidden && styles.moderatedBackground, style]} {...props}>
				{children}
			</View>
		);
	}
}

const _componentStyles = styleVars => ({
	shadowedArea: {
		backgroundColor: styleVars.contentBackground,
		borderBottomWidth: 1,
		borderBottomColor: styleVars.borderColors.medium
	}
});

export default withTheme(_componentStyles)(ShadowedArea);
