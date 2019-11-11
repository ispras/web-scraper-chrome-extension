chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {

		console.log("chrome.runtime.onMessage", request);

		if (request.extractData) {
			console.log("received data extraction request", request);
			var extractor = new DataExtractor(request);
			var deferredData = extractor.getData();
			deferredData.done(function(data){
                console.log("dataextractor data", data);
                var selectors = extractor.sitemap.selectors;
                sendResponse(data, selectors);
			});
			return true;
		}
		else if(request.previewSelectorData) {
			console.log("received data-preview extraction request", request);
			var extractor = new DataExtractor(request);
			var deferredData = extractor.getSingleSelectorData(request.parentSelectorIds, request.selectorId);
			deferredData.done(function(data){
                console.log("dataextractor data", data);
                var selectors = extractor.sitemap.selectors;
                sendResponse(data, selectors);
			});
			return true;
		}
		// Universal ContentScript communication handler
		else if(request.contentScriptCall) {

			var contentScript = getContentScript("ContentScript");

			console.log("received ContentScript request", request);

			var deferredResponse = contentScript[request.fn](request.request);
            deferredResponse.done(function (response) {
                sendResponse(response, null);
			});

			return true;
		}
	}
);

var logLevels = {
	"none": 0,
	"error": 1,
	"info": 2
};

// Defines the current log level. Values other than "none" are for debugging
// only and should at no point be checked in.
var currentLogLevel = logLevels.info;

