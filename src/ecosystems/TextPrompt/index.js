import React, { Component } from "react";
import { Text, TextInput, View, StyleSheet, TouchableHighlight } from "react-native";
import Modal from "react-native-modal";

import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";

class TextPrompt extends Component {
	state = {
		value: ""
	};

	constructor(props) {
		super(props);
		this._input = null;
	}

	componentDidUpdate(prevProps) {
		if (!prevProps.isVisible && this.props.isVisible) {
			this._input.focus();
		}
	}

	_onChange(value) {
		this.setState({ value });
	}

	_onSubmit() {
		this.props.submit(this.state.value);
	}

	render() {
		const { componentStyles, styleVars, styles } = this.props;

		return (
			<Modal
				style={componentStyles.outerModal}
				isVisible={this.props.isVisible}
				avoidKeyboard
				animationIn="bounceIn"
				animationOut="fadeOut"
				onBackdropPress={() => this.props.close()}
			>
				<View style={componentStyles.modal}>
					<View style={componentStyles.body}>
						<Text style={[componentStyles.text, componentStyles.title]}>{this.props.title}</Text>
						<Text style={[componentStyles.text, styles.lightText, componentStyles.message]}>{this.props.message}</Text>
						<TextInput
							style={componentStyles.textInput}
							onChangeText={value => this._onChange(value)}
							placeholder={this.props.placeholder}
							ref={input => (this._input = input)}
							{...this.props.textInputProps}
						/>
					</View>
					<View style={componentStyles.buttonRow}>
						<TouchableHighlight
							activeOpacity={styleVars.touchOpacity}
							underlayColor={styleVars.touchColor}
							style={[componentStyles.button, componentStyles.buttonCancel]}
							onPress={() => this.props.close()}
						>
							<Text style={[componentStyles.buttonText, componentStyles.buttonCancelText]}>{Lang.get("cancel")}</Text>
						</TouchableHighlight>
						<TouchableHighlight
							activeOpacity={styleVars.touchOpacity}
							underlayColor={styleVars.touchColor}
							style={[componentStyles.button, componentStyles.buttonOK]}
							onPress={() => this._onSubmit()}
						>
							<Text style={[componentStyles.buttonText, componentStyles.buttonOKText]}>{this.props.submitText}</Text>
						</TouchableHighlight>
					</View>
				</View>
			</Modal>
		);
	}
}

const _componentStyles = styleVars => ({
	outerModal: {
		flex: 1
	},
	modal: {
		backgroundColor: "rgba(255,255,255,0.9)", // @todo color
		borderRadius: 6
	},
	body: {
		padding: styleVars.spacing.wide
	},
	text: {
		textAlign: "center"
	},
	title: {
		fontSize: styleVars.fontSizes.large,
		color: "#000", // @todo color
		fontWeight: "bold"
	},
	message: {
		fontSize: styleVars.fontSizes.standard
	},
	textInput: {
		borderWidth: 1,
		borderColor: styleVars.borderColors.dark,
		paddingHorizontal: styleVars.spacing.standard,
		paddingVertical: styleVars.spacing.tight,
		marginTop: styleVars.spacing.wide,
		borderRadius: 3
	},
	buttonRow: {
		borderTopWidth: 1,
		borderTopColor: styleVars.borderColors.dark,
		display: "flex",
		flexDirection: "row"
	},
	button: {
		paddingHorizontal: styleVars.spacing.wide,
		paddingVertical: styleVars.spacing.standard,
		flexBasis: 0,
		flexGrow: 1
	},
	buttonText: {
		textAlign: "center",
		color: "#0073ff", // @todo color
		fontSize: styleVars.fontSizes.large
	},
	buttonCancel: {
		borderRightWidth: 1,
		borderRightColor: styleVars.borderColors.dark
	},
	buttonOKText: {
		fontWeight: "bold"
	}
});

export default withTheme(_componentStyles)(TextPrompt);
