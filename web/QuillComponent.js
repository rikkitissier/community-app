import Quill from "quill/dist/quill.min.js";
import "quill/dist/quill.core.css";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import LinkBlot from "quill/formats/link";
import _ from "underscore";

const BROWSER = false;
const DEBUG = false;
const REMOTE_DEBUG = true;
const MESSAGE_PREFIX = "__IPS__";

const util = require("util");
const FORMATS = ["bold", "italic", "underline", "list"];
const HEIGHT_TIMEOUT = 500;

class QuillComponent extends Component {
	constructor(props) {
		super(props);
		this.state = {
			quill: null,
			debug: [],
			mentionCharPos: -1,
			range: {
				index: 0,
				length: 0
			},
			mentionRange: 0
		};

		this._timer = null;
		this._heightTimer = null;

		this.sendHeight = this.sendHeight.bind(this);
	}

	/**
	 * Component mounted
	 *
	 * @return 	void
	 */
	componentDidMount() {
		this._count = 0;
		this.waitForReady();
	}

	/**
	 * We want to allow the Native app to set the placeholder by injecting
	 * JS into this page. So we need to wait until it has indicated it is ready
	 * for our page to be initialized. If it's too slow, we'll just go anyway with a default.
	 *
	 * @return 	void
	 */
	waitForReady() {
		this._timer = setTimeout(() => {
			if (window._readyToGo || this._count == 50) {
				this._setUpEditor();
			} else {
				this._count++;
				this.waitForReady();
			}
		}, 10);
	}

	/**
	 * Create a new instance of Quill and store it in state.
	 * Once state saves, set up our event handlers and send a READY command.
	 *
	 * @return 	void
	 */
	_setUpEditor() {
		let placeholder = "Content";

		if (window._PLACEHOLDER !== undefined) {
			placeholder = window._PLACEHOLDER;
		}

		// Set up Quill
		this.setState(
			{
				quill: new Quill("#quill", {
					//bounds: "#container",
					scrollingContainer: "#container",
					placeholder
				})
			},
			() => {
				this.setUpEvents();
				this.sendMessage("READY");
			}
		);
	}

	/**
	 * Make sure we remove event handlers when unmounting
	 *
	 * @return 	void
	 */
	componentWillUnmount() {
		clearTimeout(this._timer);
		clearTimeout(this._heightTimer);
		document.removeEventListener("message", this.onMessage);
		window.removeEventListener("message", this.onMessage);
	}

	/**
	 * Set up our event handlers
	 *
	 * @return 	void
	 */
	setUpEvents() {
		// Add message event listener
		if (document) {
			document.addEventListener("message", this.onMessage.bind(this));
		}
		if (window) {
			window.addEventListener("message", this.onMessage.bind(this));
		}

		this.state.quill.on("selection-change", this.selectionChange.bind(this));
		this.state.quill.on("text-change", this.textChange.bind(this));

		// Start timer that sends document height
		this._heightTimer = setTimeout(this.sendHeight, HEIGHT_TIMEOUT);
	}

	getHeight() {
		// When this method is called, clear the timer we have running that sends the height
		// automatically. That means the timer acts as a fallback but won't fire if another
		// action has recently sent the height too.
		clearTimeout(this._heightTimer);
		this._heightTimer = setTimeout(this.sendHeight, HEIGHT_TIMEOUT);

		return document.getElementById("quill").offsetHeight - 40;
	}

	/**
	 * Sends the height of the document to the webview
	 *
	 * @return 	void
	 */
	sendHeight() {
		if (!this.state.quill) {
			return;
		}

		this.sendMessage("DOCUMENT_HEIGHT", {
			height: this.getHeight()
		});
	}