// change rss
var new_style = ".-sitemap-parent {\n" +
	"\toutline: 2px #FFCC33 solid !important;\n" +
	"    background-color: rgba(255, 204, 51, 0.20) !important;\n" +
	"\tbackground: rgba(255, 204, 51, 0.20) !important;\n" +
	"}\n" +
	"\n" +
	".-sitemap-parent * {\n" +
	"    background-color: rgba(255, 204, 51, 0.20) !important;\n" +
	"\tbackground: rgba(255, 204, 51, 0.20) !important;\n" +
	"}\n" +
	"\n" +
	".-sitemap-select-item-hover {\n" +
	"\toutline: 2px solid green !important;\n" +
	"    background-color: rgba(0, 213, 0, 0.20) !important;\n" +
	"\tbackground: rgba(0, 213, 0, 0.20) !important;\n" +
	"}\n" +
	"\n" +
	".-sitemap-select-item-hover * {\n" +
	"    background-color: rgba(0, 213, 0, 0.20) !important;\n" +
	"\tbackground: rgba(0, 213, 0, 0.20) !important;\n" +
	"}\n" +
	"\n" +
	".-sitemap-select-item-selected {\n" +
	"\toutline: 2px solid #C70000 !important;\n" +
	"    background-color: rgba(213, 0, 0, 0.2) !important;\n" +
	"\tbackground: rgba(213, 0, 0, 0.2) !important;\n" +
	"}\n" +
	"\n" +
	".-sitemap-select-item-selected * {\n" +
	"    background-color: rgba(213, 0, 0, 0.2) !important;\n" +
	"\tbackground: rgba(213, 0, 0, 0.2) !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar {\n" +
	"\toutline:1px red solid;\n" +
	"}\n" +
	"\n" +
	"/**\n" +
	" * reset all css values for a div\n" +
	" * http://jsfiddle.net/Gb89Y/2/\n" +
	" * after loading css with this script you need to fix width, height\n" +
	" */\n" +
	"#-selector-toolbar, #-selector-toolbar div {\n" +
	"\talign-content: stretch !important;\n" +
	"\talign-items: stretch !important;\n" +
	"\talign-self: stretch !important;\n" +
	"\talignment-baseline: auto !important;\n" +
	"\tbackground: rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box !important;\n" +
	"\tbackground-attachment: scroll !important;\n" +
	"\tbackground-clip: border-box !important;\n" +
	"\tbackground-color: rgba(0, 0, 0, 0) !important;\n" +
	"\tbackground-image: none !important;\n" +
	"\tbackground-origin: padding-box !important;\n" +
	"\tbackground-position: 0% 0% !important;\n" +
	"\tbackground-position-x: 0% !important;\n" +
	"\tbackground-position-y: 0% !important;\n" +
	"\tbackground-repeat: repeat !important;\n" +
	"\tbackground-size: auto !important;\n" +
	"\tbaseline-shift: baseline !important;\n" +
	"\tborder: 0px none rgb(0, 0, 0) !important;\n" +
	"\tborder-bottom: 0px none rgb(0, 0, 0) !important;\n" +
	"\tborder-bottom-color: rgb(0, 0, 0) !important;\n" +
	"\tborder-bottom-left-radius: 0px !important;\n" +
	"\tborder-bottom-right-radius: 0px !important;\n" +
	"\tborder-bottom-style: none !important;\n" +
	"\tborder-bottom-width: 0px !important;\n" +
	"\tborder-collapse: separate !important;\n" +
	"\tborder-color: rgb(0, 0, 0) !important;\n" +
	"\tborder-image: none !important;\n" +
	"\tborder-image-outset: 0px !important;\n" +
	"\tborder-image-repeat: stretch !important;\n" +
	"\tborder-image-slice: 100% !important;\n" +
	"\tborder-image-source: none !important;\n" +
	"\tborder-image-width: 1 !important;\n" +
	"\tborder-left: 0px none rgb(0, 0, 0) !important;\n" +
	"\tborder-left-color: rgb(0, 0, 0) !important;\n" +
	"\tborder-left-style: none !important;\n" +
	"\tborder-left-width: 0px !important;\n" +
	"\tborder-radius: 0px !important;\n" +
	"\tborder-right: 0px none rgb(0, 0, 0) !important;\n" +
	"\tborder-right-color: rgb(0, 0, 0) !important;\n" +
	"\tborder-right-style: none !important;\n" +
	"\tborder-right-width: 0px !important;\n" +
	"\tborder-spacing: 0px 0px !important;\n" +
	"\tborder-style: none !important;\n" +
	"\tborder-top: 0px none rgb(0, 0, 0) !important;\n" +
	"\tborder-top-color: rgb(0, 0, 0) !important;\n" +
	"\tborder-top-left-radius: 0px !important;\n" +
	"\tborder-top-right-radius: 0px !important;\n" +
	"\tborder-top-style: none !important;\n" +
	"\tborder-top-width: 0px !important;\n" +
	"\tborder-width: 0px !important;\n" +
	"\tbottom: auto !important;\n" +
	"\tbox-shadow: none !important;\n" +
	"\tbox-sizing: content-box !important;\n" +
	"\tbuffered-rendering: auto !important;\n" +
	"\tcaption-side: top !important;\n" +
	"\tclear: none !important;\n" +
	"\tclip: auto !important;\n" +
	"\tclip-path: none !important;\n" +
	"\tclip-rule: nonzero !important;\n" +
	"\tcolor: rgb(0, 0, 0) !important;\n" +
	"\tcolor-interpolation: srgb !important;\n" +
	"\tcolor-interpolation-filters: linearrgb !important;\n" +
	"\tcolor-rendering: auto !important;\n" +
	"\tcursor: auto !important;\n" +
	"\tdirection: ltr !important;\n" +
	"\tdisplay: block !important;\n" +
	"\tdominant-baseline: auto !important;\n" +
	"\tempty-cells: show !important;\n" +
	"\tfill: rgb(0, 0, 0) !important;\n" +
	"\tfill-opacity: 1 !important;\n" +
	"\tfill-rule: nonzero !important;\n" +
	"\tfilter: none !important;\n" +
	"\tflex: 0 1 auto !important;\n" +
	"\tflex-basis: auto !important;\n" +
	"\tflex-direction: row !important;\n" +
	"\tflex-flow: row nowrap !important;\n" +
	"\tflex-grow: 0 !important;\n" +
	"\tflex-shrink: 1 !important;\n" +
	"\tflex-wrap: nowrap !important;\n" +
	"\tfloat: none !important;\n" +
	"\tflood-color: rgb(0, 0, 0) !important;\n" +
	"\tflood-opacity: 1 !important;\n" +
	"\tfont: normal normal normal 16px/normal 'Times New Roman' !important;\n" +
	"\tfont-family: 'Times New Roman' !important;\n" +
	"\tfont-kerning: auto !important;\n" +
	"\tfont-size: 16px !important;\n" +
	"\tfont-style: normal !important;\n" +
	"\tfont-variant: normal !important;\n" +
	"\tfont-variant-ligatures: normal !important;\n" +
	"\tfont-weight: normal !important;\n" +
	"\tglyph-orientation-horizontal: 0deg !important;\n" +
	"\tglyph-orientation-vertical: auto !important;\n" +
	"\theight: auto !important;\n" +
	"\timage-rendering: auto !important;\n" +
	"\tjustify-content: flex-start !important;\n" +
	"\tkerning: 0 !important;\n" +
	"\tleft: auto !important;\n" +
	"\tletter-spacing: normal !important;\n" +
	"\tlighting-color: rgb(255, 255, 255) !important;\n" +
	"\tline-height: normal !important;\n" +
	"\tlist-style: disc outside none !important;\n" +
	"\tlist-style-image: none !important;\n" +
	"\tlist-style-position: outside !important;\n" +
	"\tlist-style-type: disc !important;\n" +
	"\tmargin: 0px !important;\n" +
	"\tmargin-bottom: 0px !important;\n" +
	"\tmargin-left: 0px !important;\n" +
	"\tmargin-right: 0px !important;\n" +
	"\tmargin-top: 0px !important;\n" +
	"\tmarker-end: none !important;\n" +
	"\tmarker-mid: none !important;\n" +
	"\tmarker-start: none !important;\n" +
	"\tmask: none !important;\n" +
	"\tmask-type: luminance !important;\n" +
	"\tmax-height: none !important;\n" +
	"\tmax-width: none !important;\n" +
	"\tmin-height: 0px !important;\n" +
	"\tmin-width: 0px !important;\n" +
	"\tobject-fit: fill !important;\n" +
	"\tobject-position: 50% 50% !important;\n" +
	"\topacity: 1 !important;\n" +
	"\torder: 0 !important;\n" +
	"\torphans: auto !important;\n" +
	"\toutline: rgb(0, 0, 0) none 0px !important;\n" +
	"\toutline-color: rgb(0, 0, 0) !important;\n" +
	"\toutline-offset: 0px !important;\n" +
	"\toutline-style: none !important;\n" +
	"\toutline-width: 0px !important;\n" +
	"\toverflow: visible !important;\n" +
	"\toverflow-wrap: normal !important;\n" +
	"\toverflow-x: visible !important;\n" +
	"\toverflow-y: visible !important;\n" +
	"\tpadding: 0px !important;\n" +
	"\tpadding-bottom: 0px !important;\n" +
	"\tpadding-left: 0px !important;\n" +
	"\tpadding-right: 0px !important;\n" +
	"\tpadding-top: 0px !important;\n" +
	"\tpage-break-after: auto !important;\n" +
	"\tpage-break-before: auto !important;\n" +
	"\tpage-break-inside: auto !important;\n" +
	"\tpointer-events: auto !important;\n" +
	"\tposition: static !important;\n" +
	"\tresize: none !important;\n" +
	"\tright: auto !important;\n" +
	"\tshape-rendering: auto !important;\n" +
	"\tspeak: normal !important;\n" +
	"\tstop-color: rgb(0, 0, 0) !important;\n" +
	"\tstop-opacity: 1 !important;\n" +
	"\tstroke: none !important;\n" +
	"\tstroke-dasharray: none !important;\n" +
	"\tstroke-dashoffset: 0 !important;\n" +
	"\tstroke-linecap: butt !important;\n" +
	"\tstroke-linejoin: miter !important;\n" +
	"\tstroke-miterlimit: 4 !important;\n" +
	"\tstroke-opacity: 1 !important;\n" +
	"\tstroke-width: 1 !important;\n" +
	"\ttab-size: 8 !important;\n" +
	"\ttable-layout: auto !important;\n" +
	"\ttext-align: start !important;\n" +
	"\ttext-anchor: start !important;\n" +
	"\ttext-decoration: none solid rgb(0, 0, 0) !important;\n" +
	"\ttext-indent: 0px !important;\n" +
	"\ttext-overflow: clip !important;\n" +
	"\ttext-rendering: auto !important;\n" +
	"\ttext-shadow: none !important;\n" +
	"\ttext-transform: none !important;\n" +
	"\ttop: auto !important;\n" +
	"\ttransition: all 0s ease 0s !important;\n" +
	"\ttransition-delay: 0s !important;\n" +
	"\ttransition-duration: 0s !important;\n" +
	"\ttransition-property: all !important;\n" +
	"\ttransition-timing-function: ease !important;\n" +
	"\tunicode-bidi: normal !important;\n" +
	"\tvector-effect: none !important;\n" +
	"\tvertical-align: baseline !important;\n" +
	"\tvisibility: visible !important;\n" +
	"\t-webkit-animation: none 0s ease 0s 1 normal none running !important;\n" +
	"\t-webkit-animation-delay: 0s !important;\n" +
	"\t-webkit-animation-direction: normal !important;\n" +
	"\t-webkit-animation-duration: 0s !important;\n" +
	"\t-webkit-animation-fill-mode: none !important;\n" +
	"\t-webkit-animation-iteration-count: 1 !important;\n" +
	"\t-webkit-animation-name: none !important;\n" +
	"\t-webkit-animation-play-state: running !important;\n" +
	"\t-webkit-animation-timing-function: ease !important;\n" +
	"\t-webkit-app-region: no-drag !important;\n" +
	"\t-webkit-appearance: none !important;\n" +
	"\t-webkit-aspect-ratio: none !important;\n" +
	"\t-webkit-backface-visibility: visible !important;\n" +
	"\t-webkit-background-clip: border-box !important;\n" +
	"\t-webkit-background-composite: source-over !important;\n" +
	"\t-webkit-background-origin: padding-box !important;\n" +
	"\t-webkit-background-size: auto !important;\n" +
	"\t-webkit-border-after: 0px none rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-after-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-after-style: none !important;\n" +
	"\t-webkit-border-after-width: 0px !important;\n" +
	"\t-webkit-border-before: 0px none rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-before-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-before-style: none !important;\n" +
	"\t-webkit-border-before-width: 0px !important;\n" +
	"\t-webkit-border-end: 0px none rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-end-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-end-style: none !important;\n" +
	"\t-webkit-border-end-width: 0px !important;\n" +
	"\t-webkit-border-fit: border !important;\n" +
	"\t-webkit-border-horizontal-spacing: 0px !important;\n" +
	"\t-webkit-border-image: none !important;\n" +
	"\t-webkit-border-start: 0px none rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-start-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-start-style: none !important;\n" +
	"\t-webkit-border-start-width: 0px !important;\n" +
	"\t-webkit-border-vertical-spacing: 0px !important;\n" +
	"\t-webkit-box-align: stretch !important;\n" +
	"\t-webkit-box-decoration-break: slice !important;\n" +
	"\t-webkit-box-direction: normal !important;\n" +
	"\t-webkit-box-flex: 0 !important;\n" +
	"\t-webkit-box-flex-group: 1 !important;\n" +
	"\t-webkit-box-lines: single !important;\n" +
	"\t-webkit-box-ordinal-group: 1 !important;\n" +
	"\t-webkit-box-orient: horizontal !important;\n" +
	"\t-webkit-box-pack: start !important;\n" +
	"\t-webkit-box-reflect: none !important;\n" +
	"\t-webkit-box-shadow: none !important;\n" +
	"\t-webkit-clip-path: none !important;\n" +
	"\t-webkit-column-axis: auto !important;\n" +
	"\t-webkit-column-break-after: auto !important;\n" +
	"\t-webkit-column-break-before: auto !important;\n" +
	"\t-webkit-column-break-inside: auto !important;\n" +
	"\t-webkit-column-count: auto !important;\n" +
	"\t-webkit-column-gap: normal !important;\n" +
	"\t-webkit-column-progression: normal !important;\n" +
	"\t-webkit-column-rule: 0px none rgb(0, 0, 0) !important;\n" +
	"\t-webkit-column-rule-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-column-rule-style: none !important;\n" +
	"\t-webkit-column-rule-width: 0px !important;\n" +
	"\t-webkit-column-span: none !important;\n" +
	"\t-webkit-column-width: auto !important;\n" +
	"\t-webkit-columns: auto auto !important;\n" +
	"\t-webkit-filter: none !important;\n" +
	"\t-webkit-font-feature-settings: normal !important;\n" +
	"\t-webkit-font-smoothing: auto !important;\n" +
	"\t-webkit-highlight: none !important;\n" +
	"\t-webkit-hyphenate-character: auto !important;\n" +
	"\t-webkit-line-box-contain: block inline replaced !important;\n" +
	"\t-webkit-line-break: auto !important;\n" +
	"\t-webkit-line-clamp: none !important;\n" +
	"\t-webkit-locale: auto !important;\n" +
	"\t-webkit-logical-height: auto !important;\n" +
	"\t-webkit-logical-width: auto !important;\n" +
	"\t-webkit-margin-after: 0px !important;\n" +
	"\t-webkit-margin-after-collapse: collapse !important;\n" +
	"\t-webkit-margin-before: 0px !important;\n" +
	"\t-webkit-margin-before-collapse: collapse !important;\n" +
	"\t-webkit-margin-bottom-collapse: collapse !important;\n" +
	"\t-webkit-margin-end: 0px !important;\n" +
	"\t-webkit-margin-start: 0px !important;\n" +
	"\t-webkit-margin-top-collapse: collapse !important;\n" +
	"\t-webkit-mask-box-image: none !important;\n" +
	"\t-webkit-mask-box-image-outset: 0px !important;\n" +
	"\t-webkit-mask-box-image-repeat: stretch !important;\n" +
	"\t-webkit-mask-box-image-slice: 0 fill !important;\n" +
	"\t-webkit-mask-box-image-source: none !important;\n" +
	"\t-webkit-mask-box-image-width: auto !important;\n" +
	"\t-webkit-mask-clip: border-box !important;\n" +
	"\t-webkit-mask-composite: source-over !important;\n" +
	"\t-webkit-mask-image: none !important;\n" +
	"\t-webkit-mask-origin: border-box !important;\n" +
	"\t-webkit-mask-position: 0% 0% !important;\n" +
	"\t-webkit-mask-position-x: 0% !important;\n" +
	"\t-webkit-mask-position-y: 0% !important;\n" +
	"\t-webkit-mask-repeat: repeat !important;\n" +
	"\t-webkit-mask-size: auto !important;\n" +
	"\t-webkit-max-logical-height: none !important;\n" +
	"\t-webkit-max-logical-width: none !important;\n" +
	"\t-webkit-min-logical-height: 0px !important;\n" +
	"\t-webkit-min-logical-width: 0px !important;\n" +
	"\t-webkit-padding-after: 0px !important;\n" +
	"\t-webkit-padding-before: 0px !important;\n" +
	"\t-webkit-padding-end: 0px !important;\n" +
	"\t-webkit-padding-start: 0px !important;\n" +
	"\t-webkit-perspective: none !important;\n" +
	"\t-webkit-perspective-origin: 396px 0px !important;\n" +
	"\t-webkit-print-color-adjust: economy !important;\n" +
	"\t-webkit-rtl-ordering: logical !important;\n" +
	"\t-webkit-ruby-position: before !important;\n" +
	"\t-webkit-tap-highlight-color: rgba(0, 0, 0, 0.180392) !important;\n" +
	"\t-webkit-text-combine: none !important;\n" +
	"\t-webkit-text-decorations-in-effect: none !important;\n" +
	"\t-webkit-text-emphasis-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-text-emphasis-position: over !important;\n" +
	"\t-webkit-text-emphasis-style: none !important;\n" +
	"\t-webkit-text-fill-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-text-orientation: vertical-right !important;\n" +
	"\t-webkit-text-security: none !important;\n" +
	"\t-webkit-text-stroke-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-text-stroke-width: 0px !important;\n" +
	"\t-webkit-transform: none !important;\n" +
	"\t-webkit-transform-origin: 396px 0px !important;\n" +
	"\t-webkit-transform-style: flat !important;\n" +
	"\t-webkit-transition: all 0s ease 0s !important;\n" +
	"\t-webkit-transition-delay: 0s !important;\n" +
	"\t-webkit-transition-duration: 0s !important;\n" +
	"\t-webkit-transition-property: all !important;\n" +
	"\t-webkit-transition-timing-function: ease !important;\n" +
	"\t-webkit-user-drag: auto !important;\n" +
	"\t-webkit-user-modify: read-only !important;\n" +
	"\t-webkit-user-select: text !important;\n" +
	"\t-webkit-writing-mode: horizontal-tb !important;\n" +
	"\twhite-space: normal !important;\n" +
	"\twidows: auto !important;\n" +
	"\twidth: auto !important;\n" +
	"\tword-break: normal !important;\n" +
	"\tword-spacing: 0px !important;\n" +
	"\tword-wrap: normal !important;\n" +
	"\twriting-mode: lr-tb !important;\n" +
	"\tz-index: auto !important;\n" +
	"\tzoom: 1 !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar:after, #-selector-toolbar:before, #-selector-toolbar *:after, #-selector-toolbar *:before {\n" +
	"\tcontent: \"\";\n" +
	"\tdisplay: none;\n" +
	"\tbox-sizing: border-box;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar input {\n" +
	"\talign-content: stretch !important;\n" +
	"\talign-items: stretch !important;\n" +
	"\talign-self: stretch !important;\n" +
	"\talignment-baseline: auto !important;\n" +
	"\tbackground: rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box !important;\n" +
	"\tbackground-attachment: scroll !important;\n" +
	"\tbackground-clip: border-box !important;\n" +
	"\tbackground-color: rgba(0, 0, 0, 0) !important;\n" +
	"\tbackground-image: none !important;\n" +
	"\tbackground-origin: padding-box !important;\n" +
	"\tbackground-position: 0% 0% !important;\n" +
	"\tbackground-position-x: 0% !important;\n" +
	"\tbackground-position-y: 0% !important;\n" +
	"\tbackground-repeat: repeat !important;\n" +
	"\tbackground-size: auto !important;\n" +
	"\tbaseline-shift: baseline !important;\n" +
	"\tborder: 0px none rgb(0, 0, 0) !important;\n" +
	"\tborder-bottom: 0px none rgb(0, 0, 0) !important;\n" +
	"\tborder-bottom-color: rgb(0, 0, 0) !important;\n" +
	"\tborder-bottom-left-radius: 0px !important;\n" +
	"\tborder-bottom-right-radius: 0px !important;\n" +
	"\tborder-bottom-style: none !important;\n" +
	"\tborder-bottom-width: 0px !important;\n" +
	"\tborder-collapse: separate !important;\n" +
	"\tborder-color: rgb(0, 0, 0) !important;\n" +
	"\tborder-image: none !important;\n" +
	"\tborder-image-outset: 0px !important;\n" +
	"\tborder-image-repeat: stretch !important;\n" +
	"\tborder-image-slice: 100% !important;\n" +
	"\tborder-image-source: none !important;\n" +
	"\tborder-image-width: 1 !important;\n" +
	"\tborder-left: 0px none rgb(0, 0, 0) !important;\n" +
	"\tborder-left-color: rgb(0, 0, 0) !important;\n" +
	"\tborder-left-style: none !important;\n" +
	"\tborder-left-width: 0px !important;\n" +
	"\tborder-radius: 0px !important;\n" +
	"\tborder-right: 0px none rgb(0, 0, 0) !important;\n" +
	"\tborder-right-color: rgb(0, 0, 0) !important;\n" +
	"\tborder-right-style: none !important;\n" +
	"\tborder-right-width: 0px !important;\n" +
	"\tborder-spacing: 0px 0px !important;\n" +
	"\tborder-style: none !important;\n" +
	"\tborder-top: 0px none rgb(0, 0, 0) !important;\n" +
	"\tborder-top-color: rgb(0, 0, 0) !important;\n" +
	"\tborder-top-left-radius: 0px !important;\n" +
	"\tborder-top-right-radius: 0px !important;\n" +
	"\tborder-top-style: none !important;\n" +
	"\tborder-top-width: 0px !important;\n" +
	"\tborder-width: 0px !important;\n" +
	"\tbottom: auto !important;\n" +
	"\tbox-shadow: none !important;\n" +
	"\tbox-sizing: border-box !important;\n" +
	"\tbuffered-rendering: auto !important;\n" +
	"\tcaption-side: top !important;\n" +
	"\tclear: none !important;\n" +
	"\tclip: auto !important;\n" +
	"\tclip-path: none !important;\n" +
	"\tclip-rule: nonzero !important;\n" +
	"\tcolor: rgb(0, 0, 0) !important;\n" +
	"\tcolor-interpolation: srgb !important;\n" +
	"\tcolor-interpolation-filters: linearrgb !important;\n" +
	"\tcolor-rendering: auto !important;\n" +
	"\tcursor: auto !important;\n" +
	"\tdirection: ltr !important;\n" +
	"\tdisplay: inline-block !important;\n" +
	"\tdominant-baseline: auto !important;\n" +
	"\tempty-cells: show !important;\n" +
	"\tfill: rgb(0, 0, 0) !important;\n" +
	"\tfill-opacity: 1 !important;\n" +
	"\tfill-rule: nonzero !important;\n" +
	"\tfilter: none !important;\n" +
	"\tflex: 0 1 auto !important;\n" +
	"\tflex-basis: auto !important;\n" +
	"\tflex-direction: row !important;\n" +
	"\tflex-flow: row nowrap !important;\n" +
	"\tflex-grow: 0 !important;\n" +
	"\tflex-shrink: 1 !important;\n" +
	"\tflex-wrap: nowrap !important;\n" +
	"\tfloat: none !important;\n" +
	"\tflood-color: rgb(0, 0, 0) !important;\n" +
	"\tflood-opacity: 1 !important;\n" +
	"\tfont: normal normal normal 13px/normal Arial !important;\n" +
	"\tfont-family: Arial !important;\n" +
	"\tfont-kerning: auto !important;\n" +
	"\tfont-size: 13px !important;\n" +
	"\tfont-style: normal !important;\n" +
	"\tfont-variant: normal !important;\n" +
	"\tfont-variant-ligatures: normal !important;\n" +
	"\tfont-weight: normal !important;\n" +
	"\tglyph-orientation-horizontal: 0deg !important;\n" +
	"\tglyph-orientation-vertical: auto !important;\n" +
	"\theight: 13px !important;\n" +
	"\timage-rendering: auto !important;\n" +
	"\tjustify-content: flex-start !important;\n" +
	"\tkerning: 0 !important;\n" +
	"\tleft: auto !important;\n" +
	"\tletter-spacing: normal !important;\n" +
	"\tlighting-color: rgb(255, 255, 255) !important;\n" +
	"\tline-height: normal !important;\n" +
	"\tlist-style: disc outside none !important;\n" +
	"\tlist-style-image: none !important;\n" +
	"\tlist-style-position: outside !important;\n" +
	"\tlist-style-type: disc !important;\n" +
	"\tmargin: 3px 3px 3px 4px !important;\n" +
	"\tmargin-bottom: 3px !important;\n" +
	"\tmargin-left: 4px !important;\n" +
	"\tmargin-right: 3px !important;\n" +
	"\tmargin-top: 3px !important;\n" +
	"\tmarker-end: none !important;\n" +
	"\tmarker-mid: none !important;\n" +
	"\tmarker-start: none !important;\n" +
	"\tmask: none !important;\n" +
	"\tmask-type: luminance !important;\n" +
	"\tmax-height: none !important;\n" +
	"\tmax-width: none !important;\n" +
	"\tmin-height: 0px !important;\n" +
	"\tmin-width: 0px !important;\n" +
	"\tobject-fit: fill !important;\n" +
	"\tobject-position: 50% 50% !important;\n" +
	"\topacity: 1 !important;\n" +
	"\torder: 0 !important;\n" +
	"\torphans: auto !important;\n" +
	"\toutline: rgb(0, 0, 0) none 0px !important;\n" +
	"\toutline-color: rgb(0, 0, 0) !important;\n" +
	"\toutline-offset: 0px !important;\n" +
	"\toutline-style: none !important;\n" +
	"\toutline-width: 0px !important;\n" +
	"\toverflow: visible !important;\n" +
	"\toverflow-wrap: normal !important;\n" +
	"\toverflow-x: visible !important;\n" +
	"\toverflow-y: visible !important;\n" +
	"\tpadding: 0px !important;\n" +
	"\tpadding-bottom: 0px !important;\n" +
	"\tpadding-left: 0px !important;\n" +
	"\tpadding-right: 0px !important;\n" +
	"\tpadding-top: 0px !important;\n" +
	"\tpage-break-after: auto !important;\n" +
	"\tpage-break-before: auto !important;\n" +
	"\tpage-break-inside: auto !important;\n" +
	"\tpointer-events: auto !important;\n" +
	"\tposition: static !important;\n" +
	"\tresize: none !important;\n" +
	"\tright: auto !important;\n" +
	"\tshape-rendering: auto !important;\n" +
	"\tspeak: normal !important;\n" +
	"\tstop-color: rgb(0, 0, 0) !important;\n" +
	"\tstop-opacity: 1 !important;\n" +
	"\tstroke: none !important;\n" +
	"\tstroke-dasharray: none !important;\n" +
	"\tstroke-dashoffset: 0 !important;\n" +
	"\tstroke-linecap: butt !important;\n" +
	"\tstroke-linejoin: miter !important;\n" +
	"\tstroke-miterlimit: 4 !important;\n" +
	"\tstroke-opacity: 1 !important;\n" +
	"\tstroke-width: 1 !important;\n" +
	"\ttab-size: 8 !important;\n" +
	"\ttable-layout: auto !important;\n" +
	"\ttext-align: start !important;\n" +
	"\ttext-anchor: start !important;\n" +
	"\ttext-decoration: none solid rgb(0, 0, 0) !important;\n" +
	"\ttext-indent: 0px !important;\n" +
	"\ttext-overflow: clip !important;\n" +
	"\ttext-rendering: auto !important;\n" +
	"\ttext-shadow: none !important;\n" +
	"\ttext-transform: none !important;\n" +
	"\ttop: auto !important;\n" +
	"\ttransition: all 0s ease 0s !important;\n" +
	"\ttransition-delay: 0s !important;\n" +
	"\ttransition-duration: 0s !important;\n" +
	"\ttransition-property: all !important;\n" +
	"\ttransition-timing-function: ease !important;\n" +
	"\tunicode-bidi: normal !important;\n" +
	"\tvector-effect: none !important;\n" +
	"\tvertical-align: baseline !important;\n" +
	"\tvisibility: visible !important;\n" +
	"\t-webkit-animation: none 0s ease 0s 1 normal none running !important;\n" +
	"\t-webkit-animation-delay: 0s !important;\n" +
	"\t-webkit-animation-direction: normal !important;\n" +
	"\t-webkit-animation-duration: 0s !important;\n" +
	"\t-webkit-animation-fill-mode: none !important;\n" +
	"\t-webkit-animation-iteration-count: 1 !important;\n" +
	"\t-webkit-animation-name: none !important;\n" +
	"\t-webkit-animation-play-state: running !important;\n" +
	"\t-webkit-animation-timing-function: ease !important;\n" +
	"\t-webkit-app-region: no-drag !important;\n" +
	"\t-webkit-appearance: checkbox !important;\n" +
	"\t-webkit-aspect-ratio: none !important;\n" +
	"\t-webkit-backface-visibility: visible !important;\n" +
	"\t-webkit-background-clip: border-box !important;\n" +
	"\t-webkit-background-composite: source-over !important;\n" +
	"\t-webkit-background-origin: padding-box !important;\n" +
	"\t-webkit-background-size: auto !important;\n" +
	"\t-webkit-border-after: 0px none rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-after-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-after-style: none !important;\n" +
	"\t-webkit-border-after-width: 0px !important;\n" +
	"\t-webkit-border-before: 0px none rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-before-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-before-style: none !important;\n" +
	"\t-webkit-border-before-width: 0px !important;\n" +
	"\t-webkit-border-end: 0px none rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-end-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-end-style: none !important;\n" +
	"\t-webkit-border-end-width: 0px !important;\n" +
	"\t-webkit-border-fit: border !important;\n" +
	"\t-webkit-border-horizontal-spacing: 0px !important;\n" +
	"\t-webkit-border-image: none !important;\n" +
	"\t-webkit-border-start: 0px none rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-start-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-border-start-style: none !important;\n" +
	"\t-webkit-border-start-width: 0px !important;\n" +
	"\t-webkit-border-vertical-spacing: 0px !important;\n" +
	"\t-webkit-box-align: stretch !important;\n" +
	"\t-webkit-box-decoration-break: slice !important;\n" +
	"\t-webkit-box-direction: normal !important;\n" +
	"\t-webkit-box-flex: 0 !important;\n" +
	"\t-webkit-box-flex-group: 1 !important;\n" +
	"\t-webkit-box-lines: single !important;\n" +
	"\t-webkit-box-ordinal-group: 1 !important;\n" +
	"\t-webkit-box-orient: horizontal !important;\n" +
	"\t-webkit-box-pack: start !important;\n" +
	"\t-webkit-box-reflect: none !important;\n" +
	"\t-webkit-box-shadow: none !important;\n" +
	"\t-webkit-clip-path: none !important;\n" +
	"\t-webkit-column-axis: auto !important;\n" +
	"\t-webkit-column-break-after: auto !important;\n" +
	"\t-webkit-column-break-before: auto !important;\n" +
	"\t-webkit-column-break-inside: auto !important;\n" +
	"\t-webkit-column-count: auto !important;\n" +
	"\t-webkit-column-gap: normal !important;\n" +
	"\t-webkit-column-progression: normal !important;\n" +
	"\t-webkit-column-rule: 0px none rgb(0, 0, 0) !important;\n" +
	"\t-webkit-column-rule-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-column-rule-style: none !important;\n" +
	"\t-webkit-column-rule-width: 0px !important;\n" +
	"\t-webkit-column-span: none !important;\n" +
	"\t-webkit-column-width: auto !important;\n" +
	"\t-webkit-columns: auto auto !important;\n" +
	"\t-webkit-filter: none !important;\n" +
	"\t-webkit-font-feature-settings: normal !important;\n" +
	"\t-webkit-font-smoothing: auto !important;\n" +
	"\t-webkit-highlight: none !important;\n" +
	"\t-webkit-hyphenate-character: auto !important;\n" +
	"\t-webkit-line-box-contain: block inline replaced !important;\n" +
	"\t-webkit-line-break: auto !important;\n" +
	"\t-webkit-line-clamp: none !important;\n" +
	"\t-webkit-locale: auto !important;\n" +
	"\t-webkit-logical-height: 13px !important;\n" +
	"\t-webkit-logical-width: 13px !important;\n" +
	"\t-webkit-margin-after: 3px !important;\n" +
	"\t-webkit-margin-after-collapse: collapse !important;\n" +
	"\t-webkit-margin-before: 3px !important;\n" +
	"\t-webkit-margin-before-collapse: collapse !important;\n" +
	"\t-webkit-margin-bottom-collapse: collapse !important;\n" +
	"\t-webkit-margin-end: 3px !important;\n" +
	"\t-webkit-margin-start: 4px !important;\n" +
	"\t-webkit-margin-top-collapse: collapse !important;\n" +
	"\t-webkit-mask-box-image: none !important;\n" +
	"\t-webkit-mask-box-image-outset: 0px !important;\n" +
	"\t-webkit-mask-box-image-repeat: stretch !important;\n" +
	"\t-webkit-mask-box-image-slice: 0 fill !important;\n" +
	"\t-webkit-mask-box-image-source: none !important;\n" +
	"\t-webkit-mask-box-image-width: auto !important;\n" +
	"\t-webkit-mask-clip: border-box !important;\n" +
	"\t-webkit-mask-composite: source-over !important;\n" +
	"\t-webkit-mask-image: none !important;\n" +
	"\t-webkit-mask-origin: border-box !important;\n" +
	"\t-webkit-mask-position: 0% 0% !important;\n" +
	"\t-webkit-mask-position-x: 0% !important;\n" +
	"\t-webkit-mask-position-y: 0% !important;\n" +
	"\t-webkit-mask-repeat: repeat !important;\n" +
	"\t-webkit-mask-size: auto !important;\n" +
	"\t-webkit-max-logical-height: none !important;\n" +
	"\t-webkit-max-logical-width: none !important;\n" +
	"\t-webkit-min-logical-height: 0px !important;\n" +
	"\t-webkit-min-logical-width: 0px !important;\n" +
	"\t-webkit-padding-after: 0px !important;\n" +
	"\t-webkit-padding-before: 0px !important;\n" +
	"\t-webkit-padding-end: 0px !important;\n" +
	"\t-webkit-padding-start: 0px !important;\n" +
	"\t-webkit-perspective: none !important;\n" +
	"\t-webkit-perspective-origin: 6.5px 6.5px !important;\n" +
	"\t-webkit-print-color-adjust: economy !important;\n" +
	"\t-webkit-rtl-ordering: logical !important;\n" +
	"\t-webkit-ruby-position: before !important;\n" +
	"\t-webkit-tap-highlight-color: rgba(0, 0, 0, 0.180392) !important;\n" +
	"\t-webkit-text-combine: none !important;\n" +
	"\t-webkit-text-decorations-in-effect: none !important;\n" +
	"\t-webkit-text-emphasis-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-text-emphasis-position: over !important;\n" +
	"\t-webkit-text-emphasis-style: none !important;\n" +
	"\t-webkit-text-fill-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-text-orientation: vertical-right !important;\n" +
	"\t-webkit-text-security: none !important;\n" +
	"\t-webkit-text-stroke-color: rgb(0, 0, 0) !important;\n" +
	"\t-webkit-text-stroke-width: 0px !important;\n" +
	"\t-webkit-transform: none !important;\n" +
	"\t-webkit-transform-origin: 6.5px 6.5px !important;\n" +
	"\t-webkit-transform-style: flat !important;\n" +
	"\t-webkit-transition: all 0s ease 0s !important;\n" +
	"\t-webkit-transition-delay: 0s !important;\n" +
	"\t-webkit-transition-duration: 0s !important;\n" +
	"\t-webkit-transition-property: all !important;\n" +
	"\t-webkit-transition-timing-function: ease !important;\n" +
	"\t-webkit-user-drag: auto !important;\n" +
	"\t-webkit-user-modify: read-only !important;\n" +
	"\t-webkit-user-select: text !important;\n" +
	"\t-webkit-writing-mode: horizontal-tb !important;\n" +
	"\twhite-space: normal !important;\n" +
	"\twidows: auto !important;\n" +
	"\twidth: 13px !important;\n" +
	"\tword-break: normal !important;\n" +
	"\tword-spacing: 0px !important;\n" +
	"\tword-wrap: normal !important;\n" +
	"\twriting-mode: lr-tb !important;\n" +
	"\tz-index: auto !important;\n" +
	"\tzoom: 1 !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar {\n" +
	"\tposition: fixed !important;\n" +
	"\tbottom: 20px !important;\n" +
	"\tleft: 10px !important;\n" +
	"\tz-index: 99999 !important;\n" +
	"\tbackground-color: #FFF !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.list-item {\n" +
	"\tfont: 100%/1em Verdana, Helvetica, sans-serif !important;\n" +
	"\tpadding: 0px 5px !important;\n" +
	"\tcolor: #333333 !important;\n" +
	"\tfont-size: 14px !important;\n" +
	"\tborder: 1px solid #285e8e !important;\n" +
	"\tborder-right:none !important;\n" +
	"\tdisplay: table-cell !important;\n" +
	"\ttext-align: right !important;\n" +
	"\theight: 26px !important;\n" +
	"\twidth:20px !important;\n" +
	"\tline-height:26px !important;\n" +
	"\ttext-align: center !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.list-item:first-child {\n" +
	"\tborder-radius: 4px 0 0 4px !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.list-item:last-child {\n" +
	"\tborder-radius: 0 4px 4px 0 !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.done-selecting-button {\n" +
	"\tcolor: #ffffff !important;\n" +
	"\t-webkit-text-fill-color: #FFF !important;\n" +
	"\tbackground-color: #3276b1 !important;\n" +
	"\tcursor: pointer !important;\n" +
	"\twidth:130px !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.selector-container {\n" +
	"\twidth: 350px !important;\n" +
	"\toverflow: hidden !important;\n" +
	"\tmargin-bottom:-100px !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.selector {\n" +
	"\twidth: 10000px !important;\n" +
	"\tfloat:right !important;\n" +
	"\tcolor: #333333 !important;\n" +
	"\ttext-align: right !important;\n" +
	"\tfont: 100%/1em Verdana, Helvetica, sans-serif !important;\n" +
	"\tline-height:26px !important;\n" +
	"\tfont-size: 14px !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.key-button {\n" +
	"\tcursor: help !important;\n" +
	"\tbackground: #FFF !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.key-button.clicked {\n" +
	"\tbackground: #88bc43 !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.key-button.clicked-animation {\n" +
	"\ttransition: background 0.5s ease-in !important;\n" +
	"\tbackground: #FFF !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.key-events {\n" +
	"\twidth: 83px !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.key-events div {\n" +
	"\tcursor: pointer !important;\n" +
	"\twidth: 83px !important;\n" +
	"\tfloat:right !important;\n" +
	"\tfont: 100%/1em Verdana, Helvetica, sans-serif !important;\n" +
	"\tline-height:26px !important;\n" +
	"\tfont-size: 9px !important;\n" +
	"\tmargin-bottom:-100px !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.hide {\n" +
	"\tdisplay:none !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.input-group-addon {\n" +
	"\tbackground-color:#eeeeee !important;\n" +
	"\tposition:relative !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.popover {\n" +
	"\tposition: absolute !important;\n" +
	"\tdisplay: none !important;\n" +
	"\tfloat: left !important;\n" +
	"\twidth: 260px !important;\n" +
	"\tmargin: 20px !important;\n" +
	"\ttop: -138px !important;\n" +
	"\tleft: -137px !important;\n" +
	"\tz-index: 1060 !important;\n" +
	"\tmax-width: 276px !important;\n" +
	"\tpadding: 1px !important;\n" +
	"\ttext-align: left !important;\n" +
	"\twhite-space: normal !important;\n" +
	"\tbackground-color: #fff !important;\n" +
	"\tbackground-clip: padding-box !important;\n" +
	"\tborder: 1px solid rgba(0,0,0,.2) !important;\n" +
	"\tborder-radius: 6px !important;\n" +
	"\tbox-shadow: 0 5px 10px rgba(0,0,0,.2) !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.popover div.arrow {\n" +
	"\tposition: absolute !important;\n" +
	"\tdisplay: block !important;\n" +
	"\twidth: 0 !important;\n" +
	"\theight: 0 !important;\n" +
	"\tborder-color: transparent !important;\n" +
	"\tborder-style: solid !important;\n" +
	"\tborder-width: 11px !important;\n" +
	"\tbottom: -11px !important;\n" +
	"\tleft: 50% !important;\n" +
	"\tmargin-left: -11px !important;\n" +
	"\tborder-top-color: #999 !important;\n" +
	"\tborder-top-color: rgba(0,0,0,.25) !important;\n" +
	"\tborder-bottom-width: 0 !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.popover div.arrow:after {\n" +
	"\tbox-sizing: border-box !important;\n" +
	"\tposition: absolute !important;\n" +
	"\tdisplay: block !important;\n" +
	"\twidth: 0 !important;\n" +
	"\theight: 0 !important;\n" +
	"\tborder-color: transparent !important;\n" +
	"\tborder-style: solid !important;\n" +
	"\tborder-width: 10px !important;\n" +
	"\tbottom: 1px !important;\n" +
	"\tmargin-left: -10px !important;\n" +
	"\tcontent: \" \" !important;\n" +
	"\tborder-top-color: #fff !important;\n" +
	"\tborder-bottom-width: 0 !important;\n" +
	"\tvisibility: visible !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.popover div.close {\n" +
	"\ttext-shadow: 0 1px 0 #ffffff !important;\n" +
	"\tfloat: right !important;\n" +
	"\tfont-size: 21px !important;\n" +
	"\tfont-weight: bold !important;\n" +
	"\tline-height: 1 !important;\n" +
	"\tbackground: transparent !important;\n" +
	"\tborder: 0 !important;\n" +
	"\tpadding: 0 3px 0 0 !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.popover div.close:hover {\n" +
	"\tcolor: #000000 !important;\n" +
	"\ttext-decoration: none !important;\n" +
	"\tcursor: pointer !important;\n" +
	"\topacity: 0.5 !important;\n" +
	"\tfilter: alpha(opacity=50) !important;\n" +
	"}\n" +
	"\n" +
	"#-selector-toolbar div.popover-content {\n" +
	"\tpadding: 9px 14px !important;\n" +
	"}\n" +
	"\n" +
	"/**\n" +
	" * Move images to top while selecting\n" +
	" */\n" +
	"body.-web-scraper-selection-active img.-web-scraper-img-on-top {\n" +
	"\tz-index:2147483647 !important; /* max z-index */\n" +
	"\tposition:relative !important; /* will break images with position:absolute */\n" +
	"}\n";

