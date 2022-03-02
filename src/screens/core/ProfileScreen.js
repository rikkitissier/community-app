import React, { Component } from "react";
import { Text, View, TouchableOpacity, StyleSheet, Image, StatusBar, Animated, Platform, Dimensions, Alert } from "react-native";
import gql from "graphql-tag";
import { graphql, compose, withApollo } from "react-apollo";
import { connect } from "react-redux";
import { HeaderBackButton } from "react-navigation";
import { TabView, TabBar } from "react-native-tab-view";
import FadeIn from "react-native-fade-in-image";
import _ from "underscore";

import Lang from "../../utils/Lang";
import { pushToast } from "../../redux/actions/app";
import ErrorBox from "../../atoms/ErrorBox";
import getErrorMessage from "../../utils/getErrorMessage";
import Button from "../../atoms/Button";
import UserPhoto from "../../atoms/UserPhoto";
import CustomHeader from "../../ecosystems/CustomHeader";
import TwoLineHeader from "../../atoms/TwoLineHeader";
import Lightbox from "../../ecosystems/Lightbox";
import { ProfileContent, ProfileOverview, ProfileEditorField, ProfileFollowers, ProfilePlaceholder, ProfileField } from "../../ecosystems/Profile";
import { FollowModal, FollowModalFragment, FollowMutation, UnfollowMutation } from "../../ecosystems/FollowModal";
import getImageUrl from "../../utils/getImageUrl";
import { withTheme } from "../../themes";
import withInsets from "../../hocs/withInsets";

const ProfileQuery = gql`
	query ProfileQuery($member: ID!) {
		core {
			member(id: $member) {
				id
				name
				email
				photo
				contentCount
				reputationCount
				joined
				allowFollow
				group {
					name
				}
				coverPhoto {
					image
					offset
				}
				follow {
					...FollowModalFragment
				}
				customFieldGroups {
					id
					title
					fields {
						id
						title
						value
						type
					}
				}
			}
		}
	}
	${FollowModalFragment}
`;

class ProfileScreen extends Component {
	static navigationOptions = ({ navigation }) => ({
		headerTransparent: true,
		header: null
	});

	static errors = {
		CANT_FOLLOW_SELF: "Can't follow self",
		CANT_FOLLOW_MEMBER: "Can't follow member"
	};

	constructor(props) {
		super(props);

		this._followTimeout = null;
		this._nScroll = new Animated.Value(0);
		this._scroll = new Animated.Value(0);
		this._isSnapping = false;
		this._heights = [];
		this._nScroll.addListener(Animated.event([{ value: this._scroll }], { useNativeDriver: false }));

		this.state = {
			fullHeaderHeight: 250,
			followModalVisible: false,
			index: 0,
			photoLightboxVisible: false
		};

		this.onFollow = this.onFollow.bind(this);
		this.onUnfollow = this.onUnfollow.bind(this);
		this.toggleFollowModal = this.toggleFollowModal.bind(this);
		this.renderScene = this.renderScene.bind(this);
		this.renderTabBar = this.renderTabBar.bind(this);
		this.onPressBack = this.onPressBack.bind(this);
		this.onScrollEndWrapper = this.onScrollEndWrapper.bind(this);
		this.closeLightbox = this.closeLightbox.bind(this);
		this.showPhotoLightbox = this.showPhotoLightbox.bind(this);

		console.log(this.props.insets);

		this.buildAnimations();
	}

