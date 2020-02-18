// import "../assets/jquery-2.0.3.js";
// import "../../assets/papaparse.min.js";
// import "../../assets/jquery.whencallsequentially.js";
// import "../../assets/sugar-1.4.1.js";
// import "../../assets/css-selector/lib/CssSelector.js";
// import "../../assets/base64.js";
// import "../scripts/DataExtractor.js";
// import "../scripts/ContentSelector.js";
// import "../scripts/Selector.js";
// import "../scripts/ElementQuery.js";
// import "../scripts/UniqueElementList.js";
// import "../scripts/Selector/SelectorElement.js";
// import "../scripts/Selector/SelectorGroup.js";
// import "../scripts/Selector/SelectorLink.js";
// import "../scripts/Selector/SelectorPopupLink.js";
// import "../scripts/Selector/SelectorText.js";
// import "../scripts/Selector/SelectorValue.js";
// import "../scripts/Selector/SelectorImage.js";
// import "../scripts/Selector/SelectorHTML.js";
// import "../scripts/Selector/SelectorElementAttribute.js";
// import "../scripts/Selector/SelectorElementStyle.js";
// import "../scripts/Selector/SelectorTable.js";
// import "../scripts/Selector/SelectorElementScroll.js";
// import "../scripts/Selector/SelectorElementClick.js";
// import "../scripts/SelectorList.js";
// import "../scripts/Sitemap.js";
// import "../scripts/ContentScript.js";
// import "../scripts/BackgroundScript.js";
import DataExtractor from '../scripts/DataExtractor';
import './content_script.css';

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log('chrome.runtime.onMessage', request);

	if (request.extractData) {
		console.log('received data extraction request', request);
		let extractor = new DataExtractor(request);
		let deferredData = extractor.getData();
		deferredData.done(function(data) {
			console.log('dataextractor data', data);
			let selectors = extractor.sitemap.selectors;
			sendResponse(data, selectors);
		});
		return true;
	} else if (request.previewSelectorData) {
		console.log('received data-preview extraction request', request);
		let extractor = new DataExtractor(request);
		let deferredData = extractor.getSingleSelectorData(request.parentSelectorIds, request.selectorId);
		deferredData.done(function(data) {
			console.log('dataextractor data', data);
			let selectors = extractor.sitemap.selectors;
			sendResponse(data, selectors);
		});
		return true;
	}
	// Universal ContentScript communication handler
	else if (request.contentScriptCall) {
		let contentScript = getContentScript('ContentScript');

		console.log('received ContentScript request', request);

		let deferredResponse = contentScript[request.fn](request.request);
		deferredResponse.done(function(response) {
			sendResponse(response, null);
		});

		return true;
	}
});
