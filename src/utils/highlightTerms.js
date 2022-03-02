import React, { Component } from "react";
import { Text, View, FlatList, TouchableHighlight, StyleSheet } from "react-native";

/**
 * Fairly naîve search highlight parsing.
 * Builds a collection of <Text> components, with matching search terms highlighted. E.g.
 * searching for "test" in "Mattis Parturient Mollis Test Consectetur" should return:
 * <Text>Mattis Parturient Mollis</Text><Text>Test</Text><Text>Consectetur</Text>
 * (though in practice we add styles and spacers)
 *
 * @param 	string 		content 	String containing the content to parse
 * @param 	string 		term 		Search string. Will be split by a space to get individual terms.
 * @return 	array
 */
export default function highlightTerms(content, term, highlightStyle) {
	if (!term || !content) {
		return content;
	}

	const words = content.replace(/[\n\t\r]/g, "").split(" ");
	const terms = term.split(" ").map(term => term.toLowerCase());
	const finalContent = [];
	let currentText = [];
	let counter = 0;

	words.forEach(word => {
		if (terms.indexOf(word.toLowerCase().trim()) !== -1) {
			// If one of our terms is found, put previous text in a <Text>, our term in another <Text>
			if (currentText.length) {
				finalContent.push(<Text key={counter++}>{currentText.join(" ")}</Text>);
				finalContent.push(<Text key={counter++}>&nbsp;</Text>);
				currentText = [];
			}

			finalContent.push(
				<Text key={counter++} style={highlightStyle}>
					{" "}
					{word}{" "}
				</Text>
			);
			finalContent.push(<Text key={counter++}>&nbsp;</Text>);
		} else {
			// Just continue...
			currentText.push(word);
		}
	});

	// If we have any words left, add those
	if (currentText.length) {
		finalContent.push(<Text key={counter++}>{currentText.join(" ")}</Text>);
	}

	return finalContent;
}
