import React, { PureComponent } from "react";

import NavigationService from "../../utils/NavigationService";
import ContentRow from "../../ecosystems/ContentRow";
import { PlaceholderContainer, PlaceholderElement } from "../../ecosystems/Placeholder";
import SearchResultItem from "./SearchResultItem";
import SearchResultComment from "./SearchResultComment";
import { withTheme } from "../../themes";

class SearchResult extends PureComponent {
	constructor(props) {
		super(props);
		this.onPressHandler = this.onPressHandler.bind(this);
	}

	onPressHandler() {
		NavigationService.navigate(this.props.data.url, {
			id: this.props.data.itemID,
			findComment: this.props.data.isComment ? this.props.data.objectID : null
		});
	}

	render() {
		const { styles, styleVars } = this.props;

		if (this.props.loading) {
			return (
				<ContentRow style={styles.pvWide}>
					<PlaceholderContainer height={115}>
						<PlaceholderElement circle radius={22} left={styleVars.spacing.wide} top={0} />
						<PlaceholderElement width={40} height={15} top={3} right={styleVars.spacing.wide} />
						<PlaceholderElement width={100} height={15} top={3} left={50} />
						<PlaceholderElement width="80%" height={15} top={35} left={styleVars.spacing.wide} />
						<PlaceholderElement width="70%" height={12} top={56} left={styleVars.spacing.wide} />
						<PlaceholderElement width="70%" height={12} top={72} left={styleVars.spacing.wide} />
						<PlaceholderElement width={60} height={12} bottom={0} left={styleVars.spacing.wide} />
						<PlaceholderElement width={160} height={12} bottom={0} left={styleVars.spacing.wide + 70} />
					</PlaceholderContainer>
				</ContentRow>
			);
		}

		const ResultComponent = this.props.data.isComment || this.props.data.isReview ? SearchResultComment : SearchResultItem;
		const hidden = this.props.data.hiddenStatus !== null;

		return (
			<ContentRow style={styles.pvWide} onPress={this.onPressHandler} hidden={hidden}>
				<ResultComponent data={this.props.data} term={this.props.term} />
			</ContentRow>
		);
	}
}

export default withTheme()(SearchResult);
