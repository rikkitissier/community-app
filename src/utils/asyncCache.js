import { AsyncStorage } from "react-native";
import _ from "underscore";

const TTL = 259200; // 3 days

class AsyncCache {
	constructor() {
		this._data = null;
	}

	/**
	 * Return the data for the given type/scope, or null if not found
	 *
	 * @param 		string 		type	The type key
	 * @param 		string 		scope	The scope of the data (e.g. community url)
	 * @return 		mixed | null
	 */
	async getData(type, scope) {
		const data = await this._fetchDataFromStorage();

		if (!_.isUndefined(data[scope]) && !_.isUndefined(data[scope][type]) && !this.isExpired(data[scope][type])) {
			return data[scope][type].data;
		}

		return null;
	}

	/**
	 * Returns all the data associated with the scope
	 *
	 * @param 		string 		scope	The scope of the data (e.g. community url)
	 * @return 		mixed | null
	 */
	async getDataForScope(scope) {
		const data = await this._fetchDataFromStorage();

		if (_.isUndefined(data[scope])) {
			return null;
		}

		const entries = Object.entries(data[scope]);
		const toReturn = {};

		for (const cachedObject of entries) {
			if (!this.isExpired(cachedObject[1])) {
				toReturn[cachedObject[0]] = cachedObject[1].data;
			}
		}

		if (_.size(toReturn)) {
			return toReturn;
		}

		return null;
	}

	/**
	 * Set new data for the given type/scope
	 *
	 * @param 		mixed 		content 	The content to store
	 * @param 		string 		type		The type key
	 * @param 		string 		scope		The scope of the data (e.g. community url)
	 * @param 		number 		ttl 		How long to keep this data (in seconds).
	 * @return 		void
	 */
	async setData(content, type, scope, ttl = TTL) {
		const data = await this._fetchDataFromStorage();

		if (_.isUndefined(data[scope])) {
			data[scope] = {};
		}

		data[scope][type] = {
			data: content,
			created: Math.floor(Date.now() / 1000),
			ttl
		};

		this._writeStorage(data);
	}

	/**
	 * Remove data at the given type/scope
	 *
	 * @param 		string 		type	The type key
	 * @param 		string 		scope	The scope of the data (e.g. community url)
	 * @return 		void
	 */
	async removeData(type, scope) {
		const data = await this._fetchDataFromStorage();

		if (!_.isUndefined(data[scope]) && !_.isUndefined(data[scope][type])) {
			delete data[scope][type];
		}

		if (!_.size(data[scope])) {
			delete data[scope];
		}

		this._writeStorage(data);
	}

	/**
	 * Removes all data assocated with a particular scope
	 *
	 * @param 		string 		scope	The scope of the data (e.g. community url)
	 * @return 		void
	 */
	async removeScope(scope) {
		const data = await this._fetchDataFromStorage();

		if (!_.isUndefined(data[scope])) {
			delete data[scope];
		}

		this._writeStorage(data);
	}

	/**
	 * Returns a boolean indicating whether the given data has expired
	 *
	 * @param 		object 		A data object containing created and ttl keys
	 * @return 		boolean
	 */
	isExpired(data) {
		if (_.isUndefined(data) || _.isUndefined(data.created) || _.isUndefined(data.ttl)) {
			throw new Error("Created date and/or ttl missing");
		}

		return !(Math.floor(Date.now() / 1000) - data.created < data.ttl);
	}

	/**
	 * Removes all expired data from the cache
	 *
	 * @return 		void
	 */
	async removeAllExpired() {
		const data = await this._fetchDataFromStorage();

		if (data === null || !_.size(data)) {
			return;
		}

		const entries = Object.entries(data);
		let hasModified = false;

		for (const scope of entries) {
			const siteData = Object.entries(scope[1]);

			for (const cachedObject of siteData) {
				if (this.isExpired(cachedObject[1])) {
					delete data[scope[0]][cachedObject[0]];
					hasModified = true;
				}
			}
		}

		if (hasModified) {
			this._writeStorage(data);
		}
	}

	/**
	 * Fetch the cache from AsyncStorage, or return it immediately if already fetched
	 *
	 * @param 		boolean 	forceRefresh	Should the data be fetched from AsyncStorage again?
	 * @return 		object
	 */
	async _fetchDataFromStorage(forceRefresh = false) {
		if (this._data !== null && !forceRefresh) {
			return this._data;
		}

		let data = {};

		try {
			const cachedData = await AsyncStorage.getItem("@cachedData");

			if (cachedData !== null) {
				data = JSON.parse(cachedData);
			}
		} catch (err) {}

		this._data = data;
		return this._data;
	}

	/**
	 * Write the given data to the AsyncStorage cache
	 *
	 * @param 		object 		data	The data to write
	 * @return 		void
	 */
	async _writeStorage(data) {
		try {
			await AsyncStorage.setItem("@cachedData", JSON.stringify(data));
		} catch (err) {}
	}
}

const asyncCache = new AsyncCache();
asyncCache.removeAllExpired();

export default asyncCache;
