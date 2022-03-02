import React, { memo } from "react";
import { Text } from "react-native";

import { withTheme } from "../themes";

const SectionHeader = ({ componentStyles, ...props }) => <Text style={componentStyles.sectionHeader}>{props.title.toUpperCase()}</Text>;

const _componentStyles = styleVars => ({
	sectionHeader: {
		fontSize: 13,
		color: styleVars.backgroundLightText,
		backgroundColor: styleVars.appBackground,
		paddingHorizontal: styleVars.spacing.wide,
		paddingVertical: styleVars.spacing.standard
	}
});

export default withTheme(_componentStyles)(memo(SectionHeader));
