import * as browser from 'webextension-polyfill';
import StoreDevtools from './StoreDevtools';

/**
 * From devtools panel there is no possibility to execute XHR requests. So all requests to a remote CouchDb must be
 * handled through Background page. StoreDevtools is a simply a proxy store
 * @constructor
 */
export default class TalismanStoreDevtools extends StoreDevtools {
	constructor(storageType) {
		super(storageType);
		this.supportAuth = true;
	}

	async isAuthorized() {
		let request = {
			isAuthorized: true,
		};
		return await browser.runtime.sendMessage(request);
	}

	async authorize(credential) {
		let request = {
			login: true,
			credential: credential,
		};
		return await browser.runtime.sendMessage(request);
	}

	async logOut() {
		let request = {
			logOut: true,
		};
		return await browser.runtime.sendMessage(request);
	}
}
