import React, { memo } from "react";
import { Text, View } from "react-native";

import Lang from "../../utils/Lang";
import UserPhoto from "../../atoms/UserPhoto";
import UnreadIndicator from "../../atoms/UnreadIndicator";
import { ReactionOverview } from "../../ecosystems/Reaction";
import { stripWhitespace } from "../../utils/richText";
import _componentStyles from "./styles";
import { withTheme } from "../../themes";
import Time from "../../atoms/Time";

const StreamItem = props => {
	const { componentStyles, styles } = props;
	const hidden = props.data.hiddenStatus !== null;

	return (
		<React.Fragment>
			<View style={componentStyles.streamHeader}>
				<View style={[componentStyles.streamMeta, props.data.title !== null || Boolean(props.data.containerTitle) ? styles.mbStandard : null]}>
					<View style={componentStyles.streamMetaInner}>
						<UserPhoto url={props.data.author.photo} size={20} />
						<Text style={[styles.text, componentStyles.streamMetaText, componentStyles.streamMetaAction, hidden && styles.moderatedText]}>
							{props.metaString}
						</Text>
					</View>
					<Time style={[componentStyles.streamMetaText, styles.lightText, hidden && styles.moderatedLightText]} timestamp={props.data.updated} />
				</View>
				{(props.data.title !== null || Boolean(props.data.containerTitle)) && (
					<View style={componentStyles.streamItemInfo}>
						<View style={[componentStyles.streamItemInfoInner, componentStyles.streamItemInfoInnerWithPhoto]}>
							{props.data.title !== null && (
								<Text style={[styles.itemTitle, hidden && styles.moderatedTitle]}>
									<UnreadIndicator show={props.data.unread} />
									{props.data.title}
								</Text>
							)}
							{Boolean(props.data.containerTitle) && (
								<Text style={[componentStyles.streamItemContainer, hidden && styles.moderatedLightText]}>
									{Lang.get("in_container", { container: props.data.containerTitle })}
								</Text>
							)}
						</View>
					</View>
				)}
			</View>
			{props.image || null}
			<View style={componentStyles.streamContent}>
				{Boolean(props.data.content) && (
					<Text style={[styles.text, componentStyles.snippetText, hidden && styles.moderatedText]} numberOfLines={3}>
						{stripWhitespace(props.data.content)}
					</Text>
				)}
				{(Boolean(props.data.reactions.length) || props.data.replies !== null) && (
					<View style={componentStyles.streamFooter}>
						{Boolean(props.data.reactions.length) && <ReactionOverview small style={componentStyles.reactionOverview} reactions={props.data.reactions} />}
						{props.data.replies !== null && (
							<Text style={[styles.lightText, hidden && styles.moderatedLightText]} numberOfLines={1}>
								{`${Lang.pluralize(Lang.get("replies"), Lang.formatNumber(props.data.replies))}`}
							</Text>
						)}
					</View>
				)}
			</View>
		</React.Fragment>
	);
};

export default withTheme(_componentStyles)(memo(StreamItem));
