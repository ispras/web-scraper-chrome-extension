import * as browser from 'webextension-polyfill';
import Config from '../scripts/Config';
import StorePouchDB from '../scripts/StorePouchDB';
import StoreRestApi from '../scripts/StoreRestApi';
import StoreTalismanApi from '../scripts/StoreTalismanApi';
import Sitemap from '../scripts/Sitemap';
import Queue from '../scripts/Queue';
import ChromePopupBrowser from '../scripts/ChromePopupBrowser';
import Scraper from '../scripts/Scraper';
import getBackgroundScript from '../scripts/BackgroundScript';

const config = new Config();
let store;

config.loadConfiguration().then(() => {
	console.log('initial configuration', config);
	if (config.storageType === 'rest') {
		store = new StoreRestApi(config);
	} else if (config.storageType === 'talisman') {
		store = new StoreTalismanApi(config);
	} else {
		store = new StorePouchDB(config);
	}
});

browser.storage.onChanged.addListener(function () {
	config.loadConfiguration().then(async () => {
		console.log('configuration changed', config);
		if (config.storageType === 'rest') {
			store = new StoreRestApi(config);
		} else if (config.storageType === 'talisman') {
			store = new StoreTalismanApi(config);
		} else {
			store = new StorePouchDB(config);
		}

		function _handleResponse(message) {
			alert(`Message from the background script:  ${message.response}`);
		}

		function _handleError(error) {
			alert(`Error: ${error}`);
		}
	});
});

const sendToActiveTab = function (request, callback) {
	browser.tabs
		.query({
			active: true,
			currentWindow: true,
		})
		.then(tabs => {
			if (tabs.length < 1) {
				this.console.log("couldn't find active tab");
			} else {
				const tab = tabs[0];
				browser.tabs.sendMessage(tab.id, request).then(callback).catch(callback);
			}
		});
};

browser.runtime.onMessage.addListener(async request => {
	if (request.login) {
		if (store.constructor.name === 'StoreTalismanApi') {
			let loginStatus = await store.initTalismanLogin(request.credential).catch(er => {
				return er;
			});
			if (loginStatus.isAxiosError || loginStatus.data.access_token === undefined) {
				return {
					authStatus: {
						success: false,
						status: loginStatus.status,
						message: loginStatus.message,
					},
				};
			} else {
				config.credential = { username: request.credential.username };
				store.postInit(loginStatus.data.access_token);
				let tToken = loginStatus.data.access_token;
				store.axiosInstance.defaults.headers['Authorization'] = 'Bearer ' + tToken;
				return {
					authStatus: {
						success: true,
						username: request.credential.username,
					},
				};
			}
		}
	}

	if (request.logOut) {
		await store.logOut();
	}

	if (request.isAuthorized) {
		if (store.constructor.name === 'StoreTalismanApi') {
			return {
				data: await store.isAuthorized(),
				storeType: store.constructor.name,
			};
		} else {
			return true;
		}
	}

	if (request.createSitemap) {
		return store.createSitemap(request.sitemap);
	}

	if (request.saveSitemap) {
		return store.saveSitemap(request.sitemap);
	}

	if (request.deleteSitemap) {
		return store.deleteSitemap(request.sitemap);
	}

	if (request.getAllSitemaps) {
		return store.getAllSitemaps();
	}

	if (request.sitemapExists) {
		return store.sitemapExists(request.sitemapId);
	}

	if (request.getSitemapData) {
		return store.getSitemapData(Sitemap.sitemapFromObj(request.sitemap));
	}

	if (request.scrapeSitemap) {
		const sitemap = Sitemap.sitemapFromObj(request.sitemap);
		const queue = new Queue();
		const browserTab = new ChromePopupBrowser({
			pageLoadDelay: request.pageLoadDelay,
		});

		const scraper = new Scraper({
			queue,
			sitemap,
			browser: browserTab,
			store,
			requestInterval: request.requestInterval,
			requestIntervalRandomness: request.requestIntervalRandomness,
			pageLoadDelay: request.pageLoadDelay,
		});

		return new Promise(resolve => {
			try {
				scraper.run(function () {
					browserTab.close();
					browser.notifications.create('scraping-finished', {
						type: 'basic',
						iconUrl: 'assets/images/icon128.png',
						title: 'Scraping finished!',
						message: `Finished scraping ${sitemap._id}`,
					});
					// table selector can dynamically add columns (addMissingColumns Feature)
					resolve(sitemap.selectors);
				});
			} catch (e) {
				console.log('Scraper execution cancelled', e);
			}
		});
	}

	if (request.previewSelectorData) {
		const tabs = await browser.tabs.query({ active: true, currentWindow: true });
		if (tabs.length < 1) {
			this.console.log("couldn't find active tab");
		} else {
			const tab = tabs[0];
			return browser.tabs.sendMessage(tab.id, request);
		}
	} else if (request.backgroundScriptCall) {
		return new Promise((resolve, reject) => {
			const backgroundScript = getBackgroundScript('BackgroundScript');
			// TODO change to promises
			const deferredResponse = backgroundScript[request.fn](request.request);
			deferredResponse.done(resolve).catch(reject);
		});
	}
});
