import React, { Component } from "react";
import { Text, View, Image, StyleSheet, ScrollView, SectionList, TouchableOpacity } from "react-native";
import gql from "graphql-tag";
import { compose, withApollo } from "react-apollo";
import { connect } from "react-redux";
import _ from "underscore";
import Modal from "react-native-modal";
import * as Animatable from "react-native-animatable";

import Lang from "../../utils/Lang";
import ErrorBox from "../../atoms/ErrorBox";
import { Post } from "../../ecosystems/Post";
import GoToMulti from "../../atoms/GoToMulti";
import StreamHeader from "../../atoms/StreamHeader";
import { StreamCard, StreamCardFragment } from "../../ecosystems/Stream";
import CheckList from "../../ecosystems/CheckList";
import { PlaceholderRepeater, PlaceholderContainer, PlaceholderElement } from "../../ecosystems/Placeholder";
import getErrorMessage from "../../utils/getErrorMessage";
import { withTheme, getCurrentStyleSheet } from "../../themes";

const StreamViewQuery = gql`
	query StreamViewQuery($id: ID, $offset: Int, $limit: Int) {
		core {
			stream(id: $id) {
				title
				items(offset: $offset, limit: $limit) {
					...StreamCardFragment
				}
			}
		}
	}
	${StreamCardFragment}
`;

const LIMIT = 25;

class StreamViewScreen extends Component {
	static navigationOptions = ({ navigation }) => {
		const menuStyle = StyleSheet.create({
			dropdownArrow: {
				width: 13,
				height: 13,
				tintColor: "#fff",
				marginLeft: 5
			}
		});
		const currentStyleSheet = getCurrentStyleSheet();

		return {
			headerLeft: Expo.Constants.manifest.extra.multi ? <GoToMulti /> : null,
			headerTitle: (
				<TouchableOpacity
					onPress={
						!_.isUndefined(navigation.state.params) && !_.isUndefined(navigation.state.params.onPressTitle) ? navigation.state.params.onPressTitle : null
					}
				>
					<View style={[currentStyleSheet.flexRow, currentStyleSheet.flexAlignCenter, currentStyleSheet.phWide]}>
						<Text style={[currentStyleSheet.headerTitle]} numberOfLines={1}>
							{!_.isUndefined(navigation.state.params) && !_.isUndefined(navigation.state.params.streamTitle) ? navigation.state.params.streamTitle : ""}
						</Text>
						{!_.isUndefined(navigation.state.params) && !_.isUndefined(navigation.state.params.moreAvailable) && navigation.state.params.moreAvailable && (
							<Image source={require("../../../resources/arrow_down.png")} resizeMode="contain" style={menuStyle.dropdownArrow} />
						)}
					</View>
				</TouchableOpacity>
			)
		};
	};

	sectionTitles = {
		past_hour: Lang.get("past_hour"),
		yesterday: Lang.get("yesterday"),
		today: Lang.get("today"),
		last_week: Lang.get("last_week"),
		earlier: Lang.get("earlier")
	};

	getViewRef = ref => (this._mainView = ref);

	constructor(props) {
		super(props);
		this._refreshTimeout = null;
		this._list = null;
		this._mainView = null;
		this.state = {
			viewingStream: null, // Currently active stream
			results: [], // Simple array of results from GraphQL
			sectionData: [], // The formatted sections resdy for Sectionlist
			loading: false, // Are we loading data?
			error: null, // Was there an error?
			streamListVisible: false, // Is the stream list modal visible?
			reachedEnd: false, // Have we reached the end of the results list?
			offset: 0, // What offset are we loading from?
			refreshing: false
		};

		this.onRefresh = this.onRefresh.bind(this);
		this.showStreamModal = this.showStreamModal.bind(this);
		this.closeStreamModal = this.closeStreamModal.bind(this);
		this.switchStream = this.switchStream.bind(this);
		this.onEndReached = this.onEndReached.bind(this);
		this.getFooterComponent = this.getFooterComponent.bind(this);
	}

	componentDidMount() {
		this.setNavParams();
	}

	componentWillUnmount() {
		clearTimeout(this._refreshTimeout);
	}

