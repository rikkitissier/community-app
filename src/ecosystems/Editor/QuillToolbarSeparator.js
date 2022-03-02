import React, { memo } from "react";
import { View, StyleSheet } from "react-native";

import { withTheme } from "../../themes";

const QuillToolbarSeparator = ({ componentStyles, ...props }) => <View style={componentStyles.sep} />;

const _componentStyles = styleVars => ({
	sep: {
		width: 6,
		height: 24,
		borderRightWidth: 1,
		borderRightColor: styleVars.accessoryToolbar.border
	}
});

export default withTheme(_componentStyles)(QuillToolbarSeparator);
