import _ from "underscore";

export default function getImageUrl(url) {
	if (_.isString(url) && url.indexOf("//") === 0) {
		return `https:${url}`;
	}

	return url;
}
