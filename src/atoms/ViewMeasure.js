import React, { PureComponent } from "react";
import { View } from "react-native";
import PropTypes from "prop-types";
import _ from "underscore";

export default class ViewMeasure extends PureComponent {
	constructor(props) {
		super(props);
		this.onLayout = this.onLayout.bind(this);
	}

	onLayout(event) {
		if( this.props.onLayout ){
			const measure = event.nativeEvent.layout;
			const id = this.props.id;

			if( _.isArray( this.props.onLayout ) ){
				for( let i = 0; i < this.props.onLayout.length; i++ ){
					this.props.onLayout[i]({
						id,
						measure
					});
				}
			} else {
				this.props.onLayout({
					id,
					measure
				});
			}
		}
	}

	render() {
		return (
			<View {...this.props} onLayout={this.onLayout}>
				{this.props.children}
			</View>
		);
	}
}