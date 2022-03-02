const _componentStyles = styleVars => ({
	streamHeader: {
		flex: 1,
		flexDirection: "column",
		alignItems: "flex-start",
		paddingHorizontal: styleVars.spacing.wide,
		paddingTop: styleVars.spacing.standard
	},
	streamHeaderInner: {
		flex: 1
	},
	streamMeta: {
		width: "100%",
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-between",
		borderBottomWidth: 1,
		borderBottomColor: styleVars.borderColors.medium,
		paddingBottom: styleVars.spacing.standard
	},
	streamMetaInner: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center"
	},
	streamMetaText: {
		fontSize: styleVars.fontSizes.standard
	},
	streamMetaAction: {
		marginLeft: 5
	},
	streamItemInfo: {
		flex: 1,
		flexDirection: "row"
	},
	streamItemTitle: {
		fontSize: 17,
		fontWeight: "600",
		color: "#171717"
	},
	streamItemTitleSmall: {
		fontSize: 15
	},
	streamItemContainer: {
		color: "#8F8F8F"
	},
	streamContent: {
		marginTop: styleVars.spacing.wide,
		paddingHorizontal: styleVars.spacing.wide,
		paddingBottom: styleVars.spacing.wide
	},
	streamContentIndented: {
		borderLeftWidth: 3,
		borderLeftColor: styleVars.borderColors.dark,
		paddingLeft: styleVars.spacing.standard,
		paddingBottom: 0,
		marginBottom: styleVars.spacing.wide,
		marginLeft: styleVars.spacing.wide
	},
	snippetWrapper: {
		marginTop: 9
	},
	snippetText: {
		fontSize: 15
	},
	streamFooter: {
		marginTop: styleVars.spacing.standard,
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-start"
	},
	reactionOverview: {
		marginLeft: styleVars.spacing.wide
	},
	blob: {
		backgroundColor: "#888",
		width: 11,
		height: 11,
		borderRadius: 11,
		position: "absolute",
		left: -22,
		top: 9
	},
	imageContainer: {
		height: 150,
		width: "100%",
		marginTop: 12
	},
	image: {
		flex: 1
	},

	// ============
	metaTextWrapper: {
		borderBottomWidth: 1,
		borderBottomColor: "#F2F4F7",
		padding: 9
	},
	metaText: {
		fontSize: 13
	},

	placeholder: {
		padding: styleVars.spacing.standard
	},
	postWrapper: {
		marginBottom: 7
	},
	post: {
		paddingBottom: 0
	},
	postInfo: {
		flexDirection: "row",
		alignItems: "flex-start",
		flex: 1
	},
	meta: {
		flex: 1,
		flexDirection: "column",
		justifyContent: "center"
		//marginLeft: 9
	},

	date: {
		fontSize: 14,
		color: "#8F8F8F"
	},
	postContentContainer: {
		marginTop: 16
	},
	postContent: {
		fontSize: 16
	},
	postMenu: {
		width: 24,
		height: 24
	},
	postInfoButton: {
		alignSelf: "flex-start"
	},
	postReactionList: {
		display: "flex",
		justifyContent: "flex-end",
		flexWrap: "wrap",
		flexDirection: "row",
		marginTop: 15
	},
	reactionItem: {
		marginLeft: 10
	}
});

export default _componentStyles;
