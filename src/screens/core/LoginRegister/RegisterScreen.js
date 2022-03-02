import React, { Component, Fragment } from "react";
import { Text, Image, View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, AsyncStorage } from "react-native";
import { withApollo, compose } from "react-apollo";
import { LinearGradient } from "expo-linear-gradient";
import { connect } from "react-redux";
import _ from "underscore";

import { receiveAuth, logIn } from "../../../redux/actions/auth";
import Button from "../../../atoms/Button";
import LoginButton from "../../../atoms/LoginButton";
import ToFormData from "../../../utils/ToFormData";
import styles, { styleVars } from "../../../styles";

export default class RegisterScreen extends Component {
	static navigationOptions = {
		title: "Register",
		headerMode: "none"
	};

	render() {
		return <Text>Register</Text>;
	}
}
