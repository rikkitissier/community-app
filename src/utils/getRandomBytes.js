import * as Random from "expo-random";
import Base64 from "Base64";

export default async function getRandomBytes(length = 128) {
	const code = await Random.getRandomBytesAsync(128);
	const asBase64 = Base64.btoa(code);

	return asBase64.substring(0, length);
}
