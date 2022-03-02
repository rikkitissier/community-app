import { StyleSheet } from "react-native";
import _ from "underscore";

import baseStyleVars from "./baseStyleVars";
import baseStyleSheet from "./baseStyleSheet";
import withTheme from "./withTheme";

const deepmerge = require("deepmerge");
const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray;

let currentStyleVars = {};
let currentStyleSheet = {};

const buildStyleVars = (theme = null, darkMode = false) => {
	let themeStyleVars = {};
	let mode = darkMode ? "darkMode" : "lightMode";

	if (theme !== null) {
		// Ensure we have base vars available if light or dark mode is specified
		if (!_.isUndefined(theme[mode]) && _.isUndefined(theme.base)) {
			throw new Error("Cannot define light mode or dark mode without base styleVars");
		}

		if (!_.isUndefined(theme[mode]) && (!_.isFunction(theme[mode]) || !_.isFunction(theme.base))) {
			throw new Error(`The ${mode} and base properties of the theme must be functions that return an object`);
		} else if (_.isUndefined(theme[mode]) && !_.isFunction(theme)) {
			throw new Error(`theme must be a function that returns an object`);
		}

		if (!_.isUndefined(theme[mode])) {
			themeStyleVars = deepmerge(theme.base(), theme[mode](), { arrayMerge: overwriteMerge });
		} else {
			themeStyleVars = theme();
		}
	}

	// Merge the default style variables
	currentStyleVars = deepmerge.all([baseStyleVars.base(), baseStyleVars[mode](), themeStyleVars], {
		arrayMerge: overwriteMerge
	});

	return currentStyleVars;
};

const generateStyleSheet = (theme = baseStyleVars, darkMode = false) => {
	const styleVars = buildStyleVars(theme, darkMode);
	const generatedStyleObject = baseStyleSheet(styleVars, darkMode);
	currentStyleSheet = StyleSheet.create(generatedStyleObject);
	return currentStyleSheet;
};

const getCurrentStyleVars = () => currentStyleVars;
const getCurrentStyleSheet = () => currentStyleSheet;

export { generateStyleSheet, buildStyleVars, currentStyleVars, currentStyleSheet, withTheme, getCurrentStyleVars, getCurrentStyleSheet };
