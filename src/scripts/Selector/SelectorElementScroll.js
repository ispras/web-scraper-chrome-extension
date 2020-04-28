import Selector from '../Selector';

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

	scrollToBottom() {
		window.scrollTo(0, document.body.scrollHeight);
	}

	async _getData(parentElement) {
		const delay = parseInt(this.delay) || 0;
		const paginationLimit = parseInt(this.paginationLimit);
		let paginationCount = 1;
		let foundElements = [];

		// initially scroll down and wait
		this.scrollToBottom();
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
					this.scrollToBottom();
					nextElementSelection = now + delay;
				}
			}, 50);
		});
	}

	getDataColumns() {
		return [];
	}

	getFeatures() {
		return ['selector', 'multiple', 'delay', 'paginationLimit'];
	}
}
