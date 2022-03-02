import React, { PureComponent } from "react";
import { View } from "react-native";

import { withTheme } from "../themes";
//import styles, { styleVars } from "../styles";

class ActionBar extends PureComponent {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		if (this.props.onRef && this._wrapperRef) {
			this.props.onRef(this._wrapperRef);
		}
	}

	render() {
		const { styles, componentStyles } = this.props;

		return (
			<View
				style={[styles.pTight, componentStyles.pager, this.props.light ? styles.actionBarLight : styles.actionBarDark, this.props.style]}
				ref={ref => (this._wrapperRef = ref)}
			>
				{this.props.children}
			</View>
		);
	}
}

const _componentStyles = styleVars => ({
	pager: {
		height: 45,
		minHeight: 45,
		padding: 7,
		display: "flex",
		alignItems: "center",
		justifyContent: "center"
	}
});

export default withTheme(_componentStyles)(ActionBar);
