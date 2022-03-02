import React, { Component } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { compose } from "react-apollo";

import Badge from "../../atoms/Badge";
import NavigationTabIcon from "./NavigationTabIcon";
import { withTheme } from "../../themes";

const NavigationTabNotification = ({ componentStyles, ...props }) => {
	return (
		<NavigationTabIcon {...props}>
			{props.user.notificationCount > 0 && <Badge count={props.user.notificationCount} style={componentStyles.notificationBadge} />}
		</NavigationTabIcon>
	);
};

const _componentStyles = {
	notificationBadge: {
		position: "absolute",
		top: -11,
		right: -8
	}
};

export default compose(
	connect(state => ({
		user: state.user
	})),
	withTheme(_componentStyles)
)(NavigationTabNotification);
