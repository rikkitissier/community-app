import React, { memo } from "react";
import { Text } from "react-native";
import moment from "moment";

import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";

const DateField = ({ styles, ...props }) => {
	if (props.value.length !== 10) {
		return <Text style={[props.textStyles, styles.lightText]}>{Lang.get("no_date")}</Text>;
	}

	const date = moment
		.unix(parseInt(props.value))
		.utc()
		.format("L");
	return <Text style={props.textStyles}>{date}</Text>;
};

export default withTheme()(memo(DateField));
