import React, { Component } from "react";
import { Text, Image, ScrollView, AsyncStorage, View, RefreshControl, LayoutAnimation, Dimensions } from "react-native";
import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";
import gql from "graphql-tag";
import { graphql, withApollo, compose } from "react-apollo";
import _ from "underscore";
import { connect } from "react-redux";

import NavigationService from "../../utils/NavigationService";
import Lang from "../../utils/Lang";
import GoToMulti from "../../atoms/GoToMulti";
import { Post } from "../../ecosystems/Post";
import LargeTitle from "../../atoms/LargeTitle";
import ErrorBox from "../../atoms/ErrorBox";
import { NavBar } from "../../ecosystems/NavBar";
import StreamCard from "../../ecosystems/Stream";
import LoginRegisterPrompt from "../../ecosystems/LoginRegisterPrompt";
import getErrorMessage from "../../utils/getErrorMessage";
import { withTheme } from "../../themes";
import asyncCache from "../../utils/asyncCache";
import icons from "../../icons";

import { HomeSections } from "../../ecosystems/HomeSections";

/*
NOTE: In this component we don't use the HOC graphql(), instead manually calling
this.props.client.query on mount. This allows us to build a dynamic query based
on the homepage widgets that have been configured on the site.
*/

//const HomeSectionsToShow = ["new_content", "active_users", "our_picks", "popular_contributors"];

class HomeScreen extends Component {
	static navigationOptions = ({ navigation }) => {
		return {
			title: "Community",
			...(Expo.Constants.manifest.extra.multi ? { headerLeft: <GoToMulti /> } : null)
		};
	};

	constructor(props) {
		super(props);

		this.state = {
			loading: true,
			loadedFromCache: false,
			error: false,
			data: null,
			refreshing: false,
			token: null,
			showLogs: false
		};

		this._menuHandlers = {};

		this.onRefresh = this.onRefresh.bind(this);
	}

	async componentDidMount() {
		this.startHomeQuery();

		const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
		let token = null;

		// If they haven't granted access then we don't need to do anything here
		if (status === "granted" && Expo.Constants.isDevice) {
			try {
				token = await Notifications.getExpoPushTokenAsync({
					experienceId: Expo.Constants.manifest.extra.experienceId
				});

				this.setState({
					token: token.data
				});
			} catch (err) {}
		}
	}

	/**
	 * Calculates the width of cards on the homescreen, ensuring some of the next card is
	 * visible (providing the value is within bounds)
	 *
	 * @return 	number
	 */
	calculateCardWidth() {
		const MAX_WIDTH = 285;
		const MIN_WIDTH = 200;
		const { width } = Dimensions.get("window");
		const fullCardWidth = width - this.props.styleVars.spacing.wide * 2;
		const idealWidth = fullCardWidth - fullCardWidth / 15;

		return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, idealWidth));
	}

	/**
	 * Set state to loading and fetch the home screen blocks
	 *
	 * @return 	void
	 */
	startHomeQuery() {
		this.setState({
			loading: true,
			error: false
		});

		this.doHomeQuery();
	}

	/**
	 * Set the RefreshControl state and triggers a new query to update the homescreen
	 *
	 * @return 	void
	 */
	onRefresh() {
		this.setState(
			{
				refreshing: true,
				error: false
			},
			() => {
				this.doHomeQuery();
			}
		);
	}

	/**
	 * Runs the query to get the home screen blocks
	 *
	 * @return 	void
	 */
	async doHomeQuery() {
		let queryFragments = [];
		let queryIncludes = [];

		// Dynamically build the fragments we'll need
		this.props.site.settings.mobileHomeBlocks.forEach(section => {
			if (!_.isUndefined(HomeSections[section])) {
				queryFragments.push("..." + HomeSections[section].fragmentName);
				queryIncludes.push(HomeSections[section].fragment);
			}
		});

		const query = gql`
			query HomeQuery ($streamId: ID) {
				core {
					${queryFragments.join("\n")}
				}
			}
			${gql(queryIncludes.join("\n"))}
		`;

		try {
			const { data } = await this.props.client.query({
				query,
				variables: {
					streamId: this.props.auth.isAuthenticated ? 1 : 0
				}
				//fetchPolicy: "network-only"
			});

			LayoutAnimation.configureNext({
				duration: 300,
				create: {
					type: LayoutAnimation.Types.easeInEaseOut,
					property: LayoutAnimation.Properties.opacity
				},
				update: { type: LayoutAnimation.Types.easeInEaseOut }
			});

			this.setState({
				loading: false,
				refreshing: false,
				data: data.core
			});

			// Write home screen data back to the cache
			const { apiUrl } = this.props.app.currentCommunity;
			await asyncCache.setData(data.core, "homeData", apiUrl);
		} catch (err) {
			console.log(err);

			this.setState({
				loading: false,
				refreshing: false,
				error: true
			});
		}
	}

	/**
	 * Returns the login/register component if a guest
	 *
	 * @return 	Component|null
	 */
	getLoginRegPrompt() {
		if (this.props.auth.isAuthenticated) {
			return null;
		}

		return (
			<LoginRegisterPrompt
				closable
				register={this.props.site.settings.allow_reg !== "DISABLED"}
				registerUrl={this.props.site.settings.allow_reg_target || null}
				navigation={this.props.navigation}
				message={Lang.get(this.props.site.settings.allow_reg !== "DISABLED" ? "login_register_prompt" : "login_prompt", {
					siteName: this.props.site.settings.board_name
				})}
			/>
		);
	}

	/**
	 * Try refreshing the home screen
	 *
	 * @return 	void
	 */
	refreshAfterError() {
		this.startHomeQuery();
	}

	/**
	 * Build an array of navigation items
	 *
	 * @return 	array
	 */
	getNavConfig() {
		return this.props.site.menu.map((item, idx) => ({
			key: `menu_${idx}`,
			id: item.id,
			icon: item.icon || null,
			title: item.title,
			url: item.url
		}));
	}

	render() {
		const { styles } = this.props;

		if (this.state.error) {
			return <ErrorBox message={Lang.get("home_view_error")} refresh={() => this.refreshAfterError()} />;
		} else {
			let data = null;

			if (this.state.data) {
				data = this.state.data;
			} else if (!_.isNull(this.props.site.siteCache) && this.props.site.siteCache.homeData) {
				data = this.props.site.siteCache.homeData;
			}

			return (
				<React.Fragment>
					<NavBar items={this.getNavConfig()} />
					{this.getLoginRegPrompt()}
					<ScrollView refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={this.onRefresh} />}>
						{this.props.site.settings.mobileHomeBlocks.map(section => {
							if (_.isUndefined(HomeSections[section])) {
								return null;
							}

							const SectionComponent = HomeSections[section].component;
							return (
								<React.Fragment key={section}>
									<LargeTitle icon={HomeSections[section].icon || null}>{Lang.get(section)}</LargeTitle>
									<SectionComponent
										loading={this.state.loading && data === null}
										refreshing={this.state.refreshing}
										data={data}
										cardWidth={this.calculateCardWidth()}
										navigation={this.props.navigation}
									/>
								</React.Fragment>
							);
						})}
					</ScrollView>
				</React.Fragment>
			);
		}
	}
}

export default compose(
	connect(state => ({
		app: state.app,
		user: state.user,
		site: state.site,
		auth: state.auth
	})),
	withApollo,
	withTheme()
)(HomeScreen);
