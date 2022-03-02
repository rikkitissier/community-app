import React, { memo } from "react";
import { Text, Image, View, StyleSheet, TouchableOpacity } from "react-native";

import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";
import icons from "../../icons";

const QuestionVote = props => {
	const { componentStyles, styles } = props;
	const voteUpIcon = props.hasVotedUp ? icons.VOTE_UP_SOLID : icons.VOTE_UP;
	const voteDownIcon = props.hasVotedDown && props.downvoteEnabled ? icons.VOTE_DOWN_SOLID : icons.VOTE_DOWN;

	return (
		<View style={[styles.phVeryTight, styles.flexColumn, styles.flexAlignCenter, props.smaller ? componentStyles.wrapperSmall : componentStyles.wrapper]}>
			<TouchableOpacity onPress={props.canVoteUp ? props.onVoteUp : null} style={props.smaller ? styles.mbVeryTight : null}>
				<Image
					source={voteUpIcon}
					resizeMode="contain"
					style={[
						componentStyles.voteArrow,
						!Boolean(props.canVoteUp) && !Boolean(props.hasVotedUp) ? componentStyles.voteDisabled : null // Disable arrow if they can't vote, and haven't voted
					]}
				/>
			</TouchableOpacity>
			<Text style={[props.smaller ? styles.standardText : styles.largeText, styles.mediumText, styles.centerText, styles.text]}>{props.score}</Text>
			{Boolean(props.downvoteEnabled) && (
				<TouchableOpacity onPress={props.canVoteDown ? props.onVoteDown : null} style={props.smaller ? styles.mtVeryTight : null}>
					<Image
						source={voteDownIcon}
						resizeMode="contain"
						style={[
							componentStyles.voteArrow,
							!Boolean(props.canVoteDown) && !Boolean(props.hasVotedDown) ? componentStyles.voteDisabled : null // Disable arrow if they can't vote, and haven't voted
						]}
					/>
				</TouchableOpacity>
			)}
		</View>
	);
};

const _componentStyles = styleVars => ({
	wrapper: {
		width: 70
	},
	wrapperSmall: {
		width: 56
	},
	voteArrow: {
		width: 25,
		height: 20,
		tintColor: styleVars.text
	},
	voteDisabled: {
		opacity: 0.1
	}
});

export default withTheme(_componentStyles)(memo(QuestionVote));
