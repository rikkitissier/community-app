import React from "react";
import { Text, View, TouchableOpacity } from "react-native";

import NavigationService from "../../utils/NavigationService";
import UserPhoto from "../../atoms/UserPhoto";
import { withTheme } from "../../themes";

const MemberField = ({ styles, ...props }) => (
	<React.Fragment>
		{Boolean(props.value.length) ? (
			props.value.map(member => (
				<TouchableOpacity
					style={[styles.flexRow, styles.flexAlignCenter, styles.mvTight]}
					onPress={() => NavigationService.navigateToScreen("Profile", { id: member.id })}
				>
					<UserPhoto url={member.photo} size={34} style={styles.mrTight} />
					<View>
						<Text style={props.textStyles}>{member.name}</Text>
						<Text style={[props.textStyles, styles.standardText, styles.lightText]}>{member.groupName}</Text>
					</View>
				</TouchableOpacity>
			))
		) : (
			<Text style={[props.textStyles, styles.lightText]}>{Lang.get("no_member")}</Text>
		)}
	</React.Fragment>
);

export default withTheme()(MemberField);
