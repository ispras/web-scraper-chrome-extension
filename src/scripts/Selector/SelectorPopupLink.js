import * as $ from 'jquery';
import Selector from '../Selector';

export default class SelectorPopupLink extends Selector {
	constructor(options) {
		super(options);
		this.updateData(options, this.getFeatures());
	}

	canReturnMultipleRecords() {
		return true;
	}

	canHaveChildSelectors() {
		return true;
	}

	canHaveLocalChildSelectors() {
		return false;
	}

	canCreateNewJobs() {
		return true;
	}

	willReturnElements() {
		return false;
	}

	async _getData(parentElement) {
		const elements = this.getDataElements(parentElement);
		if (!this.multiple && !elements.length) {
			return [{ [this.id]: null }];
		}
		const links = [];
		for (const element of elements) {
			const text = $(element).text();
			const url = await this.getPopupURL(element);
			links.push({
				[this.id]: text,
				[`${this.id}-href`]: url,
				_followSelectorId: this.uuid,
				_follow: url,
			});
		}
		return links;
	}

	/**
	 * Gets an url from a window.open call by mocking the window.open function
	 * @param element
	 * @returns $.Deferred()
	 */
	getPopupURL(element) {
		// override window.open function. we need to execute this in page scope.
		// we need to know how to find this element from page scope.
		const cssSelector = this.getElementCSSSelector(element);

		// this function will catch window.open call and place the requested url as the elements data attribute
		const script = document.createElement('script');
		script.type = 'text/javascript';
		script.text = `{
			const { open } = window;
			const el = document.querySelector('${cssSelector}');
			window.open = url => {
				el.dataset.webScraperExtractUrl = url;
				window.open = open;
			};
			el.click();
		}`;
		document.body.appendChild(script);

		// wait for url to be available
		const timeout = 5000; // 5s timeout to generate an url for popup
		const intervalTickRate = 30; // check each 30 ms
		let ticks = Math.ceil(timeout / intervalTickRate);
		return new Promise(resolve => {
			const interval = setInterval(() => {
				const url = $(element).data('web-scraper-extract-url');
				if (url) {
					clearInterval(interval);
					script.remove();
					resolve(url);
				}
				// timeout popup opening
				if (!--ticks) {
					clearInterval(interval);
					script.remove();
				}
			}, intervalTickRate);
		});
	}

	getDataColumns() {
		return [this.id, `${this.id}-href`];
	}

	getFeatures() {
		return ['selector', 'multiple', 'delay'];
	}

	getItemCSSSelector() {
		return '*';
	}
}
