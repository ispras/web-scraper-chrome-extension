import Selector from '../Selector';
import ElementQuery from '../ElementQuery';
import UniqueElementList from '../UniqueElementList';

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

		const foundDataElements = new UniqueElementList('uniqueHTMLText');
		this.getDataElements(parentElement).forEach(element => foundDataElements.push(element));

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

				// add newly found elements to foundDataElements array
				const addedAnElement = this.getDataElements(parentElement).reduce(
					(added, element) => foundDataElements.push(element) || added,
					false
				);

				// no new elements found or pagination limit
				if (!addedAnElement || paginationCount >= paginationLimit) {
					clearInterval(interval);
					resolve(foundDataElements);
				} else {
					paginationCount++;
					// continue scrolling and add delay
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
