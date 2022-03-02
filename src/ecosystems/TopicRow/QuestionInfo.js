import React, { Component } from "react";
import { Text, Image, View, StyleSheet, TouchableHighlight } from "react-native";

import Lang from "../../utils/Lang";
import UnreadIndicator from "../../atoms/UnreadIndicator";
import LockedIcon from "../../atoms/LockedIcon";
import { withTheme } from "../../themes";

const QuestionInfo = ({ styles, componentStyles, rowStyles, ...props }) => (
	<View style={[rowStyles.topicRowInner, componentStyles.questionRowInner]}>
		<View style={rowStyles.topicInfo}>
			<View style={rowStyles.topicTitle}>
				{Boolean(props.data.isLocked) && <LockedIcon style={rowStyles.lockedIcon} />}
				<Text style={[rowStyles.topicTitleText, props.showAsUnread ? styles.title : styles.titleRead]} numberOfLines={1}>
					<UnreadIndicator show={props.data.unread} />
					{props.data.title}
				</Text>
			</View>
			<Text style={[rowStyles.topicSnippet, styles.text]} numberOfLines={1}>
				{props.data.snippet}
			</Text>
		</View>
		<View style={[styles.flexColumn, styles.flexJustifyCenter, styles.mlWide, styles.phWide, componentStyles.questionInfo]}>
			<Text style={[styles.centerText, styles.largeText, styles.boldText, styles.text, componentStyles.voteCount]}>{props.data.questionVotes}</Text>
			<Text style={[styles.centerText, styles.tinyText, styles.lightText]}>{Lang.pluralize(Lang.get("votes_nonum"), props.data.questionVotes)}</Text>
		</View>
	</View>
);

const _componentStyles = styleVars => ({
	questionRowInner: {
		paddingRight: 0
	},
	questionInfo: {
		minWidth: 80,
		borderLeftWidth: 1,
		borderLeftColor: styleVars.borderColors.medium
	},
	voteCount: {
		fontSize: 18,
		fontWeight: "300"
	}
});

export default withTheme(_componentStyles)(QuestionInfo);
