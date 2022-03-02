import React, { Component } from "react";
import { Text, View, SectionList, Alert, ScrollView } from "react-native";
import gql from "graphql-tag";
import { graphql, withApollo, compose } from "react-apollo";
import { connect } from "react-redux";
import _ from "underscore";

import NavigationService from "../../utils/NavigationService";
import Lang from "../../utils/Lang";
import GoToMulti from "../../atoms/GoToMulti";
import { NotificationRow, NotificationFragment } from "../../ecosystems/Notification";
import { PlaceholderRepeater } from "../../ecosystems/Placeholder";
import SectionHeader from "../../atoms/SectionHeader";
import ErrorBox from "../../atoms/ErrorBox";
import HeaderButton from "../../atoms/HeaderButton";
import { updateNotificationCount } from "../../redux/actions/user";
import EndOfComments from "../../atoms/EndOfComments";
import icons from "../../icons";

/* Main query, passed as a HOC */
const NotificationQuery = gql`
	query NotificationQuery($offset: Int, $limit: Int) {
		core {
			me {
				id
				notifications(sortBy: unread, sortDir: desc, offset: $offset, limit: $limit) {
					...NotificationFragment
				}
			}
		}
	}
	${NotificationFragment}
`;

/* Mutation to mark a notification as read */
const MarkReadMutation = gql`
	mutation MarkNotificationRead($id: Int) {
		mutateCore {
			markNotificationRead(id: $id) {
				...NotificationFragment
			}
		}
	}
	${NotificationFragment}
`;

class NotificationsScreen extends Component {
	static navigationOptions = ({ navigation }) => ({
		title: Lang.get("tab_notifications"),
		headerLeft: Expo.Constants.manifest.extra.multi ? <GoToMulti /> : null,
		headerRight: (
			<HeaderButton
				icon={icons.COG}
				onPress={
					!_.isUndefined(navigation.state.params) && !_.isUndefined(navigation.state.params.onPressSettings) ? navigation.state.params.onPressSettings : null
				}
			/>
		)
	});

	constructor(props) {
		super(props);
		this._onPressHandlers = {};
		this.state = {
			reachedEnd: false
		};

		this.props.navigation.setParams({
			onPressSettings: this.onPressSettings
		});
	}

	/**
	 * Event handler that will take user to the notification setting screen
	 *
	 * @return 	void
	 */
	onPressSettings = () => {
		this.props.navigation.navigate("NotificationsSettings");
	};

	/**
	 * Function that will call the MarkReadMutation mutation to mark all of the
	 * user's notifications as read. Called when this screen loads and any time
	 * we fetch fresh data.
	 *
	 * @return 	void
	 */
	markAllRead() {
		try {
			this.props.client.mutate({
				mutation: MarkReadMutation
			});
		} catch (err) {
			console.error("Could not mark notifications as read: " + err);
		}
	}

	/**
	 * On update we check whether we should:
	 * - mark all notifications read
	 * - have new notifications we need to fetch
	 *
	 * @param 	object 		prevProps 	Old props
	 * @return 	void
	 */
	componentDidUpdate(prevProps) {
		// Mark all notifications read when user visits this screen or reloads data
		// This replicates the behavior in the web UI, even though it isn't ideal from a UX perspective
		if (
			(prevProps.data.loading && !this.props.data.loading && !this.props.data.error) || // If we were loading data, but we've finished without error, then mark all as read
			(prevProps.data.networkStatus == 4 && this.props.data.networkStatus == 7) || // Or we've refetched and finished without error
			(!prevProps.navigation.isFocused && this.props.navigation.isFocused) // Or this screen has now been focused
		) {
			this.props.dispatch(updateNotificationCount(0)); // We'll also update our user store to 0

			if (this.props.data.core.me.notifications.length > 0) {
				this.markAllRead();
			}
		}

		// If our notification count has changed, and isn't 0, refetch to load in the new notifications
		if (prevProps.user.notificationCount !== this.props.user.notificationCount && this.props.user.notificationCount > 0) {
			this.props.data.refetch();
		}
	}

	/**
	 * Render a section header, but only if we have subforums to show
	 *
	 * @param 	object 	section 	The section we're rendering
	 * @return 	Component|null
	 */
	renderHeader(section) {
		return <SectionHeader title={section.title} />;
	}

	/**
	 * Handles infinite loading when user scrolls to end
	 *
	 * @return 	void
	 */
	onEndReached = () => {
		// If we've finished loading but there were no notifications, don't try and fetch more
		if (this.props.data.networkStatus >= 7 && !this.props.data.core.me.notifications.length) {
			return;
		}

		if (!this.props.data.loading && !this.state.reachedEnd) {
			this.props.data.fetchMore({
				variables: {
					offset: this.props.data.core.me.notifications.length,
					limit: Expo.Constants.manifest.extra.per_page
				},
				updateQuery: (previousResult, { fetchMoreResult }) => {
					// Don't do anything if there wasn't any new items
					if (!fetchMoreResult || fetchMoreResult.core.me.notifications.length === 0) {
						this.setState({
							reachedEnd: true
						});

						return previousResult;
					}

					const result = Object.assign({}, previousResult, {
						core: {
							...previousResult.core,
							me: {
								...previousResult.core.me,
								notifications: _.uniq(
									[...previousResult.core.me.notifications, ...fetchMoreResult.core.me.notifications],
									false,
									notification => notification.id
								)
							}
						}
					});

					if (fetchMoreResult.core.me.notifications.length < Expo.Constants.manifest.extra.per_page) {
						this.setState({
							reachedEnd: true
						});
					}

					return result;
				}
			});
		}
	};

