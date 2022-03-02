import _ from "underscore";

const globalErrors = {
	NO_PERMISSION: "You don't have permission to do that.",
	INVALID_ID: "There was a problem loading that content.",
	INVALID_REACTION: "Invalid reaction chosen."
};

export default function getErrorMessage(err, componentErrors = {}) {
	let errors = Object.assign({}, globalErrors, componentErrors);

	if (!_.isUndefined(err.graphQLErrors) && err.graphQLErrors.length) {
		// Is this an error returned by Apollo?
		if (!_.isUndefined(errors[err.graphQLErrors[0].message])) {
			return errors[err.graphQLErrors[0].message] || err.graphQLErrors[0].message;
		}
	} else if (!_.isUndefined(err.message) && err.message.startsWith("GraphQL error:")) {
		// Is this an exception object?
		return errors[err.message.replace("GraphQL error: ", "")] || err.message;
	} else if (_.isString(err) && err.startsWith("GraphQL error:")) {
		// Is this an exception message?
		return errors[err.replace("GraphQL error: ", "")] || err;
	} else if (!_.isUndefined(errors[err])) {
		// Maybe just an error key?
		return errors[err];
	}

	return "error";
}
