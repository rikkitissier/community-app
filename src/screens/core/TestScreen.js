import React, { Component } from "react";
import {
	Text,
	Image,
	ScrollView,
	View,
	StyleSheet,
	FlatList,
	TouchableOpacity
} from "react-native";
import gql from "graphql-tag";
import { graphql, compose, withApollo } from "react-apollo";
import _ from "underscore";
import { connect } from "react-redux";

import NavigationService from "../../utils/NavigationService";

const TestQuery = gql`
	query ForumQuery {
		forums {
			forums {
				id
				name
				topicCount
				postCount
				subforums {
					id
					name
					topicCount
					postCount
					hasUnread
					passwordProtected
					passwordRequired
					isRedirectForum
					redirectHits
					url {
						full
					}
					lastPostAuthor {
						photo
					}
					lastPostDate
				}
			}
		}
	}
`;

class TestScreen extends Component {
	static navigationOptions = ({ navigation }) => {
		return {
			title: "Test Screen"
		}
	};

	constructor(props) {
		super(props);
	}

	render() {
		if( this.props.data.loading ){
			return <Text>Loading...</Text>;
		} else {
			return (
				<View>
					<Text>Loaded</Text>
					<Text>{JSON.stringify(this.props.data)}</Text>
				</View>
			);
		}
	}
}

export default compose(
	graphql(TestQuery)
)(TestScreen);