	componentWillUnmount() {
		clearTimeout(this._followTimeout);
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevState.fullHeaderHeight !== this.state.fullHeaderHeight) {
			this.buildAnimations();
		}
	}

	showPhotoLightbox() {
		this.setState({
			photoLightboxVisible: true
		});
	}

	/**
	 * Event handler that sets state to close the lightbox
	 *
	 * @return 	void
	 */
	closeLightbox() {
		this.setState({
			photoLightboxVisible: false
		});
	}

	/**
	 * Event handler for floating back button
	 *
	 * @return 	void
	 */
	onPressBack() {
		this.props.navigation.goBack(null);
	}

	/**
	 * Event handler for following the forum
	 *
	 * @param 	object 		followData 		Object with the selected values from the modal
	 * @return 	void
	 */
	onFollow(followData) {
		this.setState({
			followModalVisible: false
		});

		// Put in a short timeout to allow the modal to hide, otherwise
		// our optimisticResponse will cause the modal contents to switch while we
		// can still see it
		this._followTimeout = setTimeout(async () => {
			try {
				await this.props.client.mutate({
					mutation: FollowMutation,
					variables: {
						app: "core",
						area: "member",
						id: this.props.data.core.member.id,
						anonymous: followData.anonymous,
						type: "IMMEDIATE"
					},
					optimisticResponse: {
						mutateCore: {
							__typename: "mutate_Core",
							follow: {
								...this.props.data.core.member.follow,
								isFollowing: true
							}
						}
					},
					refetchQueries: ["ProfileFollowersQuery"]
				});

				this.props.dispatch(
					pushToast({
						message: Lang.get("followed_member", { name: this.props.data.core.member.name })
					})
				);
			} catch (err) {
				Alert.alert(Lang.get("error"), Lang.get("error_following"), [{ text: Lang.get("ok") }], { cancelable: false });
			}
		}, 300);
	}

	/**
	 * Event handler for unfollowing the forum
	 *
	 * @return 	void
	 */
	onUnfollow() {
		this.setState({
			followModalVisible: false
		});

		// Put in a short timeout to allow the modal to hide, otherwise
		// our optimisticResponse will cause the modal contents to switch while we
		// can still see it
		this._followTimeout = setTimeout(async () => {
			try {
				await this.props.client.mutate({
					mutation: UnfollowMutation,
					variables: {
						app: "core",
						area: "member",
						id: this.props.data.core.member.id,
						followID: this.props.data.core.member.follow.followID
					},
					optimisticResponse: {
						mutateCore: {
							__typename: "mutate_Core",
							unfollow: {
								...this.props.data.core.member.follow,
								isFollowing: false
							}
						}
					},
					refetchQueries: ["ProfileFollowersQuery"]
				});

				this.props.dispatch(
					pushToast({
						message: Lang.get("unfollowed_member", { name: this.props.data.core.member.name })
					})
				);
			} catch (err) {
				Alert.alert(Lang.get("error"), Lang.get("error_unfollowing"), [{ text: Lang.get("ok") }], { cancelable: false });
			}
		}, 300);
	}

	buildAnimations() {
		const HEADER_HEIGHT = 52 + this.props.insets.top;
		const SCROLL_HEIGHT = this.state.fullHeaderHeight - HEADER_HEIGHT;

		// Interpolate methods for animations
		this.userOpacity = this._scroll.interpolate({
			inputRange: [0, SCROLL_HEIGHT / 2, SCROLL_HEIGHT],
			outputRange: [1, 0.3, 0]
		});
		this.tabY = this._nScroll.interpolate({
			inputRange: [0, SCROLL_HEIGHT + 1, SCROLL_HEIGHT + 2],
			outputRange: [0, 0, 1]
		});
		this.avatarScale = this._nScroll.interpolate({
			inputRange: [0, SCROLL_HEIGHT],
			outputRange: [1, 0.5],
			extrapolateLeft: "clamp"
		});
		this.imgScale = this._nScroll.interpolate({
			inputRange: [-75, 0, 50],
			outputRange: [1.7, 1, 1.2],
			extrapolateLeft: "clamp"
		});
		this.fixedHeaderOpacity = this._scroll.interpolate({
			inputRange: [0, SCROLL_HEIGHT / 2, SCROLL_HEIGHT * 0.8],
			outputRange: [0, 0.1, 1]
		});
	}

	/**
	 * Event handler for the main scrollview scrolling end. Used to handle snapping.
	 *
	 * @param 	object  	e 		Event data
	 * @return 	void
	 */
	onScrollEndWrapper(e) {
		const y = e.nativeEvent.contentOffset.y;
		const halfway = this.state.fullHeaderHeight / 2;

		if (!this._isSnapping && y > 0) {
			if (y < halfway) {
				this.setIsSnapping();
				this._wrapView.scrollTo({ y: 0 });
			} else {
				if (y > halfway && y < this.state.fullHeaderHeight) {
					const headerHeight = 52 + this.props.insets.top;
					const snapTo = this.state.fullHeaderHeight - headerHeight;

					this.setIsSnapping();
					this._wrapView.scrollTo({ y: snapTo });
				}
			}
		}
	}

	/**
	 * Set snapping state and a timeout to reset it
	 *
	 * @return 	void
	 */
	setIsSnapping() {
		this._isSnapping = true;
		this._snapTimeout = setTimeout(() => (this._isSnapping = false), 300);
	}

	getLightboxData() {
		if (this.props.data.core.member.photo) {
			return { [this.props.data.core.member.photo]: true };
		}

		return [];
	}

	/**
	 * Toggles between showing/hiding the follow modal
	 *
	 * @return 	void
	 */
	toggleFollowModal = () => {
		this.setState({
			followModalVisible: !this.state.followModalVisible
		});
	};

	/**
	 * Return the profile data we'll show in the first tab
	 *
	 * @return 	array
	 */
	getProfileFields() {
		const customFields = [];

		customFields.push({
			title: Lang.get("basic_information"),
			data: [
				{
					key: "joined",
					data: {
						id: "joined",
						title: Lang.get("joined"),
						// Since our CustomField component expects JSON field data, we have to re-json this
						value: JSON.stringify(String(this.props.data.core.member.joined)),
						type: "Date"
					}
				},
				...(this.props.data.core.member.email
					? [
							{
								key: "email",
								data: {
									id: "email",
									title: Lang.get("email_address"),
									// Since our CustomField component expects JSON field data, we have to re-json this
									value: JSON.stringify(this.props.data.core.member.email),
									type: "Email"
								}
							}
					  ]
					: [])
			]
		});

		if (this.props.data.core.member.customFieldGroups && this.props.data.core.member.customFieldGroups.length) {
			this.props.data.core.member.customFieldGroups.forEach(group => {
				if (!group.fields.length) {
					return;
				}

				const fields = [];

				// Loop through each field, and only add it if it isn't an editor
				// Editor fields will show in their own tab thanks to getAdditionalTabs()
				group.fields.forEach(field => {
					if (field.type !== "Editor") {
						fields.push({
							key: field.id,
							data: field
						});
					}
				});

				// If we have any fields to show, add them to the result
				if (fields.length) {
					customFields.push({
						title: group.title,
						data: fields
					});
				}
			});
		}

		return customFields;
	}

	/**
	 * Return additional tabs to show. Right now this means any Editor custom fields
	 *
	 * @return 	object
	 */
	getAdditionalTabs() {
		const additionalTabs = {};

		if (this.props.data.core.member.customFieldGroups && this.props.data.core.member.customFieldGroups.length) {
			this.props.data.core.member.customFieldGroups.forEach(group => {
				if (group.fields.length) {
					group.fields.forEach(field => {
						if (field.type == "Editor") {
							additionalTabs[`field_${field.id}`] = field;
						}
					});
				}
			});
		}

		return additionalTabs;
	}

	/**
	 * Render a custom tab bar. Uses the normal tab bar, but wraps it in an animated view so that
	 * the translateY pos can be animated to create a sticky header
	 *
	 * @return 	Component
	 */
	renderTabBar(props) {
		const { styles, styleVars } = this.props;
		return (
			<Animated.View style={{ transform: [{ translateY: this.tabY }, { perspective: 1000 }], zIndex: 1 }}>
				<TabBar
					{...props}
					scrollEnabled
					bounces
					tabStyle={{ minWidth: 50 }}
					style={styles.tabBar}
					indicatorStyle={styles.tabBarIndicator}
					activeColor={styleVars.tabBar.active}
					inactiveColor={styleVars.tabBar.inactive}
					getLabelText={({ route }) => route.title}
					labelStyle={styles.tabBarLabelStyle}
				/>
			</Animated.View>
		);
	}

	/**
	 * Return the routes that the tab bar will render
	 *
	 * @return 	array
	 */
	getTabRoutes() {
		const additionalTabs = Object.entries(this.getAdditionalTabs());
		const routes = [{ key: "overview", title: Lang.get("profile_overview") }, { key: "content", title: Lang.get("profile_content") }];

		if (this.props.data.core.member.allowFollow) {
			routes.push({
				key: "followers",
				title: Lang.get("profile_followers")
			});
		}

		if (additionalTabs.length) {
			additionalTabs.forEach(([key, tab]) => {
				routes.push({
					key,
					title: tab.title
				});
			});
		}

		return routes;
	}

	/**
	 * Given a particular route, return the component that will render the tab panel
	 *
	 * @param 	object
	 * @return 	Component
	 */
	renderScene({ route }) {
		const routes = this.getTabRoutes();
		const thisIndex = routes.findIndex(r => r.key === route.key);
		const routeShouldBeActive = this.state.index === thisIndex;
		const minHeight = Dimensions.get("window").height - (52 + this.props.insets.top);
		const style = { minHeight };

		switch (route.key) {
			case "overview":
				return <ProfileOverview style={style} profileData={this.getProfileFields()} isActive={routeShouldBeActive} />;
			case "content":
				return <ProfileContent style={style} showResults member={this.props.data.core.member.id} isActive={routeShouldBeActive} />;
			case "followers":
				return <ProfileFollowers style={style} id={this.props.data.core.member.id} isActive={routeShouldBeActive} />;
		}

		if (route.key.startsWith("field_")) {
			const additionalTabs = this.getAdditionalTabs();
			return <ProfileEditorField style={style} content={additionalTabs[route.key].value} isActive={routeShouldBeActive} />;
		}
	}

	render() {
		const { styles, componentStyles } = this.props;

		if (this.props.data.loading && this.props.data.networkStatus !== 3 && this.props.data.networkStatus !== 4) {
			return <ProfilePlaceholder />;
		} else if (this.props.data.error) {
			const error = getErrorMessage(this.props.data.error, ProfileScreen.errors);
			const message = error ? error : Lang.get("profile_error");
			return <ErrorBox message={message} />;
		} else {
			// Follow button
			let showFollowButton = false;
			if (
				this.props.user.id &&
				this.props.data.core.member.id !== this.props.user.id &&
				(this.props.data.core.member.allowFollow || this.props.data.core.member.follow.isFollowing)
			) {
				showFollowButton = true;
			}

			const photo = this.props.data.core.member.photo;
			const photoLightboxHandler = _.isString(photo) && photo.startsWith("data:image") ? null : this.showPhotoLightbox;
			const minHeight = Dimensions.get("window").height - (52 + this.props.insets.top);

			return (
				<View style={styles.flex}>
					<StatusBar barStyle="light-content" translucent />
					{this.props.auth.isAuthenticated && (
						<FollowModal
							isVisible={this.state.followModalVisible}
							followData={this.props.data.core.member.follow}
							onFollow={this.onFollow}
							onUnfollow={this.onUnfollow}
							close={this.toggleFollowModal}
						/>
					)}
					<Animated.ScrollView
						showsVerticalScrollIndicator={false}
						scrollEventThrottle={5}
						style={[{ zIndex: 0, minHeight: minHeight }, styles.flex]}
						onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: this._nScroll } } }], { useNativeDriver: true })}
						onScrollEndDrag={this.onScrollEndWrapper}
						onMomentumScrollEnd={this.onScrollEndWrapper}
						ref={wrapView => (this._wrapView = wrapView)}
					>
						<Animated.View
							onLayout={e => {
								this.setState({ fullHeaderHeight: e.nativeEvent.layout.height });
							}}
							style={componentStyles.profileHeader}
						>
							{Boolean(this.props.data.core.member.coverPhoto.image) && (
								<Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: this.imgScale }, { perspective: 1000 }] }]}>
									<FadeIn style={StyleSheet.absoluteFill} placeholderStyle={{ backgroundColor: "#333" }}>
										<Image source={{ uri: getImageUrl(this.props.data.core.member.coverPhoto.image) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
									</FadeIn>
								</Animated.View>
							)}
							<Animated.View style={[componentStyles.profileHeaderInner, { paddingTop: this.props.insets.top + 10, opacity: this.userOpacity }]}>
								<Animated.View style={[componentStyles.userInfoWrap, { transform: [{ scale: this.avatarScale }, { perspective: 1000 }] }]}>
									<TouchableOpacity onPress={photoLightboxHandler} style={{ width: 80, height: 80 }}>
										<UserPhoto url={this.props.data.core.member.photo} size={80} />
									</TouchableOpacity>
									<Text style={componentStyles.usernameText}>{this.props.data.core.member.name}</Text>
									<Text style={componentStyles.groupText}>{this.props.data.core.member.group.name}</Text>
								</Animated.View>
								{Boolean(showFollowButton) && (
									<View style={[styles.mtWide, componentStyles.buttonBar]}>
										<Button
											filled
											rounded
											type="light"
											size="medium"
											title={this.props.data.core.member.follow.isFollowing ? Lang.get("unfollow") : Lang.get("follow")}
											onPress={this.toggleFollowModal}
											style={componentStyles.button}
										/>
									</View>
								)}
								<View style={[styles.mtWide, componentStyles.profileStats]}>
									<View style={[componentStyles.profileStatSection, componentStyles.profileStatSectionBorder]}>
										<Text style={componentStyles.profileStatCount}>{Lang.formatNumber(this.props.data.core.member.contentCount)}</Text>
										<Text style={componentStyles.profileStatTitle}>{Lang.get("profile_content_count")}</Text>
									</View>
									{Boolean(this.props.site.settings.reputation_show_profile) && (
										<View style={[componentStyles.profileStatSection, componentStyles.profileStatSectionBorder]}>
											<Text style={componentStyles.profileStatCount}>{Lang.formatNumber(this.props.data.core.member.reputationCount)}</Text>
											<Text style={componentStyles.profileStatTitle}>{Lang.get("profile_reputation")}</Text>
										</View>
									)}
									{Boolean(this.props.data.core.member.allowFollow) && (
										<View style={componentStyles.profileStatSection}>
											<Text style={componentStyles.profileStatCount}>{Lang.formatNumber(this.props.data.core.member.follow.followCount)}</Text>
											<Text style={componentStyles.profileStatTitle}>{Lang.get("profile_followers")}</Text>
										</View>
									)}
								</View>
							</Animated.View>
						</Animated.View>
						<TabView
							navigationState={{
								index: this.state.index,
								routes: this.getTabRoutes()
							}}
							onIndexChange={index => this.setState({ index })}
							renderScene={this.renderScene}
							renderTabBar={this.renderTabBar}
							initialLayout={{
								width: Dimensions.get("window").width
							}}
							lazy
						/>
					</Animated.ScrollView>
					<Animated.View style={[componentStyles.fixedProfileHeader, { opacity: this.fixedHeaderOpacity }]}>
						<CustomHeader
							content={
								<View style={[styles.flex, styles.flexJustifyCenter, componentStyles.customHeader, { paddingTop: this.props.insets.top }]}>
									<TwoLineHeader title={this.props.data.core.member.name} subtitle={this.props.data.core.member.group.name} />
								</View>
							}
						/>
					</Animated.View>
					<View style={[styles.flex, styles.flexJustifyCenter, componentStyles.backButton, { top: this.props.insets.top }]}>
						<HeaderBackButton onPress={this.onPressBack} tintColor="#fff" />
					</View>
					{Boolean(this.props.data.core.member.photo) && (
						<Lightbox animationIn="bounceIn" isVisible={this.state.photoLightboxVisible} data={this.getLightboxData()} close={this.closeLightbox} />
					)}
				</View>
			);
		}
	}
}

