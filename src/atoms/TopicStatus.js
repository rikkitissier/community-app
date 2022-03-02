import React, { memo } from "react";
import { StyleSheet, Text, View, Image } from "react-native";

import Lang from "../utils/Lang";
import { withTheme } from "../themes";
import icons from "../icons";

const TopicStatus = ({ styles, componentStyles, ...props }) => {
	const statuses = {
		pinned: {
			text: Lang.get("status_pinned"),
			icon: <Image style={[componentStyles.statusIcon, componentStyles.pinnedIcon]} resizeMode="stretch" source={icons.PINNED} />
		},
		hidden: {
			text: Lang.get("status_hidden"),
			icon: <Image style={[componentStyles.statusIcon, componentStyles.hiddenIcon]} resizeMode="stretch" source={icons.HIDDEN} />
		},
		deleted: {
			text: Lang.get("status_deleted"),
			icon: <Image style={[componentStyles.statusIcon, componentStyles.hiddenIcon]} resizeMode="stretch" source={icons.CROSS_CIRCLE_SOLID} />
		},
		unapproved: {
			text: Lang.get("status_unapproved"),
			icon: <Image style={[componentStyles.statusIcon, componentStyles.hiddenIcon]} resizeMode="stretch" source={icons.PENDING} />
		},
		hot: {
			text: Lang.get("status_hot"),
			icon: <Image style={[componentStyles.statusIcon, componentStyles.hotIcon]} resizeMode="stretch" source={icons.FIRE} />
		},
		featured: {
			text: Lang.get("status_featured"),
			icon: <Image style={[componentStyles.statusIcon, componentStyles.featuredIcon]} resizeMode="stretch" source={icons.STAR_SOLID} />
		},
		locked: {
			text: Lang.get("status_locked"),
			icon: <Image style={[componentStyles.statusIcon, componentStyles.lockedIcon]} resizeMode="stretch" source={icons.LOCKED} />
		},
		archived: {
			text: Lang.get("status_archived"),
			icon: <Image style={[componentStyles.statusIcon, componentStyles.lockedIcon]} resizeMode="stretch" source={icons.ARCHIVED} />
		}
	};

	return (
		<View style={[componentStyles.wrapper, props.style || null]}>
			{statuses[props.type]["icon"]}
			{!Boolean(props.noLabel) && <Text style={[props.textStyle, componentStyles.status, componentStyles[props.type]]}>{statuses[props.type]["text"]}</Text>}
		</View>
	);
};

const _componentStyles = styleVars => ({
	wrapper: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center"
	},
	status: {
		fontWeight: "500",
		fontSize: 13
	},
	statusIcon: {
		width: 12,
		height: 12,
		marginRight: styleVars.spacing.veryTight
	},
	pinned: {
		color: "#409c69"
	},
	pinnedIcon: {
		tintColor: "#409c69"
	},
	hidden: {
		color: "#BE3951"
	},
	hiddenIcon: {
		tintColor: "#BE3951"
	},
	deleted: {
		color: "#BE3951"
	},
	deletedIcon: {
		tintColor: "#BE3951"
	},
	unapproved: {
		color: "#BE3951"
	},
	unapprovedIcon: {
		tintColor: "#BE3951"
	},
	featured: {
		color: "#409c69"
	},
	featuredIcon: {
		tintColor: "#409c69"
	},
	hot: {
		color: "#d5611b"
	},
	hotIcon: {
		tintColor: "#d5611b"
	},
	locked: {
		color: styleVars.lightText
	},
	lockedIcon: {
		tintColor: styleVars.lightText
	},
	archived: {
		color: styleVars.lightText
	},
	archivedIcon: {
		tintColor: styleVars.lightText
	}
});

export default withTheme(_componentStyles)(memo(TopicStatus));
