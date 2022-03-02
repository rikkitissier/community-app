import { Platform } from "react-native";

import baseStyleVars from "./baseStyleVars";

const greyScale = val => {
	const scale = {
		100: "#ffffff",
		200: "#fcfcfc",
		300: "#f7f7f7",
		400: "#f0f0f0",
		500: "#e0e0e0",
		600: "#969696",
		700: "#696969",
		800: "#3b3b3b",
		900: "#2b2b2b",
		1000: "#0a0a0a"
	};

	return scale[val] || scale[100];
};

const accentColorLight = "#C53030";
const accentColorDark = "#E53E3E";

const themeRed = {
	base: () => {
		const _baseStyleVars = baseStyleVars.base(greyScale, accentColorLight);
		const theme = {
			..._baseStyleVars,
			primaryBrand: [accentColorLight, accentColorLight],
			toggle: {
				..._baseStyleVars.toggle,
				true: "#258bd2"
			},
			greys: {
				..._baseStyleVars.greys,
				placeholder: "#878787"
			}
		};

		return theme;
	},
	lightMode: () => ({}),
	darkMode: () => {
		const _baseStyleVars = baseStyleVars.darkMode(greyScale, accentColorDark);
		const theme = {
			..._baseStyleVars,
			primaryBrand: ["#9B2C2C", "#9B2C2C"],
			toggle: {
				..._baseStyleVars.toggle,
				true: "#258bd2"
			},
			greys: {
				..._baseStyleVars.greys,
				placeholder: "#878787"
			}
		};

		return theme;
	}
};

export default themeRed;
