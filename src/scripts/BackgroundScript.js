import * as browser from 'webextension-polyfill';

/**
 * ContentScript that can be called from anywhere within the extension
 */
let BackgroundScript = {
	dummy: function() {
		return $.Deferred()
			.resolve('dummy')
			.promise();
	},

	/**
	 * Returns the id of the tab that is visible to user
	 * @returns $.Deferred() integer
	 */
	getActiveTabId: function() {
		return new Promise((resolve, reject) => {
			browser.tabs
				.query({
					active: true,
					currentWindow: true,
				})
				.then(function(tabs) {
					if (tabs.length < 1) {
						// @TODO must be running within popup. maybe find another active window?
						reject("couldn't find the active tab");
					} else {
						let tabId = tabs[0].id;
						resolve(tabId);
					}
				});
		});
	},

	/**
	 * Execute a function within the active tab within content script
	 * @param request.fn	function to call
	 * @param request.request	request that will be passed to the function
	 */
	executeContentScript: function(request) {
		var reqToContentScript = {
			contentScriptCall: true,
			fn: request.fn,
			request: request.request,
		};
		var deferredResponse = $.Deferred();
		this.getActiveTabId().then(function(tabId) {
			browser.tabs.sendMessage(tabId, reqToContentScript).then(function(response) {
				deferredResponse.resolve(response);
			});
		});

		return deferredResponse;
	},
};

/**
 * @param location	configure from where the content script is being accessed (ContentScript, BackgroundPage, DevTools)
 * @returns BackgroundScript
 */
export default function getBackgroundScript(location) {
	// Handle calls from different places
	if (location === 'BackgroundScript') {
		return BackgroundScript;
	} else if (location === 'DevTools' || location === 'ContentScript') {
		// if called within background script proxy calls to content script
		var backgroundScript = {};

		Object.keys(BackgroundScript).forEach(function(attr) {
			if (typeof BackgroundScript[attr] === 'function') {
				backgroundScript[attr] = function(request) {
					var reqToBackgroundScript = {
						backgroundScriptCall: true,
						fn: attr,
						request: request,
					};

					var deferredResponse = $.Deferred();

					browser.runtime.sendMessage(reqToBackgroundScript).then(function(response) {
						deferredResponse.resolve(response);
					});

					return deferredResponse;
				};
			} else {
				backgroundScript[attr] = BackgroundScript[attr];
			}
		});

		return backgroundScript;
	} else {
		throw 'Invalid BackgroundScript initialization - ' + location;
	}
}
