import React, { PureComponent } from "react";
import { Text, View, StyleSheet } from "react-native";
import { compose } from "react-apollo";
import { withNavigation } from "react-navigation";
import PropTypes from "prop-types";

import UserPhoto from "../../atoms/UserPhoto";
import ContentRow from "../../ecosystems/ContentRow";
import { PlaceholderElement, PlaceholderContainer } from "../../ecosystems/Placeholder";
import { withTheme } from "../../themes";

class MemberRow extends PureComponent {
	constructor(props) {
		super(props);
		this.onPress = this.onPress.bind(this);
	}

	onPress() {
		if (this.props.preOnPressCallback) {
			this.props.preOnPressCallback();
		}

		this.props.navigation.navigate({
			routeName: "Profile",
			params: {
				id: this.props.id,
				name: this.props.name,
				photo: this.props.photo
			},
			key: this.props.id
		});
	}

	render() {
		const { componentStyles, styleVars, styles } = this.props;

		if (this.props.loading) {
			return (
				<ContentRow>
					<PlaceholderContainer height={60} style={componentStyles.loadingRow}>
						<PlaceholderElement circle radius={36} top={11} left={styleVars.spacing.standard} />
						<PlaceholderElement width={200} height={15} top={13} left={60} />
						<PlaceholderElement width={120} height={12} top={32} left={60} />
					</PlaceholderContainer>
				</ContentRow>
			);
		}

		return (
			<ContentRow style={componentStyles.row} onPress={this.onPress} showArrow>
				<UserPhoto url={this.props.photo} size={36} />
				<View style={componentStyles.container}>
					<Text style={styles.itemTitle}>{this.props.name}</Text>
					<Text style={[styles.lightText, styles.standardText]}>{this.props.groupName}</Text>
				</View>
			</ContentRow>
		);
	}
}

const _componentStyles = styleVars => ({
	row: {
		display: "flex",
		flexDirection: "row",
		paddingVertical: styleVars.spacing.standard,
		paddingHorizontal: styleVars.spacing.wide
	},
	container: {
		marginLeft: styleVars.spacing.standard
	}
});

export default compose(
	withNavigation,
	withTheme(_componentStyles)
)(MemberRow);

MemberRow.defaultProps = {
	loading: false
};

MemberRow.propTypes = {
	id: PropTypes.number,
	name: PropTypes.string,
	photo: PropTypes.string,
	groupName: PropTypes.string,
	loading: PropTypes.bool
};
