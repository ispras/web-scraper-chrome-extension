import * as browser from 'webextension-polyfill';
import getContentScript from '../scripts/ContentScript';
import DataExtractor from '../scripts/DataExtractor';
import initVersionEventAPI from '../scripts/VersionEventAPI';
import './content_script.css';

browser.runtime.onMessage.addListener(request => {
	console.log('browser.runtime.onMessage', request);
	return new Promise(resolve => {
		if (request.extractData) {
			console.log('received data extraction request', request);
			const extractor = new DataExtractor(request);
			const deferredData = extractor.getData();
			deferredData.done(function (data) {
				console.log('dataextractor data', data);
				const { selectors } = extractor.sitemap;
				resolve(data, selectors);
			});
			return true;
		}
		if (request.previewSelectorData) {
			console.log('received data-preview extraction request', request);
			const extractor = new DataExtractor(request);
			const deferredData = extractor.getSingleSelectorData(
				request.parentSelectorIds,
				request.selectorId
			);
			deferredData.done(function (data) {
				console.log('dataextractor data', data);
				const { selectors } = extractor.sitemap;
				resolve(data, selectors);
			});
			return true;
		}
		// Universal ContentScript communication handler
		if (request.contentScriptCall) {
			const contentScript = getContentScript('ContentScript');

			console.log('received ContentScript request', request);

			const deferredResponse = contentScript[request.fn](request.request);
			deferredResponse.done(function (response) {
				resolve(response, null);
			});

			return true;
		}
	});
});

initVersionEventAPI();
