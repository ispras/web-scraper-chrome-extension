import getContentScript from '../scripts/ContentScript';
import DataExtractor from '../scripts/DataExtractor';
import initVersionEventAPI from "../scripts/VersionEventAPI";
import * as browser from 'webextension-polyfill';
import './content_script.css';

browser.runtime.onMessage.addListener(request => {
	console.log('browser.runtime.onMessage', request);
	return new Promise(resolve => {
		if (request.extractData) {
			console.log('received data extraction request', request);
			let extractor = new DataExtractor(request);
			let deferredData = extractor.getData();
			deferredData.done(function (data) {
				console.log('dataextractor data', data);
				let selectors = extractor.sitemap.selectors;
				resolve(data, selectors);
			});
			return true;
		} else if (request.previewSelectorData) {
			console.log('received data-preview extraction request', request);
			let extractor = new DataExtractor(request);
			let deferredData = extractor.getSingleSelectorData(
				request.parentSelectorIds,
				request.selectorId
			);
			deferredData.done(function (data) {
				console.log('dataextractor data', data);
				let selectors = extractor.sitemap.selectors;
				resolve(data, selectors);
			});
			return true;
		}
		// Universal ContentScript communication handler
		else if (request.contentScriptCall) {
			let contentScript = getContentScript('ContentScript');

			console.log('received ContentScript request', request);

			let deferredResponse = contentScript[request.fn](request.request);
			deferredResponse.done(function (response) {
				resolve(response, null);
			});

			return true;
		}
	});
});

initVersionEventAPI();
