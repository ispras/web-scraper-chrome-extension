import Config from '../scripts/Config';
import StorePouchDB from '../scripts/StorePouchDB';
import StoreRestApi from '../scripts/StoreRestApi';
import Sitemap from '../scripts/Sitemap';
import getBackgroundScript from '../scripts/BackgroundScript';

const config = new Config();
let store;

config.loadConfiguration().then(() => {
	console.log('initial configuration', config);
	if (config.storageType === 'rest') {
		store = new StoreRestApi(config);
	} else {
		store = new StorePouchDB(config);
	}
});

browser.storage.onChanged.addListener(function() {
	config.loadConfiguration().then(() => {
		console.log('configuration changed', config);
		if (config.storageType === 'rest') {
			store = new StoreRestApi(config);
		} else {
			store = new StorePouchDB(config);
		}
	});
});

let sendToActiveTab = function(request, callback) {
	browser.tabs
		.query({
			active: true,
			currentWindow: true,
		})
		.then(function(tabs) {
			if (tabs.length < 1) {
				this.console.log("couldn't find active tab");
			} else {
				let tab = tabs[0];
				browser.tabs.sendMessage(tab.id, request).then(callback);
			}
		});
};

browser.runtime.onMessage.addListener((request, sender) => {
	console.log('browser.runtime.onMessage', request);

	if (request.createSitemap) {
		return store.createSitemap(request.sitemap);
	} else if (request.saveSitemap) {
		return store.saveSitemap(request.sitemap);
	} else if (request.deleteSitemap) {
		return store.deleteSitemap(request.sitemap);
	} else if (request.getAllSitemaps) {
		return store.getAllSitemaps();
	} else if (request.sitemapExists) {
		return store.sitemapExists(request.sitemapId);
	} else if (request.getSitemapData) {
		return store.getSitemapData(new Sitemap(request.sitemap));
	} else if (request.scrapeSitemap) {
		let sitemap = new Sitemap(request.sitemap);
		let queue = new Queue();
		let browser_tab = new ChromePopupBrowser({
			pageLoadDelay: request.pageLoadDelay,
		});

		let scraper = new Scraper({
			queue: queue,
			sitemap: sitemap,
			browser: browser_tab,
			store: store,
			requestInterval: request.requestInterval,
			requestIntervalRandomness: request.requestIntervalRandomness,
		});

		let response = new Promise(() => {
			try {
				scraper.run(function() {
					browser_tab.close();
					let notification = browser.notifications
						.create('scraping-finished', {
							type: 'basic',
							iconUrl: 'assets/images/icon128.png',
							title: 'Scraping finished!',
							message: 'Finished scraping ' + sitemap._id,
						})
						.then(function(id) {
							// notification showed
						});
					// table selector can dynamically add columns (addMissingColumns Feature)
					let selectors = sitemap.selectors;
					response.resolve(selectors);
				});
			} catch (e) {
				console.log('Scraper execution cancelled', e);
			}
		});

		return response;
	} else if (request.previewSelectorData) {
		browser.tabs
			.query({
				active: true,
				currentWindow: true,
			})
			.then(function(tabs) {
				if (tabs.length < 1) {
					this.console.log("couldn't find active tab");
					return Promise.resolve();
				} else {
					let tab = tabs[0];
					return browser.tabs.sendMessage(tab.id, request);
				}
			});
	} else if (request.backgroundScriptCall) {
		let backgroundScript = getBackgroundScript('BackgroundScript');
		let deferredResponse = backgroundScript[request.fn](request.request);

		let response = new Promise(() => {
			deferredResponse.done(function(resp) {
				response.resolve(response);
			});
		});

		return response;
	}
});
