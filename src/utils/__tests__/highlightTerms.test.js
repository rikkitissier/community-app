import React from "react";
import { View, StyleSheet } from "react-native";
import { shallow } from "enzyme";
import _ from "underscore";

import highlightTerms from "../highlightTerms";

const CONTENT = "Cras mattis consectetur purus sit amet fermentum. Cum sociis natoque mattis penatibus et magnis dis parturient montes, nascetur ridiculus mus.";
const HIGHLIGHT_STYLE = { backgroundColor: "red" };

const removeFalsy = (val) => !!val.trim();

describe("highlightTerms utility", () => {
	it("returns correct structure for single VALID search term", () => {	
		const wrapper = shallow(<View>{highlightTerms(CONTENT, "purus", HIGHLIGHT_STYLE)}</View>);
		expect(wrapper).toMatchSnapshot();

		// There should be five text nodes
		expect( wrapper.find("View > Text").length ).toBe(5);
		// The third should be our search term
		expect( _.filter( wrapper.find("View > Text").at(2).prop('children'), removeFalsy )[0] ).toBe("purus");
	});

	it("returns correct structure for multiple VALID search term", () => {	
		const wrapper = shallow(<View>{highlightTerms(CONTENT, "mattis", HIGHLIGHT_STYLE)}</View>);
		expect(wrapper).toMatchSnapshot();

		// There should be nine text nodes
		expect( wrapper.find("View > Text").length ).toBe(9);
	});

	it("returns correct structure for INVALID search term", () => {	
		const wrapper = shallow(<View>{highlightTerms(CONTENT, "invalidterm", HIGHLIGHT_STYLE)}</View>);
		expect(wrapper).toMatchSnapshot();

		// There should be one text node
		expect( wrapper.find("View > Text").length ).toBe(1);
	});
});