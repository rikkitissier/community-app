import React from "react";
import { Text, View, Image } from "react-native";
import FadeIn from "react-native-fade-in-image";

import Lang from "../../utils/Lang";
import highlightTerms from "../../utils/highlightTerms";
import getImageUrl from "../../utils/getImageUrl";
import getSuitableImage from "../../utils/getSuitableImage";
import UnreadIndicator from "../../atoms/UnreadIndicator";
import UserPhoto from "../../atoms/UserPhoto";
import { stripWhitespace } from "../../utils/richText";
import { withTheme } from "../../themes";
import Time from "../../atoms/Time";

const SearchResultItem = props => {
	const { styles, componentStyles, styleVars } = props;
	const imageToUse = getSuitableImage(props.data.contentImages || null);
	const hidden = props.data.hiddenStatus !== null;

	return (
		<React.Fragment>
			<View style={componentStyles.itemHeader}>
				<View style={[componentStyles.itemUserInfo, styles.mrWide, styles.flexReset]}>
					<UserPhoto size={22} url={props.data.author.photo} />
					<Text style={[styles.contentText, styles.text, styles.mlTight, hidden && styles.moderatedText]}>{props.data.author.name}</Text>
				</View>
				<Time style={[styles.lightText, hidden && styles.moderatedLightText]} timestamp={props.data.updated} />
			</View>
			{Boolean(imageToUse) && (
				<FadeIn style={[componentStyles.imageContainer, styles.mtStandard]} placeholderStyle={{ backgroundColor: styleVars.placeholderColors.from }}>
					<Image style={componentStyles.image} source={{ uri: getImageUrl(imageToUse) }} resizeMode="cover" />
				</FadeIn>
			)}
			<View style={componentStyles.itemBody}>
				<Text style={[styles.itemTitle, hidden && styles.moderatedTitle]} numberOfLines={1}>
					<UnreadIndicator show={props.data.unread} />
					{highlightTerms(props.data.title, props.term, styles.highlightedText)}
				</Text>
				<Text style={[styles.contentText, styles.text, hidden && styles.moderatedText]} numberOfLines={2}>
					{highlightTerms(stripWhitespace(props.data.content.trim()), props.term, styles.highlightedText)}
				</Text>
			</View>
			<View style={componentStyles.itemMeta}>
				<Text style={[styles.lightText, hidden && styles.moderatedLightText]} numberOfLines={1}>
					{props.data.replies !== null && `${Lang.pluralize(Lang.get("replies"), Lang.formatNumber(props.data.replies))} - `}
					{props.data.articleLang.definiteUC} in {props.data.containerTitle}
				</Text>
			</View>
		</React.Fragment>
	);
};

const _componentStyles = styleVars => ({
	itemHeader: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginHorizontal: styleVars.spacing.wide
	},
	itemUserInfo: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "flex-start",
		alignItems: "center"
	},
	itemBody: {
		marginTop: styleVars.spacing.tight,
		marginHorizontal: styleVars.spacing.wide
	},
	itemMeta: {
		marginHorizontal: styleVars.spacing.wide,
		marginTop: styleVars.spacing.tight
	},
	imageContainer: {
		height: 105,
		width: "100%",
		backgroundColor: "#333"
	},
	image: {
		flex: 1,
		width: "100%"
	}
});

export default withTheme(_componentStyles)(SearchResultItem);
