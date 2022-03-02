import React, { PureComponent } from "react";
import { Image, View, TouchableHighlight } from "react-native";
import FadeIn from "react-native-fade-in-image";
import { withNavigation } from "react-navigation";
import { compose } from "react-apollo";

import NavigationService from "../../utils/NavigationService";
import Lang from "../../utils/Lang";
import { PlaceholderElement, PlaceholderContainer } from "../../ecosystems/Placeholder";
import StreamItem from "./StreamItem";
import StreamComment from "./StreamComment";
import ShadowedArea from "../../atoms/ShadowedArea";
import getImageUrl from "../../utils/getImageUrl";
import getSuitableImage from "../../utils/getSuitableImage";
import _componentStyles from "./styles";
import { withTheme } from "../../themes";

class StreamCard extends PureComponent {
	constructor(props) {
		super(props);
		this.onPress = this.onPress.bind(this);
	}

	/**
	 * Build the placeholder representation of a stream card
	 *
	 * @return 	Component
	 */
	loadingComponent() {
		const { styles, styleVars } = this.props;

		return (
			<ShadowedArea style={[styles.post, styles.postWrapper]}>
				<PlaceholderContainer height={140} style={{ padding: styleVars.spacing.standard }}>
					<PlaceholderContainer height={40} style={{ marginBottom: styleVars.spacing.standard }}>
						<PlaceholderElement circle radius={40} left={0} top={0} />
						<PlaceholderElement width={160} height={15} top={0} left={50} />
						<PlaceholderElement width={70} height={14} top={23} left={50} />
					</PlaceholderContainer>
					<PlaceholderContainer height={100} style={styles.postContentContainer}>
						<PlaceholderElement width="100%" height={12} />
						<PlaceholderElement width="70%" height={12} top={20} />
						<PlaceholderElement width="82%" height={12} top={40} />
						<PlaceholderElement width="97%" height={12} top={60} />
					</PlaceholderContainer>
				</PlaceholderContainer>
			</ShadowedArea>
		);
	}

	/**
	 * Return an image for the stream item, if one is available
	 *
	 * @return 	Component|null
	 */
	getContentImage() {
		const { componentStyles, styleVars } = this.props;

		// No images in this content
		if (!this.props.data.contentImages || !this.props.data.contentImages.length) {
			return null;
		}

		// Fetch an image to show
		const imageToUse = getSuitableImage(this.props.data.contentImages);
		if (!imageToUse) {
			return null;
		}

		return (
			<FadeIn style={componentStyles.imageContainer} placeholderStyle={{ backgroundColor: styleVars.placeholderColors.from }}>
				<Image style={componentStyles.image} source={{ uri: getImageUrl(imageToUse) }} resizeMode="cover" />
			</FadeIn>
		);
	}

	/**
	 * onPress handler for this stream item. Redirects to appropriate screen if supported,
	 * or webview screen if not.
	 *
	 * @todo support reviews
	 * @return 	void
	 */
	onPress() {
		NavigationService.navigate(this.props.data.url, {
			id: this.props.data.itemID,
			...(this.props.data.isComment ? { findComment: this.props.data.objectID } : {})
		});
	}

	render() {
		const { componentStyles } = this.props;
		if (this.props.loading) {
			return this.loadingComponent();
		}

		const Component = !this.props.data.isComment && !this.props.data.isReview ? StreamItem : StreamComment;
		const hidden = this.props.data.hiddenStatus !== null;

		return (
			<TouchableHighlight style={componentStyles.postWrapper} onPress={this.onPress}>
				<ShadowedArea style={componentStyles.post} hidden={hidden}>
					<View style={componentStyles.blob} />
					<Component
						data={this.props.data}
						image={this.getContentImage()}
						metaString={Lang.buildActionString(
							this.props.data.isComment,
							this.props.data.isReview,
							this.props.data.firstCommentRequired,
							this.props.data.author.name,
							this.props.data.articleLang
						)}
					/>
				</ShadowedArea>
			</TouchableHighlight>
		);
	}
}

export default compose(
	withNavigation,
	withTheme(_componentStyles)
)(StreamCard);
