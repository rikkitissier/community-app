require("intl");

const supportedLocales = {
	"en-AU": require("intl/locale-data/jsonp/en-AU.js"),
	"en-CA": require("intl/locale-data/jsonp/en-CA.js"),
	"en-GB": require("intl/locale-data/jsonp/en-GB.js"),
	"en-NZ": require("intl/locale-data/jsonp/en-NZ.js"),
	"en-US": require("intl/locale-data/jsonp/en-US.js"),
	en: require("intl/locale-data/jsonp/en.js"),
	fr: require("intl/locale-data/jsonp/fr.js"),
	ru: require("intl/locale-data/jsonp/ru.js"),
	ar: require("intl/locale-data/jsonp/ar.js"),
	de: require("intl/locale-data/jsonp/de.js"),
	pl: require("intl/locale-data/jsonp/pl.js"),
	pt: require("intl/locale-data/jsonp/pt.js")
};

export default supportedLocales;
