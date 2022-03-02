import _ from "underscore";

export default function getSuitableImage(data) {
	let imageToUse = false;

	if (!_.isArray(data)) {
		return imageToUse;
	}

	for (let i = 0; i < data.length; i++) {
		// We need either https, or protocol-relative (which getImageUrl will transform to https later)
		if (data[i].startsWith("https") || data[i].startsWith("//")) {
			imageToUse = data[i];
			break;
		}
	}
	return imageToUse;
}
