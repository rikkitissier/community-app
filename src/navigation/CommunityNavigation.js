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
import { View, Platform } from "react-native";
import { connect } from "react-redux";
import { compose } from "react-apollo";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import "react-native-gesture-handler";

// ----
// Core screens
import TestScreen from "../screens/core/TestScreen";
import NoopScreen from "../screens/core/NoopScreen";
import HomeScreen from "../screens/core/HomeScreen";
import SearchScreen from "../screens/core/SearchScreen";
import StreamViewScreen from "../screens/core/StreamViewScreen";
import NotificationsScreen from "../screens/core/NotificationsScreen";
import NotificationsSettingsScreen from "../screens/core/NotificationsSettingsScreen";
import NotificationsSettingsTypeScreen from "../screens/core/NotificationsSettingsTypeScreen";
import ProfileScreen from "../screens/core/ProfileScreen";
import UserScreen from "../screens/core/UserScreen";
import PollScreen from "../screens/core/PollScreen";
import ReportContentScreen from "../screens/core/ReportContentScreen";
import LoginScreen from "../screens/core/LoginRegister/LoginScreen";
import RegisterScreen from "../screens/core/LoginRegister/RegisterScreen";
import WebViewScreen from "../screens/core/WebViewScreen";
import LegalDocumentScreen from "../screens/core/LegalDocumentScreen";
import LicensesScreen from "../screens/core/LicensesScreen";
import AccountSettingsScreen from "../screens/core/AccountSettings/AccountSettingsScreen";
// ----
// Forums screens
import ForumListScreen from "../screens/forums/ForumListScreen";
import FluidForumScreen from "../screens/forums/FluidForumScreen";
import TopicListScreen from "../screens/forums/TopicListScreen";
import TopicViewScreen from "../screens/forums/TopicViewScreen";
import CreateTopicScreen from "../screens/forums/CreateTopicScreen";
import ReplyTopicScreen from "../screens/forums/ReplyTopicScreen";

import NavigationService from "../utils/NavigationService";
import { resetModalWebview } from "../redux/actions/app";
import { NavigationTabIcon, NavigationTabNotification } from "../ecosystems/Navigation";
import CustomHeader from "../ecosystems/CustomHeader";
import { withTheme } from "../themes";
import UserPhoto from "../atoms/UserPhoto";
import { navigationIcons } from "../icons";
import Lang from "../utils/Lang";

class AppNavigation extends Component {
	constructor(props) {
		super(props);

		this.state = {
			MasterNavigation: this._getMasterNavigation()
		};
	}

	_getMainStack(options, initialRoute) {
		const { styles, styleVars } = this.props;
		return createStackNavigator(
			{
				HomeScreen: {
					screen: HomeScreen,
					navigationOptions: {
						title: this.props.site.settings.board_name
					}
				},
				ForumIndex: { screen: ForumListScreen },
				FluidForum: {
					screen: FluidForumScreen,
					navigationOptions: {
						title: Lang.get("all_topics")
					}
				},
				TopicList: { screen: TopicListScreen },
				TopicView: { screen: TopicViewScreen },
				Poll: { screen: PollScreen },
				Profile: { screen: ProfileScreen },
				SearchStack: { screen: SearchScreen },
				NotificationsStack: { screen: NotificationsScreen },
				NotificationsSettings: { screen: NotificationsSettingsScreen },
				NotificationsSettingsType: { screen: NotificationsSettingsTypeScreen },
				AccountSettings: {
					screen: this._getSettingsStack(),
					navigationOptions: {
						title: Lang.get("account_settings")
					}
				},
				StreamView: { screen: StreamViewScreen },
				WebView: { screen: WebViewScreen },
				LegalDocument: { screen: LegalDocumentScreen },
				Licenses: { screen: LicensesScreen }
			},
			{
				initialRouteName: initialRoute || "HomeScreen",
				cardStyle: {
					backgroundColor: styleVars.appBackground
				},
				defaultNavigationOptions: Object.assign(
					{
						header: props => {
							return <CustomHeader {...props} />;
						},
						headerTitleStyle: styles.headerTitle,
						headerStyle: styles.header,
						headerBackTitleStyle: styles.headerBack,
						headerTintColor: "white",
						headerBackTitle: null
					},
					options || null
				)
			}
		);
	}

