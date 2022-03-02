import React, { memo } from "react";
import { Text, View, StyleSheet } from "react-native";
import PropTypes from "prop-types";

import ViewMeasure from "./ViewMeasure";
import { withTheme } from "../themes";

const UnreadBar = ({ componentStyles, label = Lang.get("unread_comments"), ...props }) => (
	<ViewMeasure style={componentStyles.wrapper} onLayout={props.onLayout} id="unread">
		<Text style={componentStyles.text}>{label.toUpperCase()}</Text>
	</ViewMeasure>
);

const _componentStyles = styleVars => ({
	wrapper: {
		marginHorizontal: 12,
		marginBottom: 27,
		marginTop: 20,
		height: 1,
		borderRadius: 5,
		backgroundColor: styleVars.lightText
	},
	text: {
		fontSize: 10,
		fontWeight: "500",
		backgroundColor: styleVars.appBackground,
		color: styleVars.lightText,
		textAlign: "center",
		position: "absolute",
		paddingRight: 9,
		left: 0,
		top: -5
	}
});

export default withTheme(_componentStyles)(memo(UnreadBar));

UnreadBar.defaultProps = {
	label: "Unread Comments"
};

UnreadBar.propTypes = {
	label: PropTypes.string
};
