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

	_getData(parentElement) {
		let paginationLimit = parseInt(this.paginationLimit);
		let paginationCount = 1;
		let delay = parseInt(this.delay) || 0;
		let deferredResponse = $.Deferred();
		let foundElements = [];

		// initially scroll down and wait
		this.scrollToBottom();
		let nextElementSelection = new Date().getTime() + delay;

		// infinitely scroll down and find all items
		let interval = setInterval(
			function() {
				let now = new Date().getTime();
				// sleep. wait when to extract next elements
				if (now < nextElementSelection) {
					return;
				}

				let elements = this.getDataElements(parentElement);
				// no new elements found or pagination limit
				if (elements.length === foundElements.length || paginationCount >= paginationLimit) {
					clearInterval(interval);
					deferredResponse.resolve($.makeArray(elements));
				} else {
					paginationCount++;
					// continue scrolling and add delay
					foundElements = elements;
					this.scrollToBottom();
					nextElementSelection = now + delay;
				}
			}.bind(this),
			50
		);

		return deferredResponse.promise();
	}

	getDataColumns() {
		return [];
	}

	getFeatures() {
		return ['selector', 'multiple', 'delay', 'paginationLimit'];
	}
}
