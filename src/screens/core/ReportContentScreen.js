import React, { Component } from "react";
import { Text, View, ScrollView, StyleSheet, Keyboard, TextInput, KeyboardAvoidingView, Image, LayoutAnimation, Alert } from "react-native";
import { connect } from "react-redux";
import _ from "underscore";
import { compose, withApollo } from "react-apollo";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Animatable from "react-native-animatable";

import { pushToast } from "../../redux/actions/app";
import getErrorMessage from "../../utils/getErrorMessage";
import Button from "../../atoms/Button";
import RichTextContent from "../../ecosystems/RichTextContent";
import CheckList from "../../ecosystems/CheckList";
import ContentRow from "../../ecosystems/ContentRow";
import LargeTitle from "../../atoms/LargeTitle";
import Lang from "../../utils/Lang";
import { withTheme } from "../../themes";
import withInsets from "../../hocs/withInsets";
import icons from "../../icons";

class ReportContentScreen extends Component {
	constructor(props) {
		super(props);

		this.state = {
			selectedReason: null,
			submitting: false,
			hasSubmitted: false
		};

		this._submitBarRef = null;

		this.onPressReason = this.onPressReason.bind(this);
		this.submitReportorRevoke = this.submitReportorRevoke.bind(this);
		this.onChangeInfoText = this.onChangeInfoText.bind(this);
	}

	/**
	 * On mount, set the reason to the default
	 *
	 * @return 	void
	 */
	componentDidMount() {
		this._errors = {
			NO_POST: Lang.get("no_post"),
			CANNOT_REPORT: Lang.get("error_cannot_report"),
			ALREADY_REPORTED: Lang.get("error_already_reported"),
			INVALID_REASON: Lang.get("error_must_select_report_reason"),
			REPORT_FAILED: Lang.get("error_report_failed")
		};

		this.setState({
			selectedReason: this.props.site.settings.reportReasons[0].id
		});
	}

	/**
	 * Unmount - remove the timeout we set to close the modal
	 *
	 * @return 	void
	 */
	componentWillUnmount() {
		clearTimeout(this._closeModalTimer);
	}

	/**
	 * Build the array of reason data to pass into <CheckList>
	 *
	 * @return 	array
	 */
	getReasonData() {
		return this.props.site.settings.reportReasons.map((reason, idx) => ({
			key: `reason_${reason.id}`,
			reasonID: reason.id,
			title: reason.reason,
			checked: this.state.selectedReason === reason.id
		}));
	}

	/**
	 * Gets a string with {tags}, and splits it into separate <Text> elements where {tags} get additional styles
	 *
	 * @return 	array
	 */
	getReportSummary() {
		const { navigation } = this.props;
		const { hasReported } = navigation.getParam("reportData");
		const thingTitle = navigation.getParam("thingTitle");
		let lang;

		if (hasReported) {
			lang = thingTitle ? Lang.get("revoke_report_x_in_x") : Lang.get("revoke_report_x");
		} else {
			lang = thingTitle ? Lang.get("reporting_x_in_x") : Lang.get("reporting_x");
		}

		return this.buildLangSummary(lang);
	}

	/**
	 * Givem a string with {tags}, splits it into separate <Text> elements where {tags} get additional styles
	 *
	 * @return 	array
	 */
	buildLangSummary(lang) {
		const { navigation, styles } = this.props;
		const langPieces = lang
			.split("{")
			.join("||")
			.split("}")
			.join("||")
			.split("||");

		const finalPieces = langPieces.map((piece, idx) => {
			if (piece === "thing") {
				return (
					<Text key={`piece_${idx}`} style={styles.mediumText}>
						{navigation.getParam("thingTitle")}
					</Text>
				);
			} else if (piece === "item") {
				return (
					<Text key={`piece_${idx}`} style={styles.mediumText}>
						{navigation.getParam("contentTitle")}
					</Text>
				);
			} else if (piece === "site_name") {
				return <Text key={`piece_${idx}`}>{this.props.site.settings.board_name}</Text>;
			} else {
				return <Text key={`piece_${idx}`}>{piece}</Text>;
			}
		});

		return finalPieces;
	}

