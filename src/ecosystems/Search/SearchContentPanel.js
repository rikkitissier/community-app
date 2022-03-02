import React, { Component } from "react";
import { View, FlatList } from "react-native";
import gql from "graphql-tag";
import { compose, withApollo } from "react-apollo";
import { withNavigation } from "react-navigation";
import _ from "underscore";

import Lang from "../../utils/Lang";
import ErrorBox from "../../atoms/ErrorBox";
import { PlaceholderRepeater } from "../../ecosystems/Placeholder";
import SearchResult from "./SearchResult";
import SearchResultFragment from "../../ecosystems/Search/SearchResultFragment";
import { withTheme } from "../../themes";

const SearchQuery = gql`
	query SearchQuery($term: String, $type: core_search_types_input, $offset: Int, $limit: Int, $orderBy: core_search_order_by) {
		core {
			search(term: $term, type: $type, offset: $offset, limit: $limit, orderBy: $orderBy) {
				count
				results {
					... on core_ContentSearchResult {
						...SearchResultFragment
					}
				}
			}
		}
	}
	${SearchResultFragment}
`;

const LIMIT = 25;

class SearchContentPanel extends Component {
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
	 * Load our results from the server
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
			const variables = {
				term: this.props.term,
				offset: this.state.offset,
				limit: LIMIT,
				orderBy: "relevancy"
			};

			// Type is optional, so only add it if we aren't showing all
			if (this.props.type !== "all") {
				variables["type"] = this.props.type;
			}

			const { data } = await this.props.client.query({
				query: SearchQuery,
				variables,
				fetchPolicy: "no-cache" // important, so that each search fetches new results
			});

			const currentResults = this.state.results == null ? [] : this.state.results;
			const updatedResults = [...currentResults, ...data.core.search.results];
			const results = _.uniq(updatedResults, false, result => result.indexID);

			this.setState({
				results,
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
	 * Render a result item
	 *
	 * @param 	object		item 	The item to render
	 * @return 	Component
	 */
	renderItem(item) {
		return <SearchResult data={item} term={this.props.term} />;
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
					<SearchResult loading={true} />
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
		return (
			<ErrorBox
				message={Lang.get("no_results_in_x", {
					type: this.props.typeName.toLowerCase()
				})}
				showIcon={false}
			/>
		);
	};

	render() {
		const { styles } = this.props;

		if (this.state.loading && this.state.results == null) {
			return (
				<PlaceholderRepeater repeat={6}>
					<SearchResult loading={true} />
				</PlaceholderRepeater>
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
					keyExtractor={item => item.indexID}
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
)(SearchContentPanel);
