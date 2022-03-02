import React, { memo } from "react";
import { Text, View } from "react-native";

import UserPhoto from "../../atoms/UserPhoto";
import UnreadIndicator from "../../atoms/UnreadIndicator";
import { ReactionOverview } from "../../ecosystems/Reaction";
import _componentStyles from "./styles";
import { stripWhitespace } from "../../utils/richText";
import { withTheme } from "../../themes";
import Time from "../../atoms/Time";
import Lang from "../../utils/Lang";

const StreamComment = props => {
	const { componentStyles, styles } = props;
	const hidden = props.data.hiddenStatus !== null;

	return (
		<React.Fragment>
			<View style={componentStyles.streamHeader}>
				<View style={componentStyles.streamMeta}>
					<View style={componentStyles.streamMetaInner}>
						<UserPhoto url={props.data.author.photo} size={20} />
						<Text style={[styles.text, componentStyles.streamMetaText, componentStyles.streamMetaAction, hidden && styles.moderatedText]}>
							{props.metaString}
						</Text>
					</View>
					<Time style={[componentStyles.streamMetaText, styles.lightText, hidden && styles.moderatedLightText]} timestamp={props.data.updated} />
				</View>
			</View>
			<View style={[componentStyles.streamContent, componentStyles.streamContentIndented]}>
				{(props.data.title !== null || Boolean(props.data.containerTitle)) && (
					<View style={componentStyles.streamItemInfo}>
						<View style={componentStyles.streamItemInfoInner}>
							{props.data.title !== null && (
								<Text style={[styles.smallItemTitle, hidden && styles.moderatedTitle]}>
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
				<View style={componentStyles.snippetWrapper}>
					<Text style={[styles.text, componentStyles.snippetText, hidden && styles.moderatedText]} numberOfLines={2}>
						{stripWhitespace(props.data.content)}
					</Text>
				</View>
				{Boolean(props.data.reactions.length) && (
					<View style={componentStyles.streamFooter}>
						<ReactionOverview small style={componentStyles.reactionOverview} reactions={props.data.reactions} />
					</View>
				)}
			</View>
		</React.Fragment>
	);
};

export default withTheme(_componentStyles)(memo(StreamComment));
