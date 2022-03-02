import React, { memo } from "react";
import { Text, TouchableOpacity } from "react-native";
import _ from "underscore";

import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";

const AddressField = props => {
	const { styles } = props;
	const { city, region, postalCode, country } = props.value;

	if (_.isUndefined(props.value.addressLines) || !props.value.addressLines.length) {
		const hasOtherValue = ["city", "region", "postalCode", "country"].find(item => !_.isUndefined(props.value[item]) && props.value[item].trim() !== "");
		if (!hasOtherValue) {
			return <Text style={[props.textStyles, styles.lightText]}>{Lang.get("no_address")}</Text>;
		}
	}

	return (
		<React.Fragment>
			{(props.value.addressLines || []).map(line => (
				<Text style={props.textStyles}>{line}</Text>
			))}
			{["city", "region", "postalCode", "country"].map(piece => {
				if (!_.isUndefined(props.value[piece]) && !_.isEmpty(props.value[piece])) {
					return <Text style={props.textStyles}>{props.value[piece]}</Text>;
				}
				return null;
			})}
		</React.Fragment>
	);
};

export default withTheme()(memo(AddressField));
