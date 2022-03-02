import React, { Component } from "react";
import { Text, View } from "react-native";
import _ from "underscore";

import { PlaceholderElement } from "../ecosystems/Placeholder";
import NavigationService from "../utils/NavigationService";
import ContentRow from "../ecosystems/ContentRow";
import Lang from "../utils/Lang";
import { withTheme } from "../themes";

class NotificationSettingRow extends Component {
	constructor(props) {
		super(props);

		this.onPressRow = this.onPressRow.bind(this);
	}

	buildTypeString() {
		const types = [];
		const { data } = this.props;

		["push", "inline", "email"].forEach(type => {
			if (!_.isUndefined(data[type]) && !_.isNull(data[type]) && data[type].value === true) {
				types.push(Lang.get(`notification_type_${type}`));
			}
		});

		switch (types.length) {
			case 0:
				return Lang.get("notification_type_none");
			case 1:
				return types[0];
			case 2:
				return Lang.get("list_two", {
					one: types[0],
					two: types[1]
				});
			case 3:
				return Lang.get("list_three", {
					one: types[0],
					two: types[1],
					three: types[2]
				});
		}
	}

	onPressRow() {
		const { data } = this.props;

		NavigationService.navigateToScreen("NotificationsSettingsType", {
			id: data.id,
			title: data.lang,
			key: data.name,
			extension: data.extension,
			description: data.description,
			type: data.type,
			email: data.email,
			inline: data.inline,
			push: data.push
		});
	}

	render() {
		const { styles, componentStyles, styleVars } = this.props;

		if (this.props.loading) {
			return (
				<ContentRow style={[styles.row, { height: 40 }, componentStyles.menuItemWrap]}>
					<PlaceholderElement width="60%" top={12} left={styleVars.spacing.wide} height={16} />
					<PlaceholderElement width={40} top={6} right={styleVars.spacing.wide} height={26} />
				</ContentRow>
			);
		}

		return (
			<ContentRow showArrow style={[styles.flexRow, styles.flexAlignCenter, styles.phWide, styles.pvStandard]} onPress={this.onPressRow}>
				<View style={styles.flex}>
					<Text style={[styles.itemTitle, styles.mbVeryTight]} numberOfLines={1}>
						{_.unescape(this.props.data.lang)}
					</Text>
					<Text style={[styles.smallText, styles.text]}>{this.buildTypeString()}</Text>
				</View>
			</ContentRow>
		);
	}
}

const _componentStyles = styleVars => ({
	icon: {
		width: 24,
		height: 24,
		tintColor: styleVars.lightText,
		marginRight: 12
	},
	menuItem: {
		flex: 1
	},
	label: {
		fontSize: 15,
		color: styleVars.text,
		fontWeight: "500"
	},
	metaText: {
		color: styleVars.veryLightText,
		fontSize: 12
	},
	switch: {
		marginLeft: styleVars.spacing.standard
	}
});

export default withTheme(_componentStyles)(NotificationSettingRow);
