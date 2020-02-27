import Config from '../scripts/Config';
import StorePouchDB from '../scripts/StorePouchDB';
import StoreRestApi from '../scripts/StoreRestApi';
import Sitemap from '../scripts/Sitemap';
import Queue from '../scripts/Queue';
import ChromePopupBrowser from '../scripts/ChromePopupBrowser';
import Scraper from '../scripts/Scraper';
import getBackgroundScript from '../scripts/BackgroundScript';
import * as browser from 'webextension-polyfill';

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
		return store.getSitemapData(Sitemap.sitemapFromObj(request.sitemap));
	} else if (request.scrapeSitemap) {
		let sitemap = Sitemap.sitemapFromObj(request.sitemap);
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
			pageLoadDelay: request.pageLoadDelay,
		});

		return new Promise(resolve => {
			try {
				scraper.run(function() {
					browser_tab.close();
					browser.notifications.create('scraping-finished', {
						type: 'basic',
						iconUrl: 'assets/images/icon128.png',
						title: 'Scraping finished!',
						message: 'Finished scraping ' + sitemap._id,
					});
					// table selector can dynamically add columns (addMissingColumns Feature)
					resolve(sitemap.selectors);
				});
			} catch (e) {
				console.log('Scraper execution cancelled', e);
			}
		});
	} else if (request.previewSelectorData) {
		return new Promise(resolve => {
			browser.tabs
				.query({
					active: true,
					currentWindow: true,
				})
				.then(function(tabs) {
					if (tabs.length < 1) {
						this.console.log("couldn't find active tab");
						return resolve();
					} else {
						let tab = tabs[0];
						browser.tabs.sendMessage(tab.id, request).then(extractedData => {
							resolve(extractedData);
						});
					}
				});
		});
	} else if (request.backgroundScriptCall) {
		return new Promise(resolve => {
			let backgroundScript = getBackgroundScript('BackgroundScript');
			//TODO change to promises
			let deferredResponse = backgroundScript[request.fn](request.request);
			deferredResponse.done(function(resp) {
				resolve(resp);
			});
		});
	}
});
