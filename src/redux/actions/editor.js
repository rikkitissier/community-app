export const SET_EDITOR_SETTINGS = "SET_EDITOR_SETTINGS";
export const setEditorSettings = data => {
	return {
		type: SET_EDITOR_SETTINGS,
		payload: {
			...data
		}
	};
};

export const SET_FOCUS = "SET_FOCUS";
export const setFocus = data => ({
	type: SET_FOCUS,
	payload: {
		...data
	}
});

// ------------------------------------------------------------
export const SET_FORMATTING = "SET_FORMATTING";
export const setFormatting = data => ({
	type: SET_FORMATTING,
	payload: {
		...data
	}
});
export const SET_BUTTON_STATE = "SET_BUTTON_STATE";
export const setButtonState = data => ({
	type: SET_BUTTON_STATE,
	payload: {
		...data
	}
});

// ------------------------------------------------------------
export const RESET_EDITOR = "RESET_EDITOR";
export const resetEditor = data => ({
	type: RESET_EDITOR
});

// ------------------------------------------------------------
export const OPEN_LINK_MODAL = "OPEN_LINK_MODAL";
export const openLinkModal = data => ({
	type: OPEN_LINK_MODAL
});
export const CLOSE_LINK_MODAL = "CLOSE_LINK_MODAL";
export const closeLinkModal = data => ({
	type: CLOSE_LINK_MODAL
});

// ------------------------------------------------------------
export const SHOW_MENTION_BAR = "SHOW_MENTION_BAR";
export const showMentionBar = data => ({
	type: SHOW_MENTION_BAR
});
export const HIDE_MENTION_BAR = "HIDE_MENTION_BAR";
export const hideMentionBar = data => ({
	type: HIDE_MENTION_BAR
});
export const LOADING_MENTIONS = "LOADING_MENTIONS";
export const loadingMentions = data => ({
	type: LOADING_MENTIONS
});
export const UPDATE_MENTION_RESULTS = "UPDATE_MENTION_RESULTS";
export const updateMentionResults = data => ({
	type: UPDATE_MENTION_RESULTS,
	payload: data
});
export const INSERT_MENTION_SYMBOL = "INSERT_MENTION_SYMBOL";
export const insertMentionSymbol = data => ({
	type: INSERT_MENTION_SYMBOL
});
export const INSERT_MENTION_SYMBOL_DONE = "INSERT_MENTION_SYMBOL_DONE";
export const insertMentionSymbolDone = data => ({
	type: INSERT_MENTION_SYMBOL_DONE
});

// ------------------------------------------------------------
export const SET_UPLOAD_LIMIT = "SET_UPLOAD_LIMIT";
export const setUploadLimit = data => ({
	type: SET_UPLOAD_LIMIT
});
export const OPEN_IMAGE_PICKER = "OPEN_IMAGE_PICKER";
export const openImagePicker = data => ({
	type: OPEN_IMAGE_PICKER
});
export const RESET_IMAGE_PICKER = "RESET_IMAGE_PICKER";
export const resetImagePicker = data => ({
	type: RESET_IMAGE_PICKER
});
export const OPEN_CAMERA = "OPEN_CAMERA";
export const openCamera = data => ({
	type: OPEN_CAMERA
});
export const RESET_CAMERA = "RESET_CAMERA";
export const resetCamera = data => ({
	type: RESET_CAMERA
});

export const ADD_UPLOADED_IMAGE = "ADD_UPLOADED_IMAGE";
export const addUploadedImage = data => ({
	type: ADD_UPLOADED_IMAGE,
	payload: {
		...data
	}
});
export const REMOVE_UPLOADED_IMAGE = "REMOVE_UPLOADED_IMAGE";
export const removeUploadedImage = data => ({
	type: REMOVE_UPLOADED_IMAGE,
	payload: {
		...data
	}
});

export const SET_UPLOAD_PROGRESS = "SET_UPLOAD_PROGRESS";
export const setUploadProgress = data => ({
	type: SET_UPLOAD_PROGRESS,
	payload: {
		...data
	}
});

export const SET_UPLOAD_STATUS = "SET_UPLOAD_STATUS";
export const setUploadStatus = data => ({
	type: SET_UPLOAD_STATUS,
	payload: {
		...data
	}
});

export const UPLOAD_STATUS = {
	PENDING: "pending",
	UPLOADING: "uploading",
	DONE: "done",
	ERROR: "error",
	ABORTED: "aborted",
	REMOVING: "removing"
};

import Lang from "../../utils/Lang";
import { LayoutAnimation } from "react-native";
import gql from "graphql-tag";
import _ from "underscore";

//import console = require("console");

const uploadMutation = gql`
	mutation UploadAttachmentMutation($name: String!, $contents: String!, $chunk: Int, $totalChunks: Int, $postKey: String!, $ref: String!) {
		mutateCore {
			uploadAttachment(name: $name, contents: $contents, postKey: $postKey, chunk: $chunk, totalChunks: $totalChunks, ref: $ref) {
				... on core_Attachment {
					id
					name
					size
					thumbnail {
						url
						width
						height
					}
				}
				... on core_UploadProgress {
					name
					ref
				}
			}
		}
	}
`;

const deleteMutation = gql`
	mutation DeleteAttachmentMutation($id: ID!) {
		mutateCore {
			deleteAttachment(id: $id)
		}
	}
`;

/**
 * Upload an image
 *
 * @param 	{string} 		file 			The file to upload, in base64
 * @param 	{object}		uploadData		Object containing some data required for processing the upload
 * @return 	void
 */
