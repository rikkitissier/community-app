import React, { Component } from "react";
import { Text, View, FlatList, LayoutAnimation } from "react-native";
import _ from "underscore";

import CheckListRow from "../../atoms/CheckListRow";
import { withTheme } from "../../themes";

const CheckList = props => {
	const { styles } = props;
	const handlers = {};
	const getHandler = (item, onPress) => {
		if (_.isUndefined(handlers[item.key])) {
			handlers[item.key] = () => {
				LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
				onPress(item);
			};
		}

		return handlers[item.key];
	};

	return (
		<View style={styles.rowsWrap}>
			<FlatList
				style={[{ flex: -1, flexGrow: 0 }, styles.listBackground, props.style]}
				data={props.data}
				scrollEnabled={false}
				ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
				renderItem={({ item }) => <CheckListRow {...item} onPress={!props.disabled ? getHandler(item, props.onPress) : null} />}
			/>
		</View>
	);
};

export default withTheme()(CheckList);