	/**
	 * Event handler for changing the additional information text box
	 *
	 * @return 	void
	 */
	onChangeInfoText(currentText) {
		this.setState({
			additionalInformation: currentText
		});
	}

	/**
	 * Event handler for tapping a reason to select it
	 *
	 * @return 	void
	 */
	onPressReason(reason) {
		this.setState({
			selectedReason: reason.reasonID
		});
	}

	/**
	 * Event handler for submitting the screen. Hands off to appropriate
	 * method depending on what we're doing.
	 *
	 * @return 	void
	 */
	submitReportorRevoke() {
		const { hasReported } = this.props.navigation.getParam("reportData");

		if (hasReported) {
			this.revokeReport();
		} else {
			this.submitReport();
		}
	}

	/**
	 * Revoke an existing report
	 *
	 * @return 	void
	 */
	async revokeReport() {
		if (!this.props.site.settings.automoderationEnabled) {
			return null;
		}

		this.setState({
			submitting: true
		});

		const { id } = this.props.navigation.getParam("reportData");

		try {
			const { data } = await this.props.client.mutate({
				mutation: this.props.navigation.getParam("revokeReportMutation"),
				variables: {
					id: this.props.navigation.getParam("id"),
					reportID: id
				}
			});

			this._submitBarRef.slideOutDown();

			LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
			this.setState({
				submitting: false,
				hasSubmitted: true
			});

			this.props.dispatch(pushToast({ message: Lang.get("revoke_success") }));
			this.props.navigation.goBack();
		} catch (err) {
			console.log(err);

			const error = getErrorMessage(err, this._errors);
			const message = error === "error" ? Lang.get("error_revoke_failed") : error;

			Alert.alert(Lang.get("error"), message, [{ text: Lang.get("ok") }], { cancelable: false });

			this.setState({
				submitting: false
			});
		}
	}

	/**
	 * Handles submitting the report to the community
	 *
	 * @return 	void
	 */
	async submitReport() {
		if (this.props.site.settings.automoderationEnabled && this.state.selectedReason === null) {
			Alert.alert(Lang.get("error"), Lang.get("error_must_select_report_reason"), [{ text: Lang.get("ok") }], { cancelable: false });
		}

		this.setState({
			submitting: true
		});

		try {
			const { data } = await this.props.client.mutate({
				mutation: this.props.navigation.getParam("reportMutation"),
				variables: {
					id: this.props.navigation.getParam("id"),
					additionalInfo: this.state.additionalInformation,
					...(this.props.site.settings.automoderationEnabled ? { reason: parseInt(this.state.selectedReason) } : {})
				}
			});

			this._submitBarRef.slideOutDown();

			LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
			this.setState({
				submitting: false,
				hasSubmitted: true
			});

			this.props.dispatch(pushToast({ message: Lang.get("thanks_for_report") }));
			this.props.navigation.goBack();
		} catch (err) {
			const error = getErrorMessage(err, this._errors);
			const message = error === "error" ? Lang.get("error_report_failed") : error;

			Alert.alert(Lang.get("error"), message, [{ text: Lang.get("ok") }], { cancelable: false });

			this.setState({
				submitting: false
			});
		}
	}

