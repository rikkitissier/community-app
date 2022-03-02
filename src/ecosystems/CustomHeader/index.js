import React, { memo } from "react";
import { StatusBar, Platform } from "react-native";
import { Header } from "react-navigation";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeArea } from "react-native-safe-area-context";

import { withTheme } from "../../themes";

const CustomHeader = props => {
	const { styleVars, componentStyles } = props;
	const insets = useSafeArea();
	const height = 52 + (insets.top ? insets.top : 6);
	let content;

	if (props.content) {
		content = props.content;
	} else {
		content = <Header {...props} style={componentStyles.header} />;
	}

	return (
		<LinearGradient
			start={[0, 0]}
			end={[1, 0]}
			colors={props.transparent ? ["rgba(0,0,0,0)", "rgba(0,0,0,0)"] : styleVars.primaryBrand}
			style={[componentStyles.headerWrap, { height }]}
		>
			<StatusBar barStyle={styleVars.statusBarStyle} translucent />
			{content}
		</LinearGradient>
	);
};

const _componentStyles = {
	headerWrap: {
		overflow: "visible"
	}
};

export default withTheme(_componentStyles)(memo(CustomHeader));
