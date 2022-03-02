import React, { Component } from "react";
import { View, FlatList } from "react-native";
import gql from "graphql-tag";
import { compose, withApollo } from "react-apollo";
import _ from "underscore";

import Lang from "../../utils/Lang";
import { StreamCard, StreamCardFragment } from "../../ecosystems/Stream";
import { PlaceholderRepeater } from "../../ecosystems/Placeholder";
import ErrorBox from "../../atoms/ErrorBox";
import EndOfComments from "../../atoms/EndOfComments";

const MemberContentQuery = gql`
	query MemberContentQuery($id: ID!, $offset: Int, $limit: Int) {
		core {
			member(id: $id) {
				content(offset: $offset, limit: $limit) {
					... on core_ContentSearchResult {
						...StreamCardFragment
					}
				}
			}
		}
	}
	${StreamCardFragment}
`;

const LIMIT = 25;

class ProfileContent extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loading: false,
			results: null,
			reachedEnd: false,
			offset: 0
		};

		this.getFooterComponent = this.getFooterComponent.bind(this);
		this.getListEmptyComponent = this.getListEmptyComponent.bind(this);
	}

	shouldComponentUpdate(nextProps, nextState) {
		/*if (this.state === nextState || this.props.member === nextProps.member) {
			return false;
		}*/

		return true;
	}

	componentDidMount() {
		if (this.props.showResults) {
			this.fetchResults();
		}
	}

	componentDidUpdate(prevProps) {
		if (!prevProps.showResults && prevProps.showResults !== this.props.showResults) {
			this.fetchResults();
		}
	}

	async fetchResults() {
		if (this.state.loading || this.state.reachedEnd) {
			return;
		}

		this.setState({
			loading: true
		});

		try {
			const variables = {
				offset: this.state.offset,
				limit: LIMIT,
				id: this.props.member
			};

			const { data } = await this.props.client.query({
				query: MemberContentQuery,
				variables,
				fetchPolicy: "no-cache"
			});

			const currentResults = this.state.results == null ? [] : this.state.results;
			const updatedResults = [...currentResults, ...data.core.member.content];
			const results = _.uniq(updatedResults, false, result => result.indexID);

			this.setState({
				results,
				reachedEnd: !data.core.member.content.length || data.core.member.content.length < LIMIT,
				loading: false,
				offset: updatedResults.length
			});
		} catch (err) {
			console.log(err);
		}
	}

	/**
	 * Returns placeholder components if our state indicates we need them
	 *
	 * @return 	Component|null
	 */
	getFooterComponent() {
		if (this.state.loading && !this.state.reachedEnd) {
			return this.getPlaceholder();
		}

		return <EndOfComments label={Lang.get("end_of_profile_content")} />;
	}

	/**
	 * Return the list empty component
	 *
	 * @return 	Component
	 */
	getListEmptyComponent() {
		return (
			<ErrorBox
				message={Lang.get("no_results")} // @todo language
				showIcon={false}
			/>
		);
	}

	/**
	 * Build placeholder components
	 *
	 * @return 	Component
	 */
	getPlaceholder() {
		return (
			<PlaceholderRepeater repeat={this.state.offset > 0 ? 1 : 4} style={{ marginTop: 7 }}>
				<StreamCard loading={true} />
			</PlaceholderRepeater>
		);
	}

	render() {
		if (!this.props.isActive) {
			return <View />;
		}

		if (this.state.loading && this.state.results == null) {
			return this.getPlaceholder();
		} else if (this.state.error) {
			return (
				<View>
					<ErrorBox message={Lang.get("error_searching")} />
				</View>
			);
		}

		return (
			<View style={this.props.style}>
				<FlatList
					scrollEnabled={false}
					data={this.state.results}
					keyExtractor={item => item.indexID}
					renderItem={({ item }) => <StreamCard data={item} />}
					ListFooterComponent={this.getFooterComponent}
					ListEmptyComponent={this.getListEmptyComponent}
				/>
			</View>
		);
	}
}

export default compose(withApollo)(ProfileContent);