	/**
	 * DidUpdate, check whether the active stream has changed
	 *
	 * @return 	void
	 */
	componentDidUpdate(prevProps, prevState) {
		// If we've changed the stream we're viewing, then we need to update the title
		// and get the results
		if (prevState.viewingStream !== this.state.viewingStream) {
			const activeStream = _.find(this.props.user.streams, stream => stream.id == this.state.viewingStream);

			this.props.navigation.setParams({
				streamTitle: activeStream.title
			});

			this.fetchStream();
		}
	}

	/**
	 * Called when component mounted, sets the nav params to show the
	 * current stream, and let the user tap to see the stream list
	 *
	 * @return 	void
	 */
	async setNavParams() {
		if (this.props.user.streams.length > 1) {
			this.props.navigation.setParams({
				moreAvailable: true,
				onPressTitle: () => this.showStreamModal()
			});

			// Get the user's default
			let viewingStream = "all";
			if (_.isNumber(this.props.user.defaultStream)) {
				viewingStream = this.props.user.defaultStream;
			}

			this.setState({
				viewingStream,
				offset: 0,
				sectionData: []
			});
		} else {
			this.setState({
				viewingStream: "all",
				offset: 0,
				sectionData: []
			});
		}
	}

	/**
	 * Load new stream results into the component
	 *
	 * @return 	void
	 */
	async fetchStream() {
		if (this.state.loading || this.state.reachedEnd) {
			return;
		}

		this.setState({
			loading: true
		});

		try {
			const variables = {
				offset: this.state.offset,
				limit: LIMIT
			};

			if (this.state.viewingStream !== "all") {
				variables["id"] = this.state.viewingStream;
			}

			const { data } = await this.props.client.query({
				query: StreamViewQuery,
				variables,
				fetchPolicy: "no-cache"
			});

			const results = [...this.state.results, ...data.core.stream.items];
			const sectionData = this.buildSectionData(results);

			this.setState({
				results,
				sectionData,
				reachedEnd: !data.core.stream.items.length || data.core.stream.items.length < LIMIT,
				offset: results.length,
				loading: false,
				refreshing: false
			});
		} catch (err) {
			console.log(err);
			this.setState({
				error: true,
				loading: false,
				refreshing: false
			});
		}
	}

	/**
	 * Toggle the stream modal
	 *
	 * @return 	void
	 */
	showStreamModal() {
		this.setState({
			streamListVisible: true
		});
	}

	/**
	 * Hide the stream modal
	 *
	 * @return 	void
	 */
	closeStreamModal() {
		this.setState({
			streamListVisible: false
		});
	}

	onRefresh() {
		this.setState(
			{
				refreshing: true,
				offset: 0,
				results: []
			},
			() => {
				this.fetchStream();
			}
		);
	}

	/**
	 * Build the section data we need for SectionList
	 * Each stream item has a 'relative time' string. Loop each item, and create sections
	 * based on that string.
	 *
	 * @param 	object 	item 		A raw item object from GraphQL
	 * @param 	object 	streamData 	The stream data
	 * @return 	object
	 */
	buildSectionData(items) {
		const sections = {};

		if (!items.length) {
			return [];
		}

		// Ensure new topic array is unique
		// Since the topic list can change order between loads (due to user activity), it's possible
		// that a topic row will appear twice in our data if we don't check for unique values.
		// This causes a RN duplicate rows error.
		const uniqueItems = _.uniq(items, false, item => item.indexID);

		uniqueItems.forEach(item => {
			if (_.isUndefined(sections[item.relativeTimeKey])) {
				sections[item.relativeTimeKey] = {
					title: item.relativeTimeKey,
					data: []
				};
			}

			sections[item.relativeTimeKey].data.push(item);
		});

		return Object.values(sections);
	}

