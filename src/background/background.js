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
import urlJoin from 'url-join';

const config = new Config();
let store;

async function talismanAuthListener(responseDetails) {
	async function reloadTabs() {
		const openTabs = await browser.tabs.query({ url: urlJoin(config.talismanApiUrl, '/*') });
		openTabs.forEach(tab => {
			if (tab.id !== responseDetails.tabId) {
				browser.tabs.reload(tab.id);
			}
		});
	}

	const loginUrl = urlJoin(config.talismanApiUrl, '/oauth/login');
	const logoutUrl = urlJoin(config.talismanApiUrl, '/oauth/logout');
	if (responseDetails.url === loginUrl || responseDetails.url === logoutUrl) {
		await reloadTabs();
		if (responseDetails.tabId !== -1) {
			await browser.runtime.sendMessage({ authStatusChanged: true });
		}
	}
}

function setStore() {
	browser.webRequest.onCompleted.removeListener(talismanAuthListener);
	if (config.storageType === 'rest') {
		store = new StoreRestApi(config, config.restUrl);
	} else if (config.storageType === 'talisman') {
		store = new StoreTalismanApi(config, config.talismanApiUrl);
		browser.webRequest.onCompleted.addListener(talismanAuthListener, {
			urls: [urlJoin(config.talismanApiUrl, '/oauth/*')],
		});
	} else {
		store = new StorePouchDB(config);
	}
}

config.loadConfiguration().then(() => {
	console.log('initial configuration', config);
	setStore();
});

browser.storage.onChanged.addListener(function () {
	config.loadConfiguration().then(async () => {
		console.log('configuration changed', config);
		setStore();
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
	if (request.getStandName) {
		return store.standName;
	}

	if (request.getStorageType) {
		return store.constructor.name;
	}

	if (request.login) {
		return store.initTalismanLogin(request.credential);
	}

	if (request.logOut) {
		return await store.logOut();
	}

	if (request.isAuthorized) {
		const storeData = await store.isAuthorized();
		return storeData ? { data: storeData } : false;
	}

	if (request.createSitemap) {
		if (request.projectId) {
			return store.createSitemap(request.sitemap, request.projectId);
		}
		return store.createSitemap(request.sitemap);
	}

	if (request.saveSitemap) {
		if (request.projectId) {
			return store.saveSitemap(request.sitemap, request.previousSitemapId, request.projectId);
		}
		return store.saveSitemap(request.sitemap, request.previousSitemapId);
	}

	if (request.deleteSitemap) {
		if (request.projectId) {
			return store.deleteSitemap(request.sitemap, request.projectId);
		}
		return store.deleteSitemap(request.sitemap);
	}

	if (request.getAllSitemaps) {
		if (request.projectId) {
			return store.getAllSitemaps(request.projectId);
		}
		return store.getAllSitemaps();
	}

	if (request.getAllProjects) {
		return store.getAllProjects();
	}

	if (request.sitemapExists) {
		if (request.projectId) {
			return store.sitemapExists(request.sitemapId, request.projectId);
		}
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
			startUrl: request.startUrl,
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
