import React, { Component } from "react";
import { Text, View, FlatList, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { connect } from "react-redux";
import { compose } from "react-apollo";
import _ from "underscore";

import { PlaceholderContainer, PlaceholderElement } from "../../ecosystems/Placeholder";
import LargeTitle from "../../atoms/LargeTitle";
import Lang from "../../utils/Lang";
import Time from "../../atoms/Time";
import UserPhoto from "../../atoms/UserPhoto";
import NavigationService from "../../utils/NavigationService";
import { withTheme } from "../../themes";

class ActiveUsers extends Component {
	constructor(props) {
		super(props);
		this._animations = [];
		this.state = {
			tickerReady: false,
			tickerNames: [],
			hasPermission: this.props.site.moduleAccess.core.online
		};

		this._pressHandlers = {};
	}

	/*
	 * @brief 	How long each name will show for in our ticker animation
	 */
	static animationDelay = 4000;

	/*
	 * @brief 	How many names we'll require to show the ticker. Too few looks a bit daft.
	 */
	static minimumTickerNames = 2;

	/**
	 * Component update
	 *
	 * @param 	object 	prevProps 	Old props
	 * @param 	object	prevState 	Old state
	 * @return 	void
	 */
	componentDidUpdate(prevProps, prevState) {
		// If we have gone from loading to loaded, then set up the ticker animations
		if (prevProps.loading !== this.props.loading || (prevProps.refreshing && !this.props.refreshing)) {
			if (this.state.hasPermission) {
				this.setUpTicker();
			}
		}
	}

	/**
	 * Generate each active user segment
	 *
	 * @return 	array 	Array of cell components
	 */
	getCells() {
		const { styles, componentStyles } = this.props;

		// Take a slice of up to 14 users to show
		const usersToShow = this.props.data.activeUsers.users.slice(0, 14);

		return usersToShow.map(user => (
			<View
				style={[styles.flexColumn, styles.flexJustifyCenter, styles.flexAlignStart, styles.mrStandard, styles.mbTight, componentStyles.cell]}
				key={user.user.name}
			>
				<TouchableOpacity onPress={this.getPressHandler(user.user)}>
					<UserPhoto url={user.user.photo || null} size={36} online={true} anon={user.anonymous} />
				</TouchableOpacity>
			</View>
		));
	}

	/**
	 * Memoization function returning a press handler for a user
	 *
	 * @return 	array 	Array of cell components
	 */
	getPressHandler(user) {
		if (_.isUndefined(this._pressHandlers[user.id])) {
			this._pressHandlers[user.id] = () => {
				NavigationService.navigate(user.url);
			};
		}

		return this._pressHandlers[user.id];
	}

	/**
	 * Generates the pill that shows how many more users are online, excluding the ones we already showed
	 *
	 * @return 	Component|null
	 */
	getMoreBubble() {
		const { styles, componentStyles } = this.props;
		const activeUsersData = this.props.data.activeUsers;

		if (activeUsersData.count - activeUsersData.users.length > 0) {
			return (
				<View style={[styles.flex, styles.flexJustifyCenter, styles.flexAlignCenter, componentStyles.andMore]}>
					<Text style={[styles.lightText, styles.smallText]}>
						+{Lang.pluralize(Lang.get("x_more"), Lang.formatNumber(activeUsersData.count - activeUsersData.users.length))}
					</Text>
				</View>
			);
		}

		return null;
	}

	/**
	 * Sets up the animations for the ticker that shows what users are doing
	 * Note we don't bother doing it if there's less than 3 items to show
	 *
	 * @return 	void
	 */
	setUpTicker() {
		if (!this.state.hasPermission) {
			return;
		}

		this.setState({
			tickerReady: false
		});

		const tickerNames = [];
		const animations = this.props.data.activeUsers.users
			.slice(0, 15)
			.filter(user => _.isString(user.lang))
			.map((user, idx) => {
				// First, save our user data and an animted value (this will go in state)
				const animatedValue = new Animated.Value(0);
				tickerNames.push({
					user,
					animatedValue
				});

				// Now set up the timing function, along with an incremental delay
				return Animated.timing(animatedValue, {
					toValue: 1,
					duration: ActiveUsers.animationDelay,
					useNativeDriver: true
				});
			});

		if (animations.length) {
			Animated.loop(Animated.stagger(ActiveUsers.animationDelay, animations)).start();
		}

		// Setting this state will now cause the ticker to render and begin animating
		this.setState({
			tickerReady: true,
			tickerNames
		});
	}

	/**
	 * Builds the ticker that shows what users are doing
	 *
	 * @return 	array|null		Array of Animated.Text components
	 */
	getTicker() {
		const { styles, componentStyles } = this.props;

		if (this.state.tickerNames.length < ActiveUsers.minimumTickerNames) {
			return null;
		}

		return this.state.tickerNames.map(({ animatedValue, user }) => {
			// Since our animated value goes from 0 to 1, we'll use that to create a curve that
			// fades in quickly, stays, then fades out quickly too.
			const opacity = animatedValue.interpolate({
				inputRange: [0, 0.05, 0.95, 1],
				outputRange: [0, 1, 1, 0]
			});

			return (
				<Animated.View key={user.user.id} style={[componentStyles.tickerItem, { opacity: opacity }]}>
					<Text style={[styles.text, styles.smallText]} numberOfLines={1}>
						<Time style={[styles.lightText, styles.mrTight]} timestamp={user.timestamp} />
						<Text>
							{`  `}
							{user.lang}
						</Text>
					</Text>
				</Animated.View>
			);
		});
	}

	render() {
		const { styles, componentStyles } = this.props;

		if (!this.state.hasPermission) {
			return null;
		}

		if (this.props.loading) {
			return (
				<View style={[componentStyles.wrapper, styles.row, { height: 100 }]}>
					<PlaceholderElement left={16} top={15} width="60%" />
					<PlaceholderElement circle radius={36} left={16} top={48} />
					<PlaceholderElement circle radius={36} left={64} top={48} />
					<PlaceholderElement circle radius={36} left={112} top={48} />
					<PlaceholderElement circle radius={36} left={160} top={48} />
				</View>
			);
		}

		if (!this.props.data.activeUsers.count) {
			return (
				<View style={[styles.row, styles.phWide, styles.ptStandard, styles.pbVeryTight, styles.mbWide, componentStyles.wrapper]}>
					<Text style={[styles.lightText, styles.mbTight]}>{Lang.get("no_users_online")}</Text>
				</View>
			);
		} else if (this.props.data.activeUsers.count && !this.props.data.activeUsers.users.length) {
			return (
				<View style={[styles.row, styles.phWide, styles.ptStandard, styles.pbVeryTight, styles.mbWide, componentStyles.wrapper]}>
					<Text style={[styles.lightText, styles.mbTight]}>{Lang.pluralize(Lang.get("x_guests_online"), this.props.data.activeUsers.count)}</Text>
				</View>
			);
		} else {
			return (
				<View style={[styles.row, styles.phWide, styles.ptStandard, styles.pbVeryTight, styles.mbWide, componentStyles.wrapper]}>
					{Boolean(this.state.tickerReady) && this.state.tickerNames.length >= ActiveUsers.minimumTickerNames && (
						<View style={[styles.pbTight, styles.mbStandard, styles.bBorder, styles.lightBorder, componentStyles.tickerWrapper]}>{this.getTicker()}</View>
					)}
					<View style={[styles.flexRow, styles.flexWrap, styles.flexJustifyBetween]}>
						{this.getCells()}
						{this.getMoreBubble()}
					</View>
				</View>
			);
		}
	}
}

const _componentStyles = styleVars => ({
	andMore: {
		height: 36,
		borderRadius: 36
	},
	tickerWrapper: {
		height: 26
	},
	tickerItem: {
		position: "absolute",
		left: 0,
		right: 0
	}
});

export default compose(
	withTheme(_componentStyles),
	connect(state => ({
		site: state.site
	}))
)(ActiveUsers);
