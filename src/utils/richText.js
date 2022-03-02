const mentionRegex = /(<span contenteditable="false">(.+?)<\/span>)/gi;

export function processToSend(content) {
	// Mentions inserted by Quill have a special span around the inner text
	// to disable contenteditable. We need to remove that or IPS4 will strip
	// the whole mention
	content = content.replace(mentionRegex, (match, p1, p2) => {
		return p2.trim();
	});

	// Remove invisible chars that quill adds
	content = content.replace(/\uFEFF/g, "");

	// Quill adds a <p><br></p> when enter is pressed, resulting in double line
	// spacing on the web. If we have two <p><br></p> next to each other, replace
	// it with a single line-space like we do on the web, but if it's just one
	// we can remove it because normal <p> styling takes care of the spacing
	// If we have two paragraphs right next to each other, then turn that into a
	// single linespace (same as pressing shift-enter on web)
	content = content.replace(/<p><br><\/p>/g, "~~//br//~~");
	content = content.replace(/<\/p><p>/g, "<br>");
	content = content.replace(/~~\/\/br\/\/~~/g, "<p><br></p>");
	content = content.replace(/<p><br><\/p><p><br><\/p>/g, "<p>&nbsp;</p>");
	content = content.replace(/<p><br><\/p>/g, "");

	return content;
}

export function stripWhitespace(text) {
	return text.replace(/\r?\n|\r|\t|\s{2,}/g, " ");
}
