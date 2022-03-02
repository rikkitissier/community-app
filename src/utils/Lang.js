import moment from "moment";
import _ from "underscore";
import { Platform } from "react-native";
import supportedLocales from "../locales";
import langStrings from "../langStrings";

class Lang {
	constructor() {
		this.words = {};
		this.locale = "en-US";

		// Set up mustache-style templates for language interpolation in underscore
		_.templateSettings = {
			interpolate: /\{\{(.+?)\}\}/g
		};
	}

	setLocale(locale) {
		if (/^[a-z]{2}\-[A-Z]{2}$/.test(locale)) {
			locale = "en-US";
		}

		this.locale = locale;
	}

	/**
	 * Populate the Lang class with our phrases
	 *
	 * @param 	object 	langPack 	Object of key:phrases
	 * @return 	void
	 */
	setWords(langPack) {
		this.words = Object.assign({}, this.words, langPack);
	}

	/**
	 * Return a phrase
	 * Note: if the phrase doesn't exist, the key is returned, to prevent unnecessary errors
	 *
	 * @param 	string 		key 	Key of phrase to get
	 * @return 	string
	 */
	get(key, replacements = {}) {
		// If we don't have any language strings for this key, return the key
		// If we're in_dev return the params to assist with debugging
		if (_.isUndefined(this.words[key]) && _.isUndefined(langStrings[key])) {
			if (__DEV__) {
				return (
					key +
					Object.values(replacements)
						.map(val => `(${val})`)
						.join(" ")
				);
			} else {
				return key;
			}
		}

		const word = _.isUndefined(this.words[key]) || this.words[key] === `app_${key}` ? langStrings[key] : this.words[key];

		// Check for templates; parse if necessary
		if (word.indexOf("{{") === -1) {
			return word;
		}

		try {
			// This can fail if the {{tags}} added to the strings by admins are incorrect
			return _.template(word)(replacements);
		} catch (err) {
			return word;
		}
	}

	/**
	 * Pluralize the given phrase
	 *
	 * @param 	string 		word 	Phrase to parse
	 * @param 	array 		params 	Values to swap into the phrase
	 * @return 	string
	 */
	pluralize(word, params) {
		// Get the pluralization tags from it
		var i = 0;

		if (!_.isArray(params)) {
			params = [params];
		}

		// If there's no pluralization brackets in this word, then manually append a pattern
		// As well as being a fallback, this will help in tests
		if (word.indexOf("{") === -1) {
			word = word + params.map((val, idx) => `{!# [?:(${val})]}`).join(" ");
		}

		word = word.replace(/\{(!|\d+?)?#(.*?)\}/g, function(a, b, c, d) {
			// {# [1:count][?:counts]}
			if (!b || b == "!") {
				b = i;
				i++;
			}

			var value;
			var fallback;
			var output = "";
			var replacement = params[b] + "";

			c.replace(/\[(.+?):(.+?)\]/g, function(w, x, y, z) {
				var xLen = x.length * -1;

				if (x == "?") {
					fallback = y.replace("#", replacement);
				} else if (x.charAt(0) == "%" && x.substring(1) == replacement.substring(0, x.substring(1).length)) {
					value = y.replace("#", replacement);
				} else if (x.charAt(0) == "*" && x.substring(1) == replacement.substr(-x.substring(1).length)) {
					value = y.replace("#", replacement);
				} else if (x == replacement) {
					value = y.replace("#", replacement);
				}
			});

			output = a
				.replace(/^\{/, "")
				.replace(/\}$/, "")
				.replace("!#", "");
			output = output.replace(b + "#", replacement).replace("#", replacement);
			output = output.replace(/\[.+\]/, value == null ? fallback : value).trim();

			return output;
		});

		return word;
	}

	/**
	 * When provided with a search result object, this method will return the action string
	 * e.g. 'Dave replied to a topic' or 'Susan posted a gallery image'.
	 *
	 * @param 	boolean 		isComment 				Is this content a comment?
	 * @param 	boolean 		isReview 				Is this content a review?
	 * @param 	boolean			firstCommentRequired	Does the content container require a first comment (e.g. like a forum)
	 * @param 	string 			user					Username to sprintf
	 * @param 	object 			articleLang				Object containing words for indef article, def article etc.
	 * @return 	string
	 */
	buildActionString(isComment = false, isReview = false, firstCommentRequired = false, user, articleLang) {
		// Check we have the required data
		if (_.isUndefined(articleLang)) {
			return this.get("activity_generic");
		}

		try {
			let langKey;

			if (isReview) {
				langKey = "activity_reviewed";
			} else if (isComment) {
				if (firstCommentRequired) {
					langKey = "activity_replied";
				} else {
					langKey = "activity_commented";
				}
			} else {
				langKey = "activity_posted_item";
			}

			return this.get(langKey, { user, article: articleLang.indefinite });
		} catch (err) {
			return this.get("activity_generic");
		}
	}

	static second = 1e3;
	static minute = 6e4;
	static hour = 36e5;
	static day = 864e5;
	static week = 6048e5;
	static month = 2592e6;
	static year = 31536e6;

	formatTime(time, format = "long", showSuffix = true) {
		if (!_.isNumber(time) || _.isNaN(time)) {
			if (!_.isString(time) || time.length !== 10) {
				throw new Error("Invalid timestamp passed to Lang.formatTime");
			}
		}

		const timeObj = moment.unix(parseInt(time));
		let diff = moment().diff(timeObj);
		let unit;
		let num;
		let future = false;

		if (diff < 0) {
			future = true;
			diff = diff * -1;
		}

		if (diff < Lang.second) {
			unit = "seconds";
			num = 1;
		} else if (diff < Lang.minute) {
			unit = "seconds";
		} else if (diff < Lang.hour) {
			unit = "minutes";
		} else if (diff < Lang.day) {
			unit = "hours";
		} else if (diff < Lang.week) {
			unit = "days";
		} else if (diff < Lang.month) {
			unit = "weeks";
		} else if (diff < Lang.year) {
			unit = "months";
		} else {
			unit = "years";
		}

		num = Math.max(1, moment.duration(diff)[unit]());

		if (format === "short") {
			return this.pluralize(this.get(`${unit}_short`), num);
		} else if (format === "long") {
			const val = this.pluralize(this.get(unit), num);

			if (showSuffix) {
				if (future) {
					return this.get("time_future", { val });
				} else {
					return this.get("time_past", { val });
				}
			} else {
				return pluralizedString;
			}
		}
	}

	formatNumber(num) {
		if (Platform.OS === "android") {
			let localeToUse = this.locale; // default

			if (!_.isUndefined(supportedLocales[this.locale])) {
				localeToUse = this.locale;
			} else if (!_.isUndefined(supportedLocales[this.locale.substring(0, 2)])) {
				localeToUse = this.locale.substring(0, 2);
			}

			return new Intl.NumberFormat(localeToUse).format(num);
		}

		return parseFloat(num).toLocaleString(this.locale);
	}
}

const langClass = new Lang();
export default langClass;