	/**
	 * Event handler; handles selection changes triggered by Quill
	 *
	 * @param 	object 		range 		New range
	 * @param 	object 		oldRange	Previous range
	 * @param 	string 		source 		Where the event came from (e.g. `user`)
	 * @return 	void
	 */
	selectionChange(range, oldRange, source) {
		// If range is null, that means the editor is not focused.
		if (range === null) {
			this.sendMessage("EDITOR_BLUR");
		} else {
			// Remember our range, so that we can insert content even if we lose focus
			this.setState({
				range: {
					index: range.index,
					length: range.length
				}
			});

			const selection = this.state.quill.getSelection();

			this.sendMessage("EDITOR_STATUS", {
				content: this.state.quill.container.querySelector(".ql-editor").innerHTML,
				mention: this.mentionState(),
				formatting: this.formattingState(selection),
				height: this.getHeight(),
				bounds: this.state.quill.getBounds(selection.index)
			});
		}
	}

	/**
	 * Handles text-change event sent from Quill
	 *
	 * @return 	void
	 */
	textChange(delta, oldDelta, source) {
		if (source === Quill.sources.USER) {
			const selection = this.state.quill.getSelection();

			this.sendMessage("EDITOR_STATUS", {
				content: this.state.quill.container.querySelector(".ql-editor").innerHTML,
				mention: this.mentionState(),
				formatting: this.formattingState(selection),
				height: this.getHeight(),
				bounds: this.state.quill.getBounds(selection.index)
			});
		}
	}

	/**
	 * Send current formatting message
	 *
	 * @return 	object
	 */
	formattingState(selection) {
		//this.addDebug(`formatting is ${JSON.stringify(this.state.quill.getFormat(this.state.quill.getSelection()))}`);
		return this.state.quill.getFormat(selection);
	}

	/**
	 * Our main postMessage event handler. Receives messages from the main app,
	 * and handles them as necessary.
	 *
	 * @return 	void
	 */
	onMessage(e) {
		try {
			const messageData = JSON.parse(e.data);

			if (messageData.hasOwnProperty("message") && messageData.message.startsWith(MESSAGE_PREFIX)) {
				const messageType = messageData.message.replace(MESSAGE_PREFIX, "");

				this.addDebug(`Received event: ${messageType}`);

				switch (messageType) {
					case "INSERT_STYLES":
						this.insertStyles(messageData);
						break;
					case "SET_FORMAT":
						this.setFormat(messageData);

						// After setting the format, send the current states back to ensure correct buttons are active
						this.sendMessage("FORMATTING", {
							formatState: this.state.quill.getFormat()
						});
						break;
					case "INSERT_LINK":
						this.insertLink(messageData);
						break;
					case "INSERT_MENTION":
						this.insertMention(messageData);
						break;
					case "INSERT_MENTION_SYMBOL":
						this.insertMentionSymbol();
						break;
					case "FOCUS":
						setTimeout(() => {
							this.state.quill.blur();
							this.state.quill.focus();
						}, 50);
						break;
					case "BLUR":
						setTimeout(() => {
							this.state.quill.blur();
						}, 50);
						break;
					case "TOGGLE_STATE":
						this.toggleState(messageData.enabled);
						break;
					case "GET_CONTENT":
						this.getText(messageData);
						break;
				}
			}
		} catch (err) {
			this.addDebug(err);
		}
	}

	/**
	 * Toggles the state of the editor (enabled/disabled)
	 *
	 * @param 	boolean 	enabled 	WHether the editor should be enabled
	 * @return 	void
	 */
	toggleState(enabled) {
		this.state.quill.enable(enabled);
	}

	/**
	 * Insert styles into our page, allowing the editor to inherit styles from the app
	 *
	 * @param 	string|array 		data 		Full CSS rule to insert - single as a string, multiple as an array
	 * @return 	void
	 */
	insertStyles(data) {
		this.addDebug("added styles: " + JSON.stringify(data.style));

		const sheet = this.getCustomStylesheet();

		if (_.isArray(data.style)) {
			for (let i = 0; i < data.style.length; i++) {
				this.addDebug(`insert rule: ${data.style[i]}`);
				sheet.insertRule(data.style[i]);
			}
		} else {
			this.addDebug(`insert rule: ${data.style}`);
			sheet.insertRule(data.style);
		}
	}

