import React, { Component } from "react";
import { Text, Image, View, StyleSheet, TouchableHighlight } from "react-native";

import LockedIcon from "../../atoms/LockedIcon";
import getImageUrl from "../../utils/getImageUrl";
import getSuitableImage from "../../utils/getSuitableImage";
import CategoryName from "../../atoms/CategoryName";
import UnreadIndicator from "../../atoms/UnreadIndicator";
import { withTheme } from "../../themes";

class TopicInfo extends Component {
	constructor(props) {
		super(props);
	}

	/**
	 * Return a suitable thumbnail for the topic, if available
	 *
	 * @return 	Component|null
	 */
	getThumbnail() {
		const suitableImage = getSuitableImage(this.props.data.contentImages);

		if (suitableImage) {
			return <Image source={{ url: getImageUrl(suitableImage) }} resizeMode="cover" style={this.props.rowStyles.thumbnailImage} />;
		}

		return null;
	}

	render() {
		const { styles } = this.props;
		const hidden = this.props.data.hiddenStatus !== null;

		return (
			<View style={[this.props.rowStyles.topicRowInner]}>
				<View style={this.props.rowStyles.topicInfo}>
					{this.props.showCategory && <CategoryName name={this.props.data.forum.name} showColor color={this.props.data.forum.featureColor} />}
					<View style={this.props.rowStyles.topicTitle}>
						{Boolean(this.props.data.isLocked) && <LockedIcon style={this.props.rowStyles.lockedIcon} />}
						<Text style={[this.props.rowStyles.topicTitleText, styles.itemTitle, hidden ? styles.moderatedTitle : null]} numberOfLines={2}>
							<UnreadIndicator show={this.props.data.unread} />
							{this.props.data.title}
						</Text>
					</View>
					<Text style={[this.props.rowStyles.topicSnippet, styles.text, hidden ? styles.moderatedText : null]} numberOfLines={1}>
						{this.props.data.snippet}
					</Text>
				</View>
			</View>
		);
	}
}

export default withTheme()(TopicInfo);
