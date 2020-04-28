import * as browser from 'webextension-polyfill';

export default class ChromePopupBrowser {
	constructor(options) {
		this.pageLoadDelay = options.pageLoadDelay;
		// @TODO somehow handle the closed window
	}

	_initPopupWindow(callback, scope) {
		let popup_browser = this;
		if (this.window !== undefined) {
			console.log(JSON.stringify(this.window));
			// check if tab exists
			browser.tabs.get(this.tab.id).then(function(tab) {
				if (!tab) {
					throw 'Scraping window closed';
				}
			});

			callback.call(scope);
			return;
		}
		let createWindowOptions = {
			type: 'popup',
			width: 1042,
			height: 768,
			url: 'browser://newtab',
		};

		browser.windows.create(createWindowOptions).then(function(window) {
			popup_browser.window = window;
			popup_browser.tab = window.tabs[0];
			callback.call(scope);
		});
	}

	loadUrl(url, callback) {
		var tab = this.tab;

		var tabLoadListener = function(tabId, changeInfo, tab) {
			if (tabId === this.tab.id) {
				if (changeInfo.status === 'complete') {
					// @TODO check url ? maybe it would be bad because some sites might use redirects

					// remove event listener
					browser.tabs.onUpdated.removeListener(tabLoadListener);

					// callback tab is loaded after page load delay
					setTimeout(callback, this.pageLoadDelay);
				}
			}
		}.bind(this);
		browser.tabs.onUpdated.addListener(tabLoadListener);

		browser.tabs.update(tab.id, { url: url });
	}

	close() {
		browser.windows.remove(this.window.id);
	}

	fetchData(url, sitemap, parentSelectorId, callback, scope) {
		var current_browser = this;

		this._initPopupWindow(function() {
			var tab = current_browser.tab;

			current_browser.loadUrl(
				url,
				function() {
					var message = {
						extractData: true,
						sitemap: JSON.parse(JSON.stringify(sitemap)),
						parentSelectorId: parentSelectorId,
					};

					browser.tabs.sendMessage(tab.id, message).then(function(data, selectors) {
						console.log('extracted data from web page', data);

						if (selectors && scope) {
							// table selector can dynamically add columns (addMissingColumns Feature)
							scope.scraper.sitemap.selectors = selectors;
						}

						callback.call(scope, data);
					});
				}.bind(this)
			);
		}, this);
	}

	downloadFile(url, savePath) {
		return browser.downloads.download({
			url: url,
			filename: savePath,
		});
	}
}
