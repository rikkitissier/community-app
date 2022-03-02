import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { compose } from "react-apollo";

import { PlaceholderContainer, PlaceholderElement } from "../../ecosystems/Placeholder";
import { withTheme } from "../../themes";
import withInsets from "../../hocs/withInsets";

/**
 * If we're on an iPhone with a notch, then we add 10pt extra space, so this method
 * takes a value and adds that spacing to it.
 */
const ProfilePlaceholder = ({ componentStyles, insets }) => {
	const notchCalc = val => val + insets.top / 2;

	return (
		<PlaceholderContainer style={{ flex: 1 }}>
			<PlaceholderContainer height={notchCalc(250)}>
				<PlaceholderElement width="100%" height={notchCalc(250)} from="#333" to="#444" top={0} left={0} />
				<PlaceholderElement circle radius={80} top={notchCalc(40)} left="50%" style={{ marginLeft: -40 }} />
				<PlaceholderElement width={150} left="50%" top={notchCalc(140)} style={{ marginLeft: -75 }} height={16} />
				<PlaceholderElement width={100} left="50%" top={notchCalc(165)} style={{ marginLeft: -50 }} height={12} />
				<PlaceholderElement width="100%" top={notchCalc(195)} left={0} right={0} height={60} style={{ opacity: 0.2 }} />
			</PlaceholderContainer>
			<PlaceholderContainer style={{ flex: 1 }}>
				<PlaceholderContainer height={48} style={componentStyles.loadingTabBar}>
					<PlaceholderElement width={70} height={14} top={17} left={13} />
					<PlaceholderElement width={80} height={14} top={17} left={113} />
					<PlaceholderElement width={90} height={14} top={17} left={225} />
					<PlaceholderElement width={70} height={14} top={17} left={345} />
				</PlaceholderContainer>
			</PlaceholderContainer>
		</PlaceholderContainer>
	);
};

const _componentStyles = styleVars => ({
	loadingTabBar: {
		backgroundColor: styleVars.tabBar.background,
		borderBottomWidth: 1,
		borderBottomColor: styleVars.tabBar.border
	}
});

export default compose(
	withInsets,
	withTheme(_componentStyles)
)(ProfilePlaceholder);
