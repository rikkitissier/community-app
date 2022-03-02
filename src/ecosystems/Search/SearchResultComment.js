import React from "react";
import { Text, View } from "react-native";

import Lang from "../../utils/Lang";
import highlightTerms from "../../utils/highlightTerms";
import Time from "../../atoms/Time";
import UserPhoto from "../../atoms/UserPhoto";
import UnreadIndicator from "../../atoms/UnreadIndicator";
import { stripWhitespace } from "../../utils/richText";
import { withTheme } from "../../themes";

const SearchResultComment = props => {
	const { styles, componentStyles } = props;
	const hidden = props.data.hiddenStatus !== null;

	return (
		<React.Fragment>
			<View style={componentStyles.commentHeader}>
				<View style={componentStyles.commentItemInfo}>
					<Text style={[styles.smallItemTitle, styles.mrWide, styles.flexReset, hidden && styles.moderatedTitle]} numberOfLines={1}>
						<UnreadIndicator show={props.data.unread} />
						{highlightTerms(props.data.title, props.term, styles.highlightedText)}
					</Text>
					<Time style={[styles.lightText, hidden && styles.moderatedLightText]} timestamp={props.data.updated} />
				</View>
				<Text style={[styles.lightText, componentStyles.commentItemMeta, hidden && styles.moderatedLightText]}>
					{props.data.replies !== null && `${Lang.pluralize(Lang.get("replies"), Lang.formatNumber(props.data.replies))} - `}
					{Lang.get("item_in_container", { item: props.data.articleLang.definiteUC, container: props.data.containerTitle })}
				</Text>
			</View>
			<View style={[componentStyles.commentReplyWrap, styles.mtTight]}>
				<View style={[componentStyles.commentUserInfo]}>
					<UserPhoto size={18} url={props.data.author.photo} />
					<Text style={[styles.standardText, styles.text, styles.mlVeryTight, hidden && styles.moderatedText]}>
						{Lang.get("name_replied", { name: props.data.author.name })}
					</Text>
				</View>
				<Text style={[styles.standardText, styles.text, styles.mtTight, hidden && styles.moderatedText]} numberOfLines={2}>
					{highlightTerms(stripWhitespace(props.data.content.trim()), props.term, styles.highlightedText)}
				</Text>
			</View>
		</React.Fragment>
	);
};

const _componentStyles = styleVars => ({
	commentHeader: {
		marginHorizontal: styleVars.spacing.wide
	},
	commentItemInfo: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center"
	},
	commentReplyWrap: {
		borderLeftWidth: 3,
		borderLeftColor: styleVars.borderColors.dark,
		paddingLeft: styleVars.spacing.tight,
		marginHorizontal: styleVars.spacing.wide
	},
	commentUserInfo: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "flex-start",
		alignItems: "center"
	}
});

export default withTheme(_componentStyles)(SearchResultComment);