	/**
	 * Build the list of streams the user can choose from
	 *
	 * @return 	Component
	 */
	buildStreamList() {
		const { styles, componentStyles } = this.props;
		const data = this.props.user.streams.map(stream => ({
			id: stream.id,
			key: stream.id,
			title: stream.title,
			checked: this.state.viewingStream == stream.id
		}));

		return (
			<View style={[styles.modalInner, componentStyles.modalInner]}>
				<View style={styles.modalHandle} />
				<View style={styles.modalHeader}>
					<Text style={styles.modalTitle}>{Lang.get("switch_stream")}</Text>
					<TouchableOpacity onPress={this.closeStreamModal} style={styles.modalCloseTouchable}>
						<Image source={require("../../../resources/close_circle.png")} resizeMode="contain" style={styles.modalClose} />
					</TouchableOpacity>
				</View>
				<ScrollView style={styles.flex}>
					<CheckList data={data} onPress={this.switchStream} />
				</ScrollView>
			</View>
		);
	}

	/**
	 * Event handler to handle toggling a different stream
	 *
	 * @return 	void
	 */
	switchStream(item) {
		this.setState({
			streamListVisible: false
		});

		if (this.state.viewingStream == item.id) {
			return;
		}

		// To make this transition a bit nicer, fade out the existing results,
		// then after a timeout do our state change to init loading new results while we
		// fade back in (placeholders will be showing at that point)

		this._mainView.fadeOut(400);

		this._refreshTimeout = setTimeout(() => {
			this.setState(
				{
					viewingStream: item.id,
					sectionData: [],
					results: [],
					offset: 0,
					reachedEnd: false
				},
				() => {
					this._mainView.fadeIn(100);
				}
			);
		}, 450);
	}

	/**
	 * Handles infinite loading when user scrolls to end
	 *
	 * @return 	void
	 */
	onEndReached() {
		if (!this.state.loading && !this.state.reachedEnd) {
			this.fetchStream();
		}
	}

	/**
	 * Returns placeholder components if our state indicates we need them
	 *
	 * @return 	Component|null
	 */
	getFooterComponent() {
		if (!this.state.reachedEnd) {
			return this.getPlaceholder();
		}

		return null;
	}

	/**
	 * Build placeholder components
	 *
	 * @return 	Component
	 */
	getPlaceholder() {
		return (
			<React.Fragment>
				{this.state.offset == 0 && (
					<PlaceholderContainer height={40}>
						<PlaceholderElement width={100} height={30} top={7} left={7} />
					</PlaceholderContainer>
				)}
				<PlaceholderRepeater repeat={this.state.offset > 0 ? 1 : 4} style={{ marginTop: 7 }}>
					<Post loading={true} />
				</PlaceholderRepeater>
			</React.Fragment>
		);
	}

	render() {
		const { componentStyles } = this.props;

		if (this.state.loading && this.state.sectionData === []) {
			return this.getPlaceholder();
		} else if (this.state.error) {
			const error = getErrorMessage(this.state.error, {});
			const message = error ? error : Lang.get("stream_error");
			return <ErrorBox message={message} />;
		} else {
			return (
				<React.Fragment>
					<Modal
						style={componentStyles.modal}
						swipeDirection="down"
						propagateSwipe={true}
						onSwipeComplete={this.closeStreamModal}
						isVisible={this.state.streamListVisible}
					>
						{this.buildStreamList()}
					</Modal>
					<Animatable.View style={{ flexGrow: 1 }} ref={this.getViewRef}>
						<View style={componentStyles.timeline} />
						<SectionList
							style={componentStyles.feed}
							sections={this.state.sectionData}
							ref={list => (this._list = list)}
							keyExtractor={item => item.indexID}
							renderItem={({ item }) => <StreamCard data={item} />}
							renderSectionHeader={({ section }) => <StreamHeader title={this.sectionTitles[section.title]} style={componentStyles.header} />}
							stickySectionHeadersEnabled={true}
							onEndReached={this.onEndReached}
							ListFooterComponent={this.getFooterComponent}
							refreshing={this.state.refreshing}
							onRefresh={this.onRefresh}
						/>
					</Animatable.View>
				</React.Fragment>
			);
		}
	}
}

const _componentStyles = {
	modal: {
		justifyContent: "flex-end",
		margin: 0,
		padding: 0
	},
	modalInner: {
		height: "80%"
	}
};

export default compose(
	connect(state => ({
		user: state.user
	})),
	withApollo,
	withTheme(_componentStyles)
)(StreamViewScreen);
