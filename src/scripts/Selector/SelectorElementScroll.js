import Selector from '../Selector';
import ElementQuery from '../ElementQuery';

export default class SelectorElementScroll extends Selector {
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
		return true;
	}

	canCreateNewJobs() {
		return false;
	}

	willReturnElements() {
		return true;
	}

	scroll(parentElement) {
		if (this.scrollElementSelector) {
			const scrollElements = ElementQuery(this.scrollElementSelector, parentElement);
			if (scrollElements.length) {
				scrollElements[0].scrollIntoView();
			}
		} else {
			window.scrollTo(0, document.body.scrollHeight);
		}
	}

	async _getData(parentElement) {
		const delay = parseInt(this.delay) || 0;
		const paginationLimit = parseInt(this.paginationLimit);
		let paginationCount = 1;
		let foundElements = [];

		// initially scroll down and wait
		this.scroll(parentElement);
		let nextElementSelection = Date.now() + delay;

		return new Promise(resolve => {
			// infinitely scroll down and find all items
			const interval = setInterval(() => {
				const now = Date.now();
				// sleep and wait when to extract next elements
				if (now < nextElementSelection) {
					return;
				}

				const elements = this.getDataElements(parentElement);
				// no new elements found or pagination limit
				if (
					elements.length === foundElements.length ||
					paginationCount >= paginationLimit
				) {
					clearInterval(interval);
					resolve(elements);
				} else {
					paginationCount++;
					// continue scrolling and add delay
					foundElements = elements;
					this.scroll(parentElement);
					nextElementSelection = now + delay;
				}
			}, 50);
		});
	}

	async afterSelect(cssSelector, controller, inputId) {
		if (inputId === 'scrollElementSelector') {
			this.scrollElementSelector = cssSelector;
		} else {
			this.selector = cssSelector;
		}
		controller._editSelector(this);
	}

	getDataColumns() {
		return [];
	}

	getFeatures() {
		return ['selector', 'scrollElementSelector', 'multiple', 'delay', 'paginationLimit'];
	}
}
