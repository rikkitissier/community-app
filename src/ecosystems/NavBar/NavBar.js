import React, { PureComponent } from "react";
import { View, TouchableOpacity, StyleSheet, Image, FlatList, Text, Platform } from "react-native";
import _ from "underscore";

import NavItem from "./NavItem";
import NavigationService from "../../utils/NavigationService";
import { PlaceholderRepeater, PlaceholderContainer, PlaceholderElement } from "../../ecosystems/Placeholder";
import icons from "../../icons";
import { withTheme } from "../../themes";

class NavBar extends PureComponent {
	constructor(props) {
		super(props);
		this._menuHandlers = {};

		this.renderNavItem = this.renderNavItem.bind(this);
	}

	/**
	 * Memoization function that returns a handler for menu item onPress
	 *
	 * @param 	object 		item 		Item data
	 * @return 	function
	 */
	getMenuPressHandler(item) {
		if (_.isUndefined(this._menuHandlers[item.id])) {
			this._menuHandlers[item.id] = () => {
				NavigationService.navigate(item.url.full);
			};
		}

		return this._menuHandlers[item.id];
	}

	/**
	 * Render a nav bar item
	 *
	 * @param 	object 		item 		The nav bar item to render
	 * @return 	void
	 */
	renderNavItem({ item }) {
		let icon;

		try {
			if (!_.isUndefined(item.icon) && !_.isUndefined(icons[item.icon])) {
				icon = icons[item.icon];
			} else if (NavigationService.isInternalUrl(item.url.full)) {
				icon = icons.ARROW_RIGHT;
			} else {
				icon = icons.GLOBE;
			}
		} catch (err) {
			return null;
		}

		return <NavItem icon={icon} onPress={this.getMenuPressHandler(item)} title={item.title.replace("mobilenavigation_", "")} />;
	}

	render() {
		const { componentStyles } = this.props;

		return (
			<View style={componentStyles.navigator}>
				<FlatList renderItem={this.renderNavItem} data={this.props.items} keyExtractor={item => item.key} horizontal showsHorizontalScrollIndicator={false} />
			</View>
		);
	}
}

const _componentStyles = styleVars => ({
	navigator: {
		backgroundColor: styleVars.navBar.background,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0,0,0,0.1)",
		...Platform.select({
			ios: {
				height: 64,
				paddingVertical: styleVars.spacing.standard
			},
			android: {
				height: 60,
				paddingVertical: styleVars.spacing.tight,
				elevation: 2
			}
		})
	}
});

export default withTheme(_componentStyles)(NavBar);
