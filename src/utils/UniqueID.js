export default function uniqueID(obj) {
	return '_' + Math.random().toString(36).substr(2, 9);;
}