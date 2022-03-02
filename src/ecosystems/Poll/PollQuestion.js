import React, { Component } from "react";
import { Text, View } from "react-native";
import _ from "underscore";

import Lang from "../../utils/Lang";
import ShadowedArea from "../../atoms/ShadowedArea";
import PollResultsChoice from "./PollResultsChoice";
import PollVoteChoice from "./PollVoteChoice";
import { withTheme } from "../../themes";

class PollQuestion extends Component {
	constructor(props) {
		super(props);
		this.toggleChoice = this.toggleChoice.bind(this);

		const choices = {};

		this.props.data.choices.map((choice, idx) => {
			choices[idx] = false;
		});

		this.state = {
			choices
		};
	}

	toggleChoice(choiceIdx) {
		// Flip the toggle for this choice
		const choices = { ...this.state.choices };
		const nextValue = !choices[choiceIdx];

		// For 'radio' choices, uncheck all the other choices if we're checking one
		if (nextValue === true && !this.props.data.isMultiChoice) {
			Object.keys(choices).forEach(choice => (choices[choice] = false));
		}

		// Set value
		choices[choiceIdx] = nextValue;
		this.setState({ choices });

		// Pass values up to PollScreen
		this.props.voteHandler(this.props.questionNumber, choices);
	}

	render() {
		const { styles, componentStyles } = this.props;
		let questionContent;

		if (!this.props.showResult) {
			questionContent = this.props.data.choices.map((choice, idx) => (
				<PollVoteChoice
					key={idx}
					data={choice}
					toggleChoice={this.toggleChoice}
					choiceNumber={idx}
					checked={this.state.choices[idx]}
					type={this.props.data.isMultiChoice ? "checkbox" : "radio"}
				/>
			));
		} else {
			questionContent = this.props.data.choices.map((choice, idx) => <PollResultsChoice key={idx} data={choice} totalVotes={this.props.data.votes} />);
		}

		return (
			<ShadowedArea style={[styles.pWide, styles.mbTight]}>
				<View style={[componentStyles.questionHeader, styles.pbStandard, styles.mbStandard]}>
					<Text style={[styles.lightText, styles.standardText]}>{Lang.get("poll_question_number", { number: this.props.questionNumber + 1 })}</Text>
					<Text style={styles.itemTitle}>{this.props.data.title}</Text>
				</View>
				<View>
					{questionContent}
					{Boolean(this.props.data.isMultiChoice) && (
						<Text style={[styles.lightText, styles.standardText, styles.mtStandard]}>{Lang.get("poll_multiple_choice")}</Text>
					)}
				</View>
			</ShadowedArea>
		);
	}
}

const _componentStyles = styleVars => ({
	questionHeader: {
		borderBottomWidth: 1,
		borderBottomColor: styleVars.borderColors.medium
	}
});

export default withTheme(_componentStyles)(PollQuestion);
