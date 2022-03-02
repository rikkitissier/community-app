import React from "react";
import { Text } from "react-native";

import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";

const UnsupportedField = ({ styles, ...props }) => <Text style={[props.textStyles, styles.lightText]}>{Lang.get("not_available")}</Text>;

export default withTheme()(UnsupportedField);
