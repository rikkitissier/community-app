import React, { Component } from "react";
import { View, TouchableOpacity, Platform } from "react-native";

import { PlaceholderElement } from "../../ecosystems/Placeholder";
import { withTheme } from "../../themes";

const ContentCard = props => {
	const { componentStyles, styleVars } = props;

	if (props.loading) {
		return (
			<View style={[componentStyles.contentCard, props.style, { height: 300 }]}>
				<PlaceholderElement circle radius={20} left={12} top={12} />
				<PlaceholderElement width={150} left={40} top={16} height={10} />
				<PlaceholderElement width="100%" left={0} right={0} top={45} height={135} />
				{Boolean(props.image) && <PlaceholderElement width={200} left={12} top={192} />}
				<PlaceholderElement width={150} left={12} top={215} height={12} />
				<PlaceholderElement width={250} left={12} top={240} height={12} />
				<PlaceholderElement width={250} left={12} top={256} height={12} />
				<PlaceholderElement width={250} left={12} top={272} height={12} />
			</View>
		);
	}

	return (
		<TouchableOpacity activeOpacity={styleVars.touchOpacity} style={[componentStyles.contentCard, props.style]} onPress={props.onPress || null}>
			<View style={[componentStyles.contentCardInner]}>
				{Boolean(props.header) && (
					<View style={componentStyles.streamHeader}>
						<View style={componentStyles.streamMeta}>
							<View style={componentStyles.streamMetaInner}>{props.header}</View>
						</View>
					</View>
				)}
				{Boolean(props.image) && props.image}
				{Boolean(props.content) && <View style={[componentStyles.streamFooter]}>{props.content}</View>}
			</View>
		</TouchableOpacity>
	);
};

const _componentStyles = styleVars => ({
	contentCard: {
		borderRadius: Platform.OS === "ios" ? 5 : 2,
		backgroundColor: styleVars.contentBackground,
		shadowColor: "rgba(0,0,0,0.05)",
		shadowOffset: {
			width: 0,
			height: 5
		},
		shadowOpacity: 1,
		shadowRadius: 12,
		elevation: 1,
		marginBottom: styleVars.spacing.wide
	},
	contentCardInner: {
		borderRadius: Platform.OS === "ios" ? 5 : 2,
		overflow: "hidden",
		display: "flex",
		justifyContent: "flex-start",
		flexGrow: 1
	},
	streamHeader: {
		paddingHorizontal: styleVars.spacing.wide,
		paddingTop: styleVars.spacing.standard
	},
	streamMeta: {
		width: "100%",
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-between",
		paddingBottom: styleVars.spacing.standard
	},
	streamMetaInner: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center"
	},
	streamFooter: {
		paddingHorizontal: styleVars.spacing.wide,
		paddingBottom: styleVars.spacing.wide,
		flexGrow: 1
	}
});

export default withTheme(_componentStyles)(ContentCard);
