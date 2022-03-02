import React, { memo } from "react";
import { Text } from "react-native";
import _ from "underscore";

import Lang from "../utils/Lang";

// Simple component wrapper around Lang.formatTime, but allows us to memoize
// the time creation
const Time = ({ timestamp, format = "short", showSuffix = true, ...props }) => {
	return <Text {...props}>{Lang.formatTime(timestamp, format, showSuffix)}</Text>;
};

export default memo(Time);
