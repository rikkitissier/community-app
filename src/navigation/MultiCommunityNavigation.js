import React, { Component } from "react";
import {
	createAppContainer,
	createBottomTabNavigator,
	createMaterialTopTabNavigator,
	createDrawerNavigator,
	createStackNavigator,
	NavigationActions
} from "react-navigation";
import { BottomTabBar } from "react-navigation-tabs";
import { Text, View } from "react-native";
import { connect } from "react-redux";

// ----
// IPS Screens
import MyCommunitiesScreen from "../screens/multi/MyCommunitiesScreen";
import MultiCategoryListScreen from "../screens/multi/MultiCategoryListScreen";
import MultiCategoryScreen from "../screens/multi/MultiCategoryScreen";
import MultiSettingsScreen from "../screens/multi/MultiSettingsScreen";

import { NavigationTabIcon, NavigationTabNotification } from "../ecosystems/Navigation";
import CustomHeader from "../ecosystems/CustomHeader";
import { withTheme } from "../themes";
import icons from "../icons";
import Lang from "../utils/Lang";

class MultiCommunityNavigation extends Component {
	constructor(props) {
		super(props);

		const { styles, styleVars } = this.props;
		const TabNavigator = createBottomTabNavigator(
			{
				MultiHome: {
					screen: createStackNavigator(
						{
							Home: {
								screen: MyCommunitiesScreen
							}
						},
						{
							cardStyle: {
								backgroundColor: styleVars.appBackground
							},
							defaultNavigationOptions: {
								header: props => {
									return <CustomHeader {...props} />;
								},
								headerTitleStyle: styles.headerTitle,
								headerStyle: styles.header,
								headerBackTitleStyle: styles.headerBack,
								headerTintColor: "white",
								headerBackTitle: null
							}
						}
					),
					navigationOptions: {
						tabBarLabel: "My Communities",
						header: props => {
							return <CustomHeader {...props} title="My Communities" />;
						},
						tabBarIcon: props => <NavigationTabIcon {...props} active={icons.MULTI_MINE_SOLID} inactive={icons.MULTI_MINE} />
					}
				},
				MultiCategory: {
					screen: createStackNavigator(
						{
							List: {
								screen: MultiCategoryListScreen
							},
							Category: {
								screen: MultiCategoryScreen
							}
						},
						{
							cardStyle: {
								backgroundColor: styleVars.appBackground
							},
							defaultNavigationOptions: {
								header: props => {
									return <CustomHeader {...props} />;
								},
								headerTitleStyle: styles.headerTitle,
								headerStyle: styles.header,
								headerBackTitleStyle: styles.headerBack,
								headerTintColor: "white",
								headerBackTitle: null
							}
						}
					),
					navigationOptions: {
						tabBarLabel: "Discover",
						header: props => {
							return <CustomHeader {...props} title="Discover Communities" />;
						},
						tabBarIcon: props => <NavigationTabIcon {...props} active={icons.MULTI_BROWSE_SOLID} inactive={icons.MULTI_BROWSE} />
					}
				},
				MultiSettings: {
					screen: createStackNavigator(
						{
							Category: {
								screen: MultiSettingsScreen
							}
						},
						{
							cardStyle: {
								backgroundColor: styleVars.appBackground
							},
							defaultNavigationOptions: {
								header: props => {
									return <CustomHeader {...props} />;
								},
								headerTitleStyle: styles.headerTitle,
								headerStyle: styles.header,
								headerBackTitleStyle: styles.headerBack,
								headerTintColor: "white",
								headerBackTitle: null
							}
						}
					),
					navigationOptions: {
						tabBarLabel: "Preferences",
						header: props => {
							return <CustomHeader {...props} title="Preferences" />;
						},
						tabBarIcon: props => <NavigationTabIcon {...props} active={icons.MULTI_SETTINGS_SOLID} inactive={icons.MULTI_SETTINGS} />
					}
				}
			},
			{
				lazy: false,
				tabBarPosition: "bottom",
				tabBarOptions: {
					showLabel: true,
					inactiveTintColor: styleVars.tabInactive,
					activeTintColor: styleVars.tabActive,
					style: styles.primaryTabBar
				}
			}
		);

		this.AppContainer = createAppContainer(TabNavigator);
	}

	render() {
		return (
			<View style={{ flex: 1 }}>
				<this.AppContainer />
			</View>
		);
	}
}

export default withTheme()(MultiCommunityNavigation);
