import * as $ from 'jquery';
import getBackgroundScript from './BackgroundScript';
import ContentSelector from './ContentSelector';

/**
 * ContentScript that can be called from anywhere within the extension
 */
const ContentScript = {
	/**
	 * Fetch
	 * @param request.CSSSelector	css selector as string
	 * @returns $.Deferred()
	 */
	getHTML(request) {
		const html = $(request.CSSSelector).clone().wrap('<p>').parent().html();
		return Promise.resolve(html);
	},

	/**
	 * Removes current content selector if is in use within the page
	 * @returns $.Deferred()
	 */
	removeCurrentContentSelector() {
		const contentSelector = window.cs;
		if (contentSelector === undefined) {
			return Promise.resolve();
		}
		contentSelector.removeGUI();
		window.cs = undefined;
		return Promise.resolve();
	},

	/**
	 * Select elements within the page
	 * @param request.parentCSSSelector
	 * @param request.allowedElements
	 */
	selectSelector(request) {
		return new Promise((resolve, reject) => {
			this.removeCurrentContentSelector().then(
				function () {
					const contentSelector = new ContentSelector({
						parentCSSSelector: request.parentCSSSelector,
						allowedElements: request.allowedElements,
					});
					window.cs = contentSelector;

					const deferredCSSSelector = contentSelector.getCSSSelector();
					deferredCSSSelector
						.then(
							function (response) {
								this.removeCurrentContentSelector().then(function () {
									resolve(response);
									window.cs = undefined;
								});
							}.bind(this)
						)
						.catch(function (message) {
							reject(message);
							window.cs = undefined;
						});
				}.bind(this)
			);
		});
	},

	/**
	 * Preview elements
	 * @param request.parentCSSSelector
	 * @param request.elementCSSSelector
	 */
	previewSelector(request) {
		return new Promise((resolve, reject) => {
			this.removeCurrentContentSelector().then(function () {
				const contentSelector = new ContentSelector({
					parentCSSSelector: request.parentCSSSelector,
				});
				window.cs = contentSelector;

				const deferredSelectorPreview = contentSelector.previewSelector(
					request.elementCSSSelector
				);
				deferredSelectorPreview
					.then(function () {
						resolve();
					})
					.catch(function (message) {
						reject(message);
						window.cs = undefined;
					});
			});
		});
	},
};

/**
 *
 * @param location	configure from where the content script is being accessed (ContentScript, BackgroundPage, DevTools)
 * @param backgroundScript	BackgroundScript client
 * @returns ContentScript
 */
export default function getContentScript(location) {
	let contentScript;

	// Handle calls from different places
	if (location === 'ContentScript') {
		contentScript = ContentScript;
		contentScript.backgroundScript = getBackgroundScript('ContentScript');
		return contentScript;
	}
	if (location === 'BackgroundScript' || location === 'DevTools') {
		const backgroundScript = getBackgroundScript(location);

		// if called within background script proxy calls to content script
		contentScript = {};
		Object.keys(ContentScript).forEach(function (attr) {
			if (typeof ContentScript[attr] === 'function') {
				contentScript[attr] = function (request) {
					const reqToContentScript = {
						contentScriptCall: true,
						fn: attr,
						request,
					};

					return backgroundScript.executeContentScript(reqToContentScript);
				};
			} else {
				contentScript[attr] = ContentScript[attr];
			}
		});
		contentScript.backgroundScript = backgroundScript;
		return contentScript;
	}
	throw `Invalid ContentScript initialization - ${location}`;
}
