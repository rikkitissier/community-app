import React, { Component } from "react";
import { Text, View, StyleSheet, TouchableHighlight } from "react-native";
import { compose } from "react-apollo";
import { withNavigation } from "react-navigation";

import ContentRow from "../../ecosystems/ContentRow";
import UserPhoto from "../../atoms/UserPhoto";
import Time from "../../atoms/Time";
import { PlaceholderContainer, PlaceholderElement } from "../../ecosystems/Placeholder";
import { withTheme } from "../../themes";

const NotificationRow = props => {
	const { styles, styleVars, componentStyles } = props;

	if (props.loading) {
		return (
			<ContentRow>
				<PlaceholderContainer height={58} style={[styles.mrStandard, styles.mlStandard, styles.mtStandard, styles.mbStandard]}>
					<PlaceholderElement circle radius={42} left={0} top={0} />
					<PlaceholderElement width={300} height={15} top={2} left={42 + styleVars.spacing.standard} />
					<PlaceholderElement width={200} height={12} top={26} left={42 + styleVars.spacing.standard} />
					<PlaceholderElement width={200} height={12} top={44} left={42 + styleVars.spacing.standard} />
				</PlaceholderContainer>
			</ContentRow>
		);
	}

	return (
		<ContentRow unread={props.data.unread} onPress={props.onPress}>
			<View style={componentStyles.rowInner}>
				<View style={componentStyles.author}>
					<UserPhoto url={props.data.author.photo || null} size={42} />
				</View>
				<View style={componentStyles.content}>
					<View style={componentStyles.metaInfo}>
						{Boolean(props.data.title) && (
							<Text style={[styles.smallItemTitle, componentStyles.title, props.data.readDate == null ? styles.title : styles.titleRead]}>
								{props.data.title}
							</Text>
						)}
						<Time style={[styles.smallText, styles.lightText]} timestamp={props.data.updatedDate} />
					</View>
					{Boolean(props.data.content) && (
						<Text style={[styles.smallText, styles.lightText]} numberOfLines={2}>
							{props.data.content.plain}
						</Text>
					)}
				</View>
			</View>
		</ContentRow>
	);
};

const _componentStyles = styleVars => ({
	rowInner: {
		paddingHorizontal: styleVars.spacing.standard,
		paddingVertical: styleVars.spacing.standard,
		flexDirection: "row",
		justifyContent: "space-between",
		alignContent: "stretch"
	},
	author: {
		marginRight: styleVars.spacing.standard
	},
	content: {
		flex: 1
	},
	metaInfo: {
		display: "flex",
		flexDirection: "row",
		alignItems: "flex-start"
	},
	title: {
		fontWeight: "500",
		marginBottom: styleVars.spacing.veryTight,
		flexGrow: 1,
		flexBasis: 0,
		marginRight: styleVars.spacing.standard
	}
});

export default compose(
	withNavigation,
	withTheme(_componentStyles)
)(NotificationRow);
