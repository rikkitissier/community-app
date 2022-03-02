import React, { Component } from "react";
import { View, FlatList } from "react-native";
import gql from "graphql-tag";
import { compose, withApollo } from "react-apollo";
import { withNavigation } from "react-navigation";

import Lang from "../../utils/Lang";
import { PlaceholderRepeater } from "../../ecosystems/Placeholder";
import ErrorBox from "../../atoms/ErrorBox";
import MemberRow from "../../ecosystems/MemberRow";
import { withTheme } from "../../themes";

const SearchQuery = gql`
	query MemberSearchQuery($term: String) {
		core {
			search(term: $term, type: core_members) {
				count
				results {
					... on core_Member {
						id
						photo
						name
						group {
							name
						}
					}
				}
			}
		}
	}
`;

const LIMIT = 25;

class SearchMemberPanel extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loading: false,
			error: false,
			lastTerm: "",
			results: null,
			reachedEnd: false,
			offset: 0
		};
	}

	componentDidMount() {
		// If showResults is true on first mount, kick off the request immediately
		if (this.props.showResults) {
			this.fetchResults();
		}
	}

	/**
	 * On update, figure out if we need to fetch our results
	 *
	 * @param 	object 		prevProps 		Previous prop object
	 * @return 	void
	 */
	componentDidUpdate(prevProps) {
		// If we were not previously showing results but now we are, then start fetching them
		// so they can be displayed when loaded
		if (!prevProps.showResults && this.props.showResults) {
			// If the term hasn't changed, then just rebuild the results from what we already had
			if (prevProps.term !== this.props.term || (this.state.results === null && !this.state.loading)) {
				this.fetchResults();
			}
		}
	}

	/**
	 * Fetch our results from the server
	 *
	 * @return 	void
	 */
	async fetchResults() {
		if (this.state.loading || this.state.reachedEnd) {
			return;
		}

		this.setState({
			loading: true
		});

		try {
			const { data } = await this.props.client.query({
				query: SearchQuery,
				variables: {
					term: this.props.term,
					offset: this.state.offset,
					limit: LIMIT
				},
				fetchPolicy: "no-cache"
			});

			const currentResults = this.state.results == null ? [] : this.state.results;
			const updatedResults = [...currentResults, ...data.core.search.results];

			this.setState({
				results: updatedResults,
				reachedEnd: !data.core.search.results.length || data.core.search.results.length < LIMIT,
				loading: false,
				offset: updatedResults.length
			});
		} catch (err) {
			console.log(err);

			this.setState({
				error: true,
				loading: false
			});
		}
	}

	/**
	 * Event handler for scrolling to the bottom of the list
	 * Initiates a load to get more results
	 *
	 * @return 	void
	 */
	onEndReached = () => {
		if (!this.state.loading && !this.state.reachedEnd) {
			this.fetchResults();
		}
	};

	/**
	 * Shows placeholder loading elements if we're loading new items
	 *
	 * @return 	Component|null
	 */
	getFooterComponent = () => {
		if (this.state.loading && !this.state.reachedEnd) {
			return (
				<PlaceholderRepeater repeat={this.state.offset > 0 ? 1 : 6}>
					<MemberRow loading={true} />
				</PlaceholderRepeater>
			);
		}

		return null;
	};

	/**
	 * Return the list empty component
	 *
	 * @return 	Component
	 */
	getListEmptyComponent = () => {
		return <ErrorBox message={Lang.get("no_results_in_x", { type: this.props.typeName.toLowerCase() })} showIcon={false} />;
	};

	/**
	 * Render a member row
	 *
	 * @param 	object 		item 	Member item to render
	 * @return 	Component
	 */
	renderItem(item) {
		return <MemberRow id={parseInt(item.id)} name={item.name} photo={item.photo} groupName={item.group.name} />;
	}

	render() {
		const { styles } = this.props;

		if (this.state.loading || this.state.results === null) {
			return (
				<View style={[styles.flex]}>
					<PlaceholderRepeater repeat={6}>
						<MemberRow loading={true} />
					</PlaceholderRepeater>
				</View>
			);
		} else if (this.state.error) {
			return (
				<View style={styles.flex}>
					<ErrorBox message={Lang.get("error_searching")} />
				</View>
			);
		}

		return (
			<View style={styles.flex}>
				<FlatList
					data={this.state.results}
					keyExtractor={item => item.id}
					renderItem={({ item }) => this.renderItem(item)}
					onEndReached={this.onEndReached}
					ListFooterComponent={this.getFooterComponent}
					ListEmptyComponent={this.getListEmptyComponent}
				/>
			</View>
		);
	}
}

export default compose(
	withApollo,
	withNavigation,
	withTheme()
)(SearchMemberPanel);

SearchMemberPanel.defaultProps = {
	showResults: false
};