	/**
	 * Return the screen contents to allow the user to report the content
	 *
	 * @return 	Component
	 */
	getReportForm() {
		let reasonChooser = null;
		const { styles, styleVars, componentStyles } = this.props;

		if (this.props.site.settings.automoderationEnabled) {
			reasonChooser = (
				<React.Fragment>
					<LargeTitle>{Lang.get("choose_reason")}</LargeTitle>
					<CheckList type="radio" data={this.getReasonData()} onPress={this.onPressReason} disabled={this.state.submitting} />
				</React.Fragment>
			);
		}

		return (
			<React.Fragment>
				<View style={[styles.pWide, styles.mtStandard, styles.flexRow, styles.flexAlignStart]}>
					<Image source={icons.INFO_SOLID} resizeMode="contain" style={[{ width: 20, height: 20 }, styles.mrStandard, styles.normalImage]} />
					<Text style={[styles.largeText, styles.text, styles.flexBasisZero, styles.flexGrow]}>{this.getReportSummary()}</Text>
				</View>
				{reasonChooser}
				<LargeTitle>{Lang.get("additional_report_info")}</LargeTitle>
				<ContentRow style={[styles.phWide, styles.pvStandard]}>
					<TextInput
						style={[styles.contentText, componentStyles.infoTextInput]}
						placeholder={Lang.get("report_info_placeholder")}
						placeholderTextColor={styleVars.veryLightText}
						multiline={true}
						textAlignVertical="top"
						returnKeyType="done"
						editable={!this.state.submitting}
						onChangeText={this.onChangeInfoText}
						blurOnSubmit={true}
						onSubmitEditing={() => {
							Keyboard.dismiss();
						}}
					/>
				</ContentRow>
			</React.Fragment>
		);
	}

	/**
	 * Return the screen contents when the user has already reported and is able to revoke
	 *
	 * @return 	Component
	 */
	getRevokeForm() {
		const { styles } = this.props;
		const { reportType, reportContent } = this.props.navigation.getParam("reportData");
		const reportTypeData = this.props.site.settings.reportReasons[reportType];

		return (
			<React.Fragment>
				<View style={[styles.pWide, styles.mtStandard, styles.flexRow, styles.flexAlignStart]}>
					<Image source={icons.INFO_SOLID} resizeMode="contain" style={[{ width: 20, height: 20 }, styles.mrStandard]} />
					<Text style={[styles.largeText, styles.text, styles.flexBasisZero, styles.flexGrow]}>{this.getReportSummary()}</Text>
				</View>
				<LargeTitle>{Lang.get("report_reason")}</LargeTitle>
				<ContentRow style={[styles.phWide, styles.pvStandard]}>
					<Text style={[styles.contentText, _.isUndefined(reportTypeData) ? styles.lightText : null]}>
						{!_.isUndefined(reportTypeData) ? reportTypeData.reason : Lang.get("report_unknown")}
					</Text>
				</ContentRow>
				<LargeTitle>{Lang.get("additional_report_info")}</LargeTitle>
				<ContentRow style={[styles.phWide, styles.pvStandard]}>
					{reportContent === "<p></p>" ? (
						<Text style={[styles.lightText, styles.contentText]}>{Lang.get("no_additional_info")}</Text>
					) : (
						<RichTextContent>{reportContent}</RichTextContent>
					)}
				</ContentRow>
			</React.Fragment>
		);
	}

	render() {
		const { styles } = this.props;
		const { hasReported } = this.props.navigation.getParam("reportData");
		let buttonTitle;

		if (hasReported) {
			buttonTitle = this.state.submitting ? Lang.get("sending_revoke") : Lang.get("send_revoke");
		} else {
			buttonTitle = this.state.submitting ? Lang.get("sending_report") : Lang.get("send_report");
		}

		return (
			<React.Fragment>
				<KeyboardAwareScrollView style={styles.flex}>
					<ScrollView style={{ flex: 1 }}>
						{hasReported && this.props.site.settings.automoderationEnabled ? this.getRevokeForm() : this.getReportForm()}
					</ScrollView>
				</KeyboardAwareScrollView>
				<Animatable.View
					ref={ref => (this._submitBarRef = ref)}
					style={[
						styles.lightBackground,
						styles.bottomSubmitBar,
						this.props.insets.bottom > 0 ? { paddingBottom: this.props.insets.bottom + styleVars.spacing.standard } : null
					]}
				>
					<Button
						filled
						title={buttonTitle}
						type="primary"
						size="large"
						disabled={this.state.submitting}
						onPress={this.submitReportorRevoke}
						showActivity={this.state.submitting}
					/>
				</Animatable.View>
			</React.Fragment>
		);
	}
}

const _componentStyles = {
	infoTextInput: {
		minHeight: 100
	}
};

export default compose(
	connect(state => ({
		site: state.site
	})),
	withApollo,
	withInsets,
	withTheme(_componentStyles)
)(ReportContentScreen);
