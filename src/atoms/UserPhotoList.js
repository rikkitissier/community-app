import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import _ from "underscore";

import UserPhoto from "./UserPhoto";
import styles, { styleVars } from "../styles";

const UserPhotoList = props => {
	return (
		<View style={[componentStyles.wrapper, styles.flexRow, styles.plExtraWide, props.style]}>
			{props.data.map(user => (
				<UserPhoto url={user.url} size={props.size} online={user.online} style={componentStyles.photo} key={user.id} />
			))}
		</View>
	);
};

export default memo(UserPhotoList);

const componentStyles = StyleSheet.create({
	wrapper: {},
	photo: {
		marginLeft: styleVars.spacing.wide * -1
	}
});