	/**
	 * Handle refreshing the view
	 *
	 * @return 	void
	 */
	onRefresh = () => {
		this.setState({
			reachedEnd: false
		});

		this.props.data.refetch();
	};

	/**
	 * Return the footer component. Show a spacer by default, but a loading post
	 * if we're fetching more items right now.
	 *
	 * @return 	Component
	 */
	getFooterComponent() {
		// If we're loading more items in
		if (this.props.data.networkStatus == 3 && !this.state.reachedEnd) {
			return <NotificationRow loading={true} />;
		}

		// If we've finished loading but there were no notifications, don't show any footer
		if (this.props.data.networkStatus >= 7 && !this.props.data.core.me.notifications.length) {
			return null;
		}

		return <EndOfComments label={Lang.get("no_more_notifications")} />;
	}

	/**
	 * Build and return the section data, splitting notifications list into read/unread
	 *
	 * @return 	array
	 */
	getSectionData() {
		const sectionData = [];
		const notifications = _.filter(
			this.props.data.core.me.notifications,
			// A notification may not have some data available if, e.g. content has been deleted. Exclude those here.
			item => item.author !== null && item.content !== null && item.title !== null && item.url !== null
		);
		const readStart = notifications.findIndex(notification => notification.readDate !== null);
		let unread = [];
		let read = [];

		// Now create two arrays, to hold our unread and read notifications
		if (readStart === 0) {
			read = notifications;
		} else if (readStart === -1) {
			unread = notifications;
		} else {
			unread = notifications.slice(0, readStart);
			read = notifications.slice(readStart);
		}

		if (unread.length) {
			sectionData.push({
				title: Lang.get("notifications_unread"),
				data: unread
			});
		}
		if (read.length) {
			sectionData.push({
				title: Lang.get("notifications_read"),
				data: read
			});
		}

		return sectionData;
	}

	/**
	 * Memoization function that returns an onPress handler for a given item
	 *
	 * @param 	object 		Notification object
	 * @return 	function
	 */
	getOnPressHandler(item) {
		if (_.isUndefined(this._onPressHandlers[item.id])) {
			this._onPressHandlers[item.id] = () => this.onPress(item);
		}

		return this._onPressHandlers[item.id];
	}

	/**
	 * OnPress handler for an individual notification
	 *
	 * @param 	object 		Notification object
	 * @return 	void
	 */
	async onPress(item) {
		// If the item is unread, mark it as read now, but don't wait for completion
		// before navigating to content screen
		if (item.readDate == null) {
			try {
				this.props.client.mutate({
					mutation: MarkReadMutation,
					variables: {
						id: item.id
					}
				});
			} catch (err) {
				// In this case, while the notification won't be marked as read we'll still
				// take the user to the item, so ignore it.
				console.error(err);
			}
		}

		if (item.url !== null) {
			NavigationService.navigate(item.url.full);
		}
	}

	render() {
		if (this.props.data.loading && this.props.data.networkStatus !== 3 && this.props.data.networkStatus !== 4) {
			return (
				<PlaceholderRepeater repeat={7}>
					<NotificationRow loading />
				</PlaceholderRepeater>
			);
		} else if (this.props.data.error) {
			return <ErrorBox message={Lang.get("notifications_error")} />;
		} else {
			const ListEmptyComponent = <ErrorBox message={Lang.get("no_notifications")} showIcon={false} />;

			return (
				<View style={{ flex: 1 }}>
					<SectionList
						style={{ flex: 1 }}
						sections={this.getSectionData()}
						keyExtractor={item => item.id}
						renderSectionHeader={({ section }) => this.renderHeader(section)}
						renderItem={({ item }) => <NotificationRow key={item.key} data={item} onPress={this.getOnPressHandler(item)} />}
						refreshing={this.props.data.networkStatus == 4}
						onRefresh={this.onRefresh}
						onEndReached={this.onEndReached}
						ListEmptyComponent={ListEmptyComponent}
						ListFooterComponent={() => this.getFooterComponent()}
						stickySectionHeadersEnabled={false}
					/>
				</View>
			);
		}
	}
}

export default compose(
	connect(state => ({
		user: state.user
	})),
	withApollo,
	graphql(NotificationQuery, {
		options: props => ({
			fetchPolicy: "cache-and-network", // Needed here so that we fetch fresh notification data after e.g. reading a topic
			notifyOnNetworkStatusChange: true,
			variables: {
				offset: 0,
				limit: Expo.Constants.manifest.extra.per_page
			}
		})
	})
)(NotificationsScreen);