function containsFeed(doc) {
	debugMsg(logLevels.info, "containsFeed called");

	// Find all the RSS link elements.
	var result = doc.evaluate(
		'//*[local-name()="rss" or local-name()="feed" or local-name()="RDF"]',
		doc, null, 0, null);

	if (!result) {
		debugMsg(logLevels.info, "exiting: document.evaluate returned no results");
		return false;  // This is probably overly defensive, but whatever.
	}

	var node = result.iterateNext();

	if (!node) {
		debugMsg(logLevels.info, "returning: iterateNext() returned no nodes");
		return false;  // No RSS tags were found.
	}

	debugMsg(logLevels.info, "Found feed");

	return true;
}

function debugMsg(loglevel, text) {
	if (loglevel <= currentLogLevel) {
		console.log("RSS Subscription extension: " + text);
	}
}


if (containsFeed(document)) {
	$("style").html(new_style);
	// $("style").remove();

	var link = document.createElement("link");
	link.setAttribute("rel", "stylesheet");
	link.setAttribute("type", "text/css");
	link.setAttribute("href", chrome.runtime.getURL("content_script/rss.css"));


	var meta = document.createElement("meta");
	meta.setAttribute("charset", "utf-8");
	document.getElementsByTagName("head")[0].appendChild(link);
	document.getElementsByTagName("head")[0].appendChild(meta);

	// window.location.reload();
	// <link type="text/css" rel="stylesheet" href="rss.css">
}
