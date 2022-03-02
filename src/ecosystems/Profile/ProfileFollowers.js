import React, { Component } from "react";
import { Text, View, FlatList } from "react-native";
import gql from "graphql-tag";
import { graphql, compose } from "react-apollo";

import Lang from "../../utils/Lang";
import MemberRow from "../../ecosystems/MemberRow";
import { PlaceholderRepeater } from "../../ecosystems/Placeholder";
import ErrorBox from "../../atoms/ErrorBox";

const ProfileFollowersQuery = gql`
	query ProfileFollowersQuery($member: ID!, $offset: Int, $limit: Int) {
		core {
			member(id: $member) {
				id
				name
				follow {
					id
					followers(offset: $offset, limit: $limit) {
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

class ProfileFollowers extends Component {
	/**
	 * Handles infinite loading when user scrolls to end
	 *
	 * @return 	void
	 */
	onEndReached = () => {};

	render() {
		if (!this.props.isActive) {
			return <View />;
		}

		if (this.props.data.loading) {
			return (
				<PlaceholderRepeater repeat={5}>
					<MemberRow loading={true} />
				</PlaceholderRepeater>
			);
		} else if (this.props.data.error) {
			console.log(this.props.data.error);
			return <Text>Error</Text>;
		} else {
			const ListEmptyComponent = <ErrorBox message={Lang.get("no_followers", { name: this.props.data.core.member.name })} showIcon={false} />;

			return (
				<FlatList
					style={[this.props.style, { flex: 1 }]}
					data={this.props.data.core.member.follow.followers}
					keyExtractor={member => member.id}
					renderItem={({ item }) => <MemberRow id={parseInt(item.id)} photo={item.photo} name={item.name} groupName={item.group.name} />}
					refreshing={this.props.data.networkStatus == 4}
					onEndReached={this.onEndReached}
					ListEmptyComponent={ListEmptyComponent}
				/>
			);
		}
	}
}

export default compose(
	graphql(ProfileFollowersQuery, {
		options: props => ({
			variables: {
				member: props.id,
				offset: 0,
				limit: LIMIT
			}
		})
	})
)(ProfileFollowers);