	_getSettingsStack(options) {
		const { styles, styleVars } = this.props;

		return createStackNavigator(
			{
				AccountSettingsScreen: { screen: AccountSettingsScreen }
			},
			{
				initialRouteName: "AccountSettingsScreen",
				cardStyle: {
					backgroundColor: styleVars.appBackground
				},
				defaultNavigationOptions: Object.assign(
					{
						title: Lang.get("account_settings"),
						header: null
					},
					options || null
				)
			}
		);
	}

	_getLoginRegisterStack() {
		const { styles, styleVars } = this.props;

		return createStackNavigator(
			{
				LoginScreen: { screen: LoginScreen },
				RegisterScreen: { screen: RegisterScreen },
				AuthWebView: { screen: WebViewScreen }
			},
			{
				initialRouteName: "LoginScreen",
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
		);
	}

	/**
	 * Return the overall master navigation component
	 *
	 * @return StackNavigator
	 */
	_getMasterNavigation() {
		const { styles, styleVars } = this.props;

		console.log("transparent");

		const masterStack = createStackNavigator(
			{
				Root: {
					screen: this._getPrimaryTabBar(),
					navigationOptions: {
						header: null // Hide header because the tab navigator adds it
					}
				},
				CreateTopic: {
					screen: CreateTopicScreen,
					headerMode: "float",
					navigationOptions: {
						title: Lang.get("create_topic")
					}
				},
				ReplyTopic: {
					screen: ReplyTopicScreen,
					headerMode: "screen",
					navigationOptions: {
						title: Lang.get("reply_screen")
					}
				},
				LoginModal: {
					screen: this._getLoginRegisterStack(),
					navigationOptions: {
						header: null,
						headerMode: "none"
					}
				},
				ReportContent: {
					screen: ReportContentScreen,
					navigationOptions: {
						title: Lang.get("report_content_screen")
					}
				}
			},
			{
				mode: "modal",
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
		);

		if (this.props.auth.isAuthenticated) {
			//console.log("NAVIGATION: Rendering app with UserScreen");
			return createAppContainer(
				createDrawerNavigator(
					{
						Master: {
							screen: masterStack
						}
					},
					{
						drawerPosition: "left",
						contentComponent: UserScreen
					}
				)
			);
		} else {
			//console.log("NAVIGATION: Rendering app WITHOUT UserScreen");
			return createAppContainer(masterStack);
		}
	}

	/**
	 * Return our primary tab bar. Tabs returned depend on authentication status in props.
	 *
	 * @return TabNavigator
	 */
	_getPrimaryTabBar() {
		const { styles, styleVars } = this.props;

		const Home = {
			screen: this._getMainStack(),
			navigationOptions: {
				tabBarLabel: Lang.get("tab_home"),
				tabBarIcon: props => <NavigationTabIcon {...props} active={navigationIcons.HOME_ACTIVE} inactive={navigationIcons.HOME} />
			}
		};
		const Search = {
			screen: this._getMainStack({}, "SearchStack"),
			navigationOptions: {
				tabBarLabel: Lang.get("tab_search"),
				tabBarIcon: props => <NavigationTabIcon {...props} active={navigationIcons.SEARCH_ACTIVE} inactive={navigationIcons.SEARCH} />
			}
		};
		const Streams = {
			screen: this._getMainStack({}, "StreamView"),
			navigationOptions: {
				tabBarLabel: Lang.get("tab_streams"),
				header: props => {
					return <CustomHeader {...props} title="Forums" />;
				},
				tabBarIcon: props => <NavigationTabIcon {...props} active={navigationIcons.STREAMS_ACTIVE} inactive={navigationIcons.STREAMS} />
			}
		};
		const Notifications = {
			screen: this._getMainStack({}, "NotificationsStack"),
			navigationOptions: navigation => ({
				tabBarLabel: Lang.get("tab_notifications"),
				tabBarIcon: props => <NavigationTabNotification {...props} active={navigationIcons.NOTIFICATIONS_ACTIVE} inactive={navigationIcons.NOTIFICATIONS} />
			})
		};
		const User = {
			screen: NoopScreen,
			navigationOptions: navigation => ({
				tabBarLabel: Lang.get("tab_user"),
				tabBarIcon: ({ focused, tintColor }) => this._getUserPhoto(focused, tintColor),
				tabBarOnPress: (tab, jumpToIndex) => {
					navigation.navigation.openDrawer();
					//navigation.navigation.navigate("UserScreen");
				}
			})
		};
		const Login = {
			screen: this._getLoginRegisterStack(),
			navigationOptions: navigation => ({
				tabBarLabel: Lang.get("tab_signin"),
				tabBarIcon: props => <NavigationTabIcon {...props} active={navigationIcons.LOGIN_ACTIVE} inactive={navigationIcons.LOGIN} />,
				tabBarOnPress: (tab, jumpToIndex) => {
					NavigationService.launchAuth();
					//navigation.navigation.navigate("LoginModal");
				}
			})
		};

		let tabConfig = {
			Home,
			...(this.props.site.moduleAccess.core.search ? { Search } : {}),
			...(this.props.site.moduleAccess.core.discover ? { Streams } : {}),
			Login
		};

		if (this.props.auth.isAuthenticated) {
			//console.log("NAVIGATION: Tab config including User");
			tabConfig = {
				Home,
				...(this.props.site.moduleAccess.core.search ? { Search } : {}),
				...(this.props.site.moduleAccess.core.discover ? { Streams } : {}),
				Notifications,
				User
			};
		}

		const TabBarComponent = props => <BottomTabBar {...props} />;

		return createBottomTabNavigator(tabConfig, {
			lazy: true,
			tabBarPosition: "bottom",
			tabBarOptions: {
				showLabel: true,
				inactiveTintColor: styleVars.primaryTabInactive,
				activeTintColor: styleVars.primaryTabActive,
				style: styles.primaryTabBar,
				allowFontScaling: false
			}
		});
	}

	/**
	 * Return a URL for the user tab bar icon. Photo if it's a member, icon if it's a guest
	 *
	 * @return object|file resource
	 */
	_getUserPhoto(focused, tintColor) {
		const { styles } = this.props;

		if (this.props.auth.isAuthenticated && this.props.user.photo) {
			return <UserPhoto url={this.props.user.photo} size={Platform.OS === "ios" ? 25 : 18} />;
		} else {
			return <NavigationTabIcon focused={focused} tintColor={tintColor} active={navigationIcons.LOGIN_ACTIVE} inactive={navigationIcons.LOGIN} />;
		}
	}

	/**
	 * Called after component updates with new props
	 *
	 * Update master navigation component depending on guest status
	 * We use this to show appropriate tabs to guests vs. members
	 */
	componentDidUpdate(prevProps) {
		if (this.props.auth.isAuthenticated !== prevProps.auth.isAuthenticated || prevProps.app.darkMode !== this.props.app.darkMode) {
			//console.log("NAVIGATION: Building new nav");
			this.setState({
				MasterNavigation: this._getMasterNavigation()
			});
		}
	}

	/**
	 * Render component
	 */
	render() {
		return (
			<React.Fragment>
				<this.state.MasterNavigation
					ref={navigatorRef => {
						NavigationService.setTopLevelNavigator(navigatorRef);
					}}
				/>
			</React.Fragment>
		);
	}
}

export default compose(
	withTheme(),
	connect(state => ({
		app: state.app,
		user: state.user,
		auth: state.auth,
		site: state.site
	}))
)(AppNavigation);
