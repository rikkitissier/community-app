export default function getRandomString(length = 24) {
	return [...Array(length)].map(i => (~~(Math.random() * 36)).toString(36)).join("");
}