	/**
	 * Send the current editor contents to the main app
	 *
	 * @return 	void
	 */
	getText(data) {
		this.sendMessage("CONTENT", {
			content: this.state.quill.container.querySelector(".ql-editor").innerHTML
		});
	}

	/**
	 * Inserts a link into the editor
	 *
	 * @param 	object 	data 	Link data, used to build the link
	 * @return 	void
	 */
	insertLink(data) {
		// Todo: validate link/text

		const range = this.state.quill.getSelection(true);
		this.addDebug(`Range index before adding: ${range.index}, length: ${range.length}`);
		this.addDebug(`About to insert ${data.text} with link ${data.url}`);

		const delta = { ops: [] };

		if (range.index > 1) {
			delta.ops.push({
				retain: range.index
			});
		}

		delta.ops.push({
			insert: data.text,
			attributes: {
				link: data.url
			}
		});

		this.addDebug(delta);

		try {
			this.state.quill.updateContents(delta, "user");
			this.state.quill.setSelection(range.index + range.length + data.text.length, 0, "user");
		} catch (err) {
			this.addDebug(`Adding link failed: ${err}`);
		}

		this.addDebug(`Range index after adding: ${range.index + range.length + data.text.length}, length: 0`);

		this.setState({
			range: {
				index: range.index + range.length + data.text.length,
				length: 0
			}
		});
	}

	/**
	 * Insert a mention into the document at the current location
	 *
	 * @param 	object 		data 	Object containing mention data
	 * @return 	void
	 */
	insertMention(data) {
		const prevMentionCharPos = this.state.mentionCharPos;

		this.addDebug(`Inserting mention at pos ${this.state.mentionCharPos}, range is ${this.state.mentionRange}`);
		this.state.quill.deleteText(this.state.mentionCharPos, this.state.mentionRange - this.state.mentionCharPos, Quill.sources.API);
		this.state.quill.insertEmbed(
			prevMentionCharPos,
			"mention",
			{
				id: data.id,
				name: data.name,
				url: data.url
			},
			Quill.sources.API
		);
		this.state.quill.insertText(prevMentionCharPos + 1, " ", Quill.sources.API);
		this.state.quill.setSelection(prevMentionCharPos + 2, Quill.sources.SILENT);

		this.getText();
	}

	/**
	 * Return the current mention state, if any
	 *
	 * @return 	object|null
	 */
	mentionState() {
		const maxLength = 20;
		const range = this.state.quill.getSelection();
		const cursorPos = range.index;
		const startPos = Math.max(0, cursorPos - maxLength);
		const beforeCursorPos = this.state.quill.getText(startPos, cursorPos - startPos);
		const mentionCharIndex = beforeCursorPos.lastIndexOf("@");

		if (mentionCharIndex !== -1) {
			if (!(mentionCharIndex === 0 || !!beforeCursorPos[mentionCharIndex - 1].match(/\s/g))) {
				return null;
			}

			const mentionCharPos = cursorPos - beforeCursorPos.length + mentionCharIndex;
			const mentionText = beforeCursorPos.substring(mentionCharIndex + 1);

			if (mentionText.length) {
				this.setState({
					mentionCharPos,
					mentionRange: range.index
				});

				return {
					text: mentionText
				};
			}
		}

		return null;
	}

	/**
	 * Insert the @ symbol, to begin a mention
	 *
	 * @return 	void
	 */
	insertMentionSymbol() {
		const range = this.state.quill.getSelection();
		const previousCharacter = this.state.quill.getText(range.index - 1, 1);

		let character = "@";

		if (!previousCharacter.match(/\s/g)) {
			character = " " + character;
		}

		this.state.quill.insertText(range.index, character, Quill.sources.API);

		this.getText();
	}