const _componentStyles = styleVars => ({
	customHeader: {
		paddingHorizontal: 56
	},
	backButton: {
		position: "absolute",
		left: 0,
		zIndex: 1000
	},
	fixedProfileHeader: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		zIndex: 100
	},
	profileHeader: {
		backgroundColor: styleVars.placeholderColors.background
	},
	profileHeaderInner: {
		backgroundColor: styleVars.profileOverlay,
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center"
	},
	userInfoWrap: {
		display: "flex",
		alignItems: "center"
	},
	usernameText: {
		color: "#fff",
		fontSize: 22,
		fontWeight: "bold",
		marginTop: 7,
		textShadowColor: "rgba(0,0,0,0.8)",
		textShadowOffset: { width: 1, height: 1 }
	},
	groupText: {
		color: "#fff",
		fontSize: 15,
		textShadowColor: "rgba(0,0,0,0.8)",
		textShadowOffset: { width: 1, height: 1 }
	},
	profileStats: {
		backgroundColor: "rgba(20,20,20,0.8)",
		paddingTop: styleVars.spacing.standard,
		paddingBottom: styleVars.spacing.standard,
		display: "flex",
		flexDirection: "row"
	},
	profileStatSection: {
		flex: 1
	},
	profileStatSectionBorder: {
		borderRightWidth: 1,
		borderRightColor: "rgba(255,255,255,0.1)"
	},
	profileStatCount: {
		color: "#fff",
		textAlign: "center",
		fontSize: 17,
		fontWeight: "500"
	},
	profileStatTitle: {
		color: "#8F8F8F",
		fontSize: 11,
		textAlign: "center"
	},
	buttonBar: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center"
	},
	button: {
		width: "100%",
		maxWidth: 130,
		marginHorizontal: styleVars.spacing.tight
	}
});

export default compose(
	graphql(ProfileQuery, {
		options: props => ({
			variables: {
				member: props.navigation.state.params.id
			}
		})
	}),
	connect(state => ({
		auth: state.auth,
		user: state.user,
		site: state.site
	})),
	withApollo,
	withInsets,
	withTheme(_componentStyles)
)(ProfileScreen);
