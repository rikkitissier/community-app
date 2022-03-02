import React, { Component } from "react";
import { Text, View } from "react-native";
import { compose } from "react-apollo";
import { connect } from "react-redux";

import Lang from "../../utils/Lang";
import { setContentView } from "../../redux/actions/app";
import CheckList from "../../ecosystems/CheckList";
import { withTheme } from "../../themes";

class ContentView extends Component {
	constructor(props) {
		super(props);
		this.onPress = this.onPress.bind(this);
	}

	/**
	 * Return the content view options available and their checked status
	 *
	 * @return 	array
	 */
	getViewOptions() {
		const isMulti = Expo.Constants.manifest.extra.multi;

		return [
			{
				key: "unread",
				title: isMulti ? "Start at first unread comment" : Lang.get("order_start_unread"),
				subText: isMulti ? "Applies when signed in to a community" : null,
				checked: this.props.app.settings.contentView === "unread"
			},
			{
				key: "first",
				title: isMulti ? "Start at the first comment" : Lang.get("order_start_first"),
				checked: this.props.app.settings.contentView === "first"
			},
			{
				key: "last",
				title: isMulti ? "Start at the most recent comment" : Lang.get("order_start_last"),
				checked: this.props.app.settings.contentView === "last"
			}
		];
	}

	/**
	 * Dispatch an action when an option is tapped
	 *
	 * @return 	void
	 */
	onPress(selected) {
		this.props.dispatch(setContentView(selected.key));
	}

	render() {
		const { styles } = this.props;
		const isMulti = Expo.Constants.manifest.extra.multi;
		return (
			<View>
				<View style={styles.rowsWrap}>
					<CheckList type="radio" data={this.getViewOptions()} onPress={this.onPress} />
				</View>
				<View style={[styles.mtTight, styles.mbExtraWide, styles.phWide]}>
					<Text style={[styles.smallText, styles.lightText]}>
						{isMulti ? "Determines where you are taken when tapping into content. Applies only to this device." : Lang.get("content_view_desc")}
					</Text>
				</View>
			</View>
		);
	}
}

export default compose(
	connect(state => ({
		app: state.app
	})),
	withTheme()
)(ContentView);