	/**
	 * Set formatting in the document
	 *
	 * @param 	object 		data 	Object containing format 'type', and optional 'option'
	 * @return 	void
	 */
	setFormat(data) {
		this.state.quill.format(data.type, data.option || false, "user");
	}

	/**
	 * Send a message to the main app via postMessage
	 *
	 * @param 	string 		message 		The message code to send
	 * @param 	object 		data 			Object to be serialized and sent with the message
	 * @return 	void
	 */
	sendMessage(message, data = {}) {
		this.addDebug(`Sending ${message}`, false);

		const messageToSend = JSON.stringify({
			message: `${MESSAGE_PREFIX}${message}`,
			...data
		});

		try {
			// see https://github.com/expo/expo/issues/4463#issuecomment-499743757
			if (window.ReactABI33_0_0NativeWebView) {
				window.ReactABI33_0_0NativeWebView.postMessage(messageToSend);
			} else if (window.ReactNativeWebView) {
				window.ReactNativeWebView.postMessage(messageToSend);
			} else {
				throw new Error("No postMessage method available");
			}
		} catch (err) {
			this.addDebug(`Error sending message to window.ReactNativeWebView`);
		}

		/*if (document.hasOwnProperty("postMessage")) {
			document.postMessage(messageToSend, "*");
		} else if (window.hasOwnProperty("postMessage")) {
			window.postMessage(messageToSend, "*");
		} else {
			this.addDebug(`ERROR: unable to send message`, false);
		}*/
	}

	/**
	 * Debug helper
	 *
	 * @param 	object|string 		message 		Message to log
	 * @param 	boolean				sendRemotely	Send a DEBUG command to main app?
	 * @return 	void
	 */
	addDebug(message, sendRemotely = true) {
		if (DEBUG || REMOTE_DEBUG) {
			if (typeof message == "object") {
				message = util.inspect(message, { showHidden: false, depth: null });
			}

			if (DEBUG) {
				this.setState({
					debug: this.state.debug.concat(message)
				});
			}
			if (REMOTE_DEBUG && sendRemotely) {
				this.sendMessage("DEBUG", {
					debugMessage: message
				});
			}
		}
	}

	/**
	 * Returns our custom stylesheet, creating it if it doesn't exist
	 *
	 * @return 	Element
	 */
	getCustomStylesheet() {
		const newSheet = document.createElement("style");
		newSheet.setAttribute("type", "text/css");
		newSheet.appendChild(document.createTextNode(""));
		document.head.appendChild(newSheet);
		return newSheet.sheet;
	}

	render() {
		return (
			<React.Fragment>
				<div id="container">
					<div id="quill" style={{ fontSize: "16px" }} />
				</div>
			</React.Fragment>
		);
	}
}

/*
{DEBUG && (
					<div style={{ overflow: "auto", height: "50%" }}>
						<strong>Debug:</strong>
						<ul>
							{this.state.debug.map(message => (
								<li>{message}</li>
							))}
						</ul>
					</div>
				)}*/

export default QuillComponent;

// ========================================================
// MENTION BLOT
// ========================================================
const Embed = Quill.import("blots/embed"); // important, must import from quill rather than import as a JS module

class MentionBlot extends Embed {
	static create(data) {
		let node = super.create(data.name);

		node.setAttribute("class", "ipsMention");
		node.setAttribute("data-mentionid", data.id);
		node.setAttribute("href", data.url);
		node.innerHTML = " @" + data.name + " ";

		return node;
	}

	static value(domNode) {
		return {
			id: domNode.getAttribute("data-mentionid"),
			name: domNode.innerText,
			url: domNode.getAttribute("href")
		};
	}
}

MentionBlot.blotName = "mention";
MentionBlot.tagName = "a";

Quill.register(MentionBlot);
