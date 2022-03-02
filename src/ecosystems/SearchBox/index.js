import React, { Component } from "react";
import { Text, View, TextInput, TouchableOpacity, Image, Platform } from "react-native";
import _ from "underscore";

import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";
import icons from "../../icons";

class SearchBox extends Component {
	constructor(props) {
		super(props);
		this._textInput = null;
		this.state = {
			// main search stuff
			searchTerm: "",
			loadingSearchResults: false,
			noResults: false,
			showingResults: false,
			textInputActive: false
		};

		this.cancelSearch = this.cancelSearch.bind(this);
		this.onFocusTextInput = this.onFocusTextInput.bind(this);
		this.onBlurTextInput = this.onBlurTextInput.bind(this);
		this.onChangeText = this.onChangeText.bind(this);
		this.emptyTextBox = this.emptyTextBox.bind(this);
	}

	componentDidMount() {
		if (this._textInput && this.props.onRef) {
			this.props.onRef(this._textInput);
		}
	}

	componentDidUpdate(prevProps) {
		if (this.props.active !== prevProps.active) {
			this.setState({
				textInputActive: this.props.active
			});
		}
	}

	/**
	 * Cancel the search
	 *
	 * @return 	void
	 */
	cancelSearch() {
		this.setState({
			textInputActive: false
		});

		if (_.isFunction(this.props.onCancel)) {
			console.log("Calling onCancel");
			this.props.onCancel();
		}

		this._textInput.blur();
	}

	/**
	 * onFocus event handler
	 *
	 * @return 	void
	 */
	onFocusTextInput() {
		this.setState({
			textInputActive: true
		});

		if (_.isFunction(this.props.onFocus)) {
			this.props.onFocus();
		}
	}

	/**
	 * onBlur event handler
	 *
	 * @return 	void
	 */
	onBlurTextInput() {
		this.setState({
			textInputActive: false
		});

		if (_.isFunction(this.props.onBlur)) {
			this.props.onBlur();
		}
	}

	/**
	 * Called when the text changes in the textbox
	 *
	 * @return 	void
	 */
	onChangeText(searchTerm) {
		if (_.isFunction(this.props.onChangeText)) {
			this.props.onChangeText(searchTerm);
		}
	}

	/**
	 * Handler for tapping the X to clear the value
	 *
	 * @return 	void
	 */
	emptyTextBox() {
		if (_.isFunction(this.props.emptyTextBox)) {
			this.props.emptyTextBox();
		}
	}

	render() {
		const { styles, componentStyles } = this.props;

		return (
			<View style={componentStyles.searchWrap}>
				<View style={[componentStyles.searchBox, this.state.textInputActive ? componentStyles.searchBoxActive : null]}>
					<Image source={icons.SEARCH} style={componentStyles.searchIcon} resizeMode="contain" />
					<TextInput
						style={styles.flexGrow}
						autoFocus={this.props.autoFocus}
						autoCapitalize="none"
						autoCorrect={false}
						style={componentStyles.textInput}
						placeholderTextColor="rgba(255,255,255,0.6)"
						placeholder={this.props.placeholder}
						returnKeyType="search"
						onFocus={this.onFocusTextInput}
						onBlur={this.onBlurTextInput}
						onChangeText={searchTerm => this.onChangeText(searchTerm)}
						onSubmitEditing={this.props.onSubmitTextInput}
						ref={ref => (this._textInput = ref)}
						value={this.props.value}
					/>
					{this.props.value.length > 0 && (
						<TouchableOpacity onPress={this.emptyTextBox} style={styles.mlWide}>
							<Image source={icons.CROSS_CIRCLE_SOLID} resizeMode="contain" style={componentStyles.close} />
						</TouchableOpacity>
					)}
				</View>
				{Boolean(!this.state.textInputActive) && Boolean(this.props.rightLinkText) && (
					<TouchableOpacity style={componentStyles.cancelLink} onPress={this.props.rightLinkOnPress || null}>
						<Text style={componentStyles.cancelLinkText}>{this.props.rightLinkText}</Text>
					</TouchableOpacity>
				)}
				{Boolean(this.state.textInputActive) && (
					<TouchableOpacity style={componentStyles.cancelLink} onPress={this.cancelSearch}>
						<Text style={componentStyles.cancelLinkText}>{Lang.get("cancel")}</Text>
					</TouchableOpacity>
				)}
			</View>
		);
	}
}

const _componentStyles = styleVars => ({
	searchWrap: {
		paddingBottom: styleVars.spacing.tight,
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		paddingHorizontal: styleVars.spacing.tight,
		display: "flex",
		flexDirection: "row",
		alignItems: "center"
	},
	searchBox: {
		backgroundColor: "rgba(255,255,255,0.1)",
		paddingVertical: Platform.OS === "ios" ? styleVars.spacing.tight : styleVars.spacing.veryTight,
		paddingHorizontal: styleVars.spacing.tight,
		borderRadius: 10,
		flex: 1,
		flexDirection: "row",
		alignItems: "center"
	},
	searchBoxActive: {
		backgroundColor: "rgba(0,0,0,0.2)"
	},
	textInput: {
		color: "#fff",
		flex: 1
	},
	searchIcon: {
		width: 14,
		height: 14,
		tintColor: "rgba(255,255,255,0.6)",
		marginRight: styleVars.spacing.veryTight
	},
	cancelLink: {
		marginLeft: styleVars.spacing.standard,
		marginRight: styleVars.spacing.veryTight
	},
	cancelLinkText: {
		color: styleVars.headerText,
		fontSize: styleVars.fontSizes.content
	},
	close: {
		width: 16,
		height: 16,
		tintColor: "rgba(255,255,255,0.6)"
	}
});

export default withTheme(_componentStyles)(SearchBox);
