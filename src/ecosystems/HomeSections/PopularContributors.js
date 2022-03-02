import React, { Component } from "react";
import { Text, Image, View, FlatList, StyleSheet, TouchableHighlight } from "react-native";
import _ from "underscore";

import UserPhoto from "../../atoms/UserPhoto";
import LargeTitle from "../../atoms/LargeTitle";
import ContentRow from "../../ecosystems/ContentRow";
import { PlaceholderRepeater, PlaceholderContainer, PlaceholderElement } from "../../ecosystems/Placeholder";
import Lang from "../../utils/Lang";
import icons from "../../icons";
import { withTheme } from "../../themes";

class PopularContributors extends Component {
	constructor(props) {
		super(props);
		this._pressHandlers = {};
	}

	getOnPressHandler(user) {
		if (_.isUndefined(this._pressHandlers[user.id])) {
			this._pressHandlers[user.id] = () => {
				this.props.navigation.navigate("Profile", {
					id: user.id
				});
			};
		}

		return this._pressHandlers[user.id];
	}

	/**
	 * Build and return the row for given data
	 *
	 * @param 	object 		data 		The row data
	 * @return 	Component
	 */
	getRow(data, idx) {
		const { styles, componentStyles } = this.props;

		return (
			<ContentRow
				style={[styles.flexRow, styles.flexAlignCenter, styles.phWide, styles.pvTight]}
				key={data.user.id}
				onPress={this.getOnPressHandler(data.user)}
			>
				<Text style={[styles.contentText, styles.lightText, styles.mediumText, componentStyles.number]}>{idx + 1}</Text>
				<UserPhoto url={data.user.photo} size={36} style={componentStyles.userPhoto} />
				<View style={[styles.flexGrow, styles.flexBasisZero, componentStyles.data, styles.mlStandard]}>
					<Text style={styles.smallItemTitle} numberOfLines={1}>
						{data.user.name}
					</Text>
					<Text style={[styles.lightText, styles.standardText]} numberOfLines={1}>
						{data.user.group.name}
					</Text>
				</View>
				<View style={[styles.mlWide, componentStyles.repWrapper]}>
					<View
						style={[
							styles.flex,
							styles.flexAlignCenter,
							styles.flexJustifyCenter,
							styles.phTight,
							componentStyles.rep,
							parseInt(data.rep) > 0 ? componentStyles.positiveRep : componentStyles.negativeRep
						]}
					>
						<Text style={[styles.centerText, styles.smallText, styles.mediumText, parseInt(data.rep) > 0 ? styles.positiveText : styles.negativeText]}>
							<Image
								source={parseInt(data.rep) > 0 ? icons.CARET_UP_SOLID : icons.CARET_DOWN_SOLID}
								resizeMode="contain"
								style={[componentStyles.repIcon, parseInt(data.rep) > 0 ? componentStyles.repIconUp : componentStyles.repIconDown]}
							/>{" "}
							{data.rep} {Lang.get("rep")}
						</Text>
					</View>
				</View>
			</ContentRow>
		);
	}

	render() {
		const { styles, componentStyles } = this.props;

		if (this.props.loading) {
			return (
				<View style={[styles.row, styles.pvTight, styles.mbWide, componentStyles.wrapper]}>
					<PlaceholderRepeater repeat={5}>
						<PlaceholderContainer>
							<PlaceholderElement top={15} left={12} width={12} height={20} />
							<PlaceholderElement circle radius={36} top={8} left={30} />
							<PlaceholderElement top={10} left={78} width={130} height={15} />
							<PlaceholderElement top={28} left={78} width={80} height={12} />
							<PlaceholderElement top={15} right={12} width={40} height={20} />
						</PlaceholderContainer>
					</PlaceholderRepeater>
				</View>
			);
		}

		return (
			<View style={[styles.row, styles.pvTight, styles.mbWide, componentStyles.wrapper]}>
				{this.props.data.popularContributors.length ? (
					this.props.data.popularContributors.map((row, idx) => this.getRow(row, idx))
				) : (
					<View style={[styles.phWide, styles.pvVeryTight]}>
						<Text style={[styles.lightText]}>{Lang.get("no_rep_this_week")}</Text>
					</View>
				)}
			</View>
		);
	}
}

const _componentStyles = styleVars => ({
	number: {
		width: 20
	},
	repWrapper: {
		height: styleVars.spacing.extraWide
	},
	rep: {
		borderRadius: 20
	},
	positiveRep: {
		backgroundColor: "#EFFCF0"
	},
	negativeRep: {
		backgroundColor: "#FCF2F1"
	},
	repIcon: {
		width: 12,
		height: 12
	},
	repIconUp: {
		tintColor: styleVars.positive,
		marginTop: -1
	},
	repIconDown: {
		tintColor: styleVars.negative
	}
});

export default withTheme(_componentStyles)(PopularContributors);
