import React, { memo } from "react";

import HeaderButton from "./HeaderButton";
import icons from "../icons";
import { switchAppView } from "../redux/actions/app";
import configureStore from "../redux/configureStore";

const store = configureStore();

const GoToMulti = props => {
	if (!Expo.Constants.manifest.extra.multi) {
		return null;
	}

	return <HeaderButton icon={icons.BARS} position="left" onPress={() => store.dispatch(switchAppView({ view: "multi" }))} size={20} />;
};

export default memo(GoToMulti);