export const uploadImage = (file, uploadData) => {
	return async (dispatch, getState) => {
		const { base64file, fileBuffer } = file;
		const { fileData, maxChunkSize, maxActualChunkSize, chunkingSupported, postKey } = uploadData;
		const fileName = fileData.uri.split("/").pop();
		const state = getState();
		const client = state.auth.client;
		const bufferPieces = [];
		const id = fileData.uri;
		let requiresChunking = false;

		dispatch(
			addUploadedImage({
				id,
				localFilename: fileData.uri,
				fileSize: fileBuffer.length,
				width: fileData.width,
				height: fileData.height
			})
		);

		dispatch(
			setUploadStatus({
				id,
				status: UPLOAD_STATUS.UPLOADING
			})
		);

		// If the file length is bigger than our acceptable chunk size AFTER base64 encoding, we need to chunk
		// if supported. If we can't chunk, we have to error for this file.
		if (fileBuffer.length > maxActualChunkSize) {
			if (chunkingSupported) {
				requiresChunking = true;
			} else {
				dispatch(
					setUploadStatus({
						id,
						status: UPLOAD_STATUS.ERROR,
						error: Lang.get("error_upload_space")
					})
				);
				return;
			}
		}

		if (requiresChunking) {
			// If we're chunking, then we slice the Buffer and reencode each piece as base64
			const bufLen = fileBuffer.length;
			let i = 0;

			while (i < bufLen) {
				const piece = fileBuffer.slice(i, (i += maxActualChunkSize));
				bufferPieces.push(piece.toString("base64"));
			}
		} else {
			bufferPieces.push(base64file);
		}

		try {
			const receivedData = await uploadFile(
				client,
				id,
				bufferPieces,
				{ name: fileName, postKey },
				(totalLoaded, totalSize) => {
					dispatch(
						setUploadProgress({
							id,
							progress: Math.min(Math.round((totalLoaded / totalSize) * 100), 100)
						})
					);
				},
				() => {
					const {
						editor: { attachedImages }
					} = getState();
					return attachedImages[id].status === UPLOAD_STATUS.ABORTED;
				}
			);

			dispatch(
				setUploadStatus({
					id,
					status: UPLOAD_STATUS.DONE,
					attachmentID: receivedData.mutateCore.uploadAttachment.id
				})
			);
		} catch (err) {
			console.log(`Error uploading image: ${err}`);

			dispatch(
				setUploadStatus({
					id,
					status: UPLOAD_STATUS.ERROR,
					error: Lang.get("error_upload_other")
				})
			);
		}
	};
};

const abortHandlers = {};

export const abortImageUpload = id => {
	return dispatch => {
		if (_.isFunction(abortHandlers[id])) {
			dispatch(
				setUploadStatus({
					id,
					status: UPLOAD_STATUS.ABORTED
				})
			);

			try {
				abortHandlers[id]();
			} catch (err) {
				console.log(`Failed to abort: ${err}`);
			}

			setTimeout(() => {
				LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
				dispatch(
					removeUploadedImage({
						id
					})
				);
			}, 1000);
		}
	};
};

/**
 * Handles uploading a file via a GQL mutation. Takes an array of pieces for chunking.
 *
 * @param 	{object} 			client 		The GQL client to use for the mutation
 * @param 	{array|string}		pieces 		The pieces to be uploaded
 * @param 	{object}			variables 	Any additional variables to be send with the mutation
 * @param 	{function}			onProgress 	A function that will be called when upload progress happens
 * @param 	{function} 			isAborted 	A function to be called for each piece to determine whether the upload is aborted
 * @return 	void
 */
const uploadFile = async (client, fileId, pieces, variables, onProgress, isAborted) => {
	if (!_.isArray(pieces)) {
		pieces = [pieces];
	}

	const totalSize = pieces.reduce((accumulator, currentValue) => accumulator + currentValue.length, 0);
	let totalLoaded = 0;
	let aborted = false;

	const sendMutation = async (contents, additionalParams = {}) => {
		let thisFileUploaded = 0;
		const { data } = await client.mutate({
			mutation: uploadMutation,
			variables: {
				...variables,
				...additionalParams,
				contents
			},
			context: {
				fetchOptions: {
					useUpload: true,
					onAbortPossible: fn => {
						abortHandlers[fileId] = fn;
					},
					onProgress: ev => {
						thisFileUploaded = ev.loaded;
						onProgress(totalLoaded + thisFileUploaded, totalSize);
					}
				}
			}
		});

		totalLoaded += thisFileUploaded;
		return data;
	};

	let data = {};

	if (pieces.length > 1) {
		let i = 1;
		for (let piece of pieces) {
			if (!isAborted()) {
				data = await sendMutation(piece, { totalChunks: pieces.length, chunk: i++, ref: data.ref || "" });
			} else {
				break;
			}
		}
	} else {
		if (!isAborted()) {
			data = await sendMutation(pieces[0], { ref: "" });
		}
	}

	return data;
};

/**
 * Delete an image
 *
 * @param 	{string|number} 		id 				The attachment id to delete
 * @return 	void
 */
export const deleteImageUpload = (id, attachmentID) => {
	return async (dispatch, getState) => {
		const state = getState();
		const client = state.auth.client;

		dispatch(
			setUploadStatus({
				id,
				status: UPLOAD_STATUS.REMOVING
			})
		);

		const { data } = await client.mutate({
			mutation: deleteMutation,
			variables: {
				id: attachmentID
			}
		});

		setTimeout(() => {
			LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
			dispatch(
				removeUploadedImage({
					id
				})
			);
		}, 1000);
	};
};
