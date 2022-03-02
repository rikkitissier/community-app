import React, { Component } from "react";
import { View } from "react-native";

import AddressField from "./AddressField";
import ColorField from "./ColorField";
import MemberField from "./MemberField";
import UrlField from "./UrlField";
import EmailField from "./EmailField";
import RatingField from "./RatingField";
import TextField from "./TextField";
import ListField from "./ListField";
import BooleanField from "./BooleanField";
import DateField from "./DateField";
import UnsupportedField from "./UnsupportedField";
import { withTheme } from "../../themes";

const getComponentType = type => {
	switch (type) {
		case "Address":
			return AddressField;
		case "Color":
			return ColorField;
		case "Member":
			return MemberField;
		case "Date":
			return DateField;
		case "Upload":
		case "Url":
			return UrlField;
		case "Email":
			return EmailField;
		case "Rating":
			return RatingField;
		case "Text":
		case "TextArea":
			return TextField;
		case "Select":
		case "CheckboxSet":
			return ListField;
		case "Checkbox":
		case "YesNo":
			return BooleanField;
		case "Poll":
		case "Ftp":
			return UnsupportedField;

		default:
			return TextField;
	}
};

const CustomField = ({ styles, ...props }) => {
	const ComponentToRender = getComponentType(props.type);

	return (
		<View>
			<ComponentToRender actualType={props.type} value={props.value} textStyles={[styles.contentText, styles.text, props.textStyles]} />
		</View>
	);
};

export default withTheme()(CustomField);
