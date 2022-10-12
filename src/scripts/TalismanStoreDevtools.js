import * as browser from 'webextension-polyfill';
import StoreDevtools from './StoreDevtools';

export default class TalismanStoreDevtools extends StoreDevtools {
	constructor(storageType) {
		super(storageType);
		this.supportAuth = true;
	}

	async isAuthorized() {
		const request = {
			isAuthorized: true,
		};
		return await browser.runtime.sendMessage(request);
	}

	async authorize(credential) {
		const request = {
			login: true,
			credential: credential,
		};
		return await browser.runtime.sendMessage(request);
	}

	async logOut() {
		const request = {
			logOut: true,
		};
		return await browser.runtime.sendMessage(request);
	}
}
