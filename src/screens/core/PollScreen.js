import React, { Component } from "react";
import { Text, FlatList, Alert } from "react-native";
import gql from "graphql-tag";
import { graphql, compose, withApollo } from "react-apollo";
import { connect } from "react-redux";
import _ from "underscore";

import Lang from "../../utils/Lang";
import CustomHeader from "../../ecosystems/CustomHeader";
import TwoLineHeader from "../../atoms/TwoLineHeader";
import ShadowedArea from "../../atoms/ShadowedArea";
import Button from "../../atoms/Button";
import { PollQuestion, PollFragment } from "../../ecosystems/Poll";
import { withTheme } from "../../themes";

const PollQuery = gql`
	query TopicViewQuery($id: ID!) {
		forums {
			topic(id: $id) {
				id
				poll {
					...PollFragment
				}
			}
		}
	}
	${PollFragment}
`;

const PollVoteMutation = gql`
	mutation PollVoteMutation($itemID: ID!, $poll: [core_PollQuestionInput]) {
		mutateForums {
			voteInPoll(itemID: $itemID, poll: $poll) {
				id
				poll {
					...PollFragment
				}
			}
		}
	}
	${PollFragment}
`;

class PollScreen extends Component {
	static navigationOptions = ({ navigation }) => ({
		headerTitle: (
			<TwoLineHeader
				title={navigation.state.params.data.title}
				subtitle={Lang.pluralize(Lang.get("votes"), Lang.formatNumber(navigation.state.params.data.votes))}
			/>
		)
	});

	constructor(props) {
		super(props);
		this.voteHandler = this.voteHandler.bind(this);
		this.submitVotes = this.submitVotes.bind(this);
		this.viewResults = this.viewResults.bind(this);
		this.viewWithoutVoting = this.viewWithoutVoting.bind(this);
		this.toggleVoting = this.toggleVoting.bind(this);
		this._votes = {};
		this.state = {
			showResults: true,
			votes: {}
		};
	}

	voteHandler(question, data) {
		const votes = { ...this.state.votes };
		votes[question] = data;

		this.setState({ votes });
	}

	async submitVotes() {
		const itemID = this.props.navigation.state.params.itemID;
		const poll = this.buildPollData();

		try {
			const { data } = await this.props.client.mutate({
				mutation: PollVoteMutation,
				variables: {
					itemID,
					poll
				}
			});

			this.setState({
				showResults: true
			});
		} catch (err) {
			// @todo show error
			console.log(err);
		}
	}

	buildPollData() {
		// Turns: {"0": { "0": true, "1": false }, "1": { "0": true, "1": true, "2": true } }
		// Into: [ { id: 1, choices: [1] }, { id: 2, choices, [0, 1, 2] } ]
		const data = Object.keys(this.state.votes).map(questionIndex => {
			const choices = _.filter(Object.keys(this.state.votes[questionIndex]), val => this.state.votes[questionIndex][val] === true).map(
				val => parseInt(val) + 1 // Choices are 1-indexed for some reason,
			);
			return {
				id: parseInt(questionIndex) + 1, // Questions are 1-indexed for some reason
				choices
			};
		});

		console.log(data);
		return data;
	}

	async viewWithoutVoting() {
		const itemID = this.props.navigation.state.params.itemID;

		try {
			const { data } = await this.props.client.mutate({
				mutation: PollVoteMutation,
				variables: {
					itemID,
					poll: null // this causes a null vote, i.e. view without voting
				}
			});

			this.setState({
				showResults: true
			});
		} catch (err) {
			// @todo show error
			console.log(err);
		}
	}

	toggleVoting() {
		this.setState({
			showResults: !this.state.showResults
		});
	}

	viewResults() {
		if (!this.props.site.settings.allow_result_view) {
			// Show alert to tell the user they'll lose their vote if they proceed
			Alert.alert(Lang.get("confirm"), Lang.get("poll_view_confirm"), [
				{
					text: Lang.get("cancel")
				},
				{
					text: Lang.get("ok"),
					onPress: () => this.viewWithoutVoting()
				}
			]);
		}
	}

	getPollFooter() {
		const showResult = this.shouldShowResults();
		const { styles } = this.props;
		let buttons;

		if (this.props.data.forums.topic.poll.canVote && !this.props.data.forums.topic.poll.hasVoted) {
			buttons = [
				<Button key="submit" type="primary" size="large" filled onPress={this.submitVotes} title={Lang.get("poll_submit_votes")} />,
				<Button key="view" type="light" size="large" filled onPress={this.viewResults} title={Lang.get("poll_view_results")} style={styles.mtStandard} />
			];
		} else if (this.props.data.forums.topic.poll.canVote && this.props.data.forums.topic.poll.hasVoted) {
			if (showResult) {
				buttons = [<Button key="change" type="light" size="large" filled onPress={this.toggleVoting} title={Lang.get("poll_change_vote")} />];
			} else {
				buttons = [
					<Button key="update" type="primary" size="large" filled onPress={this.submitVotes} title={Lang.get("poll_update_vote")} />,
					<Button key="cancel" type="light" size="large" filled onPress={this.toggleVoting} title={Lang.get("cancel")} style={styles.mtStandard} />
				];
			}
		}

		if (buttons) {
			return <ShadowedArea style={styles.pWide}>{buttons}</ShadowedArea>;
		}
	}

	shouldShowResults() {
		const pollData = this.props.data.forums.topic.poll;
		let showResult = false;

		if ((!pollData.hasVoted && pollData.canViewResults && this.state.showResults) || (pollData.hasVoted && this.state.showResults)) {
			showResult = true;
		}

		return showResult;
	}

	render() {
		if (this.props.data.loading) {
			return <Text>Loading</Text>;
		} else if (this.props.data.error) {
			return <Text>Error</Text>;
		} else {
			const pollData = this.props.data.forums.topic.poll;
			const canVote = !pollData.hasVoted && pollData.canVote;
			const showResult = this.shouldShowResults();

			return (
				<FlatList
					data={pollData.questions}
					keyExtractor={item => item.id}
					renderItem={({ item, index }) => (
						<PollQuestion key={index} questionNumber={index} data={item} voteHandler={this.voteHandler} showResult={showResult} />
					)}
					ListFooterComponent={this.getPollFooter()}
				/>
			);
		}
	}
}

export default compose(
	graphql(PollQuery, {
		options: props => {
			return {
				notifyOnNetworkStatusChange: true,
				variables: {
					id: props.navigation.state.params.itemID
				}
			};
		}
	}),
	withApollo,
	connect(state => ({
		site: state.site
	})),
	withTheme()
)(PollScreen);
