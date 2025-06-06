import Selector from '../Selector';
import ElementQuery from '../ElementQuery';
import UniqueElementList from '../UniqueElementList';

export default class SelectorElementClick extends Selector {
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

	getClickElements(parentElement) {
		return ElementQuery(this.clickElementSelector, parentElement);
	}

	triggerButtonClick(clickElement) {
		const cssSelector = this.getElementCSSSelector(clickElement);
		// this function will trigger the click from browser land
		// TODO do we really need to inject a script instead of document.querySelector(...).click()?
		// I don't know for sure, but it seems to work
		document.querySelector(cssSelector).click();
	}

	getClickElementUniquenessType() {
		if (this.clickElementUniquenessType === undefined) {
			return 'uniqueText';
		}
		return this.clickElementUniquenessType;
	}

	async _getData(parentElement) {
		const delay = parseInt(this.delay) || 0;
		const paginationLimit = parseInt(this.paginationLimit);
		let paginationCount = 1;

		const foundDataElements = new UniqueElementList('uniqueHTMLText');
		if (!this.discardInitialElements) {
			// add elements that are available before clicking
			this.getDataElements(parentElement).forEach(element => foundDataElements.push(element));
		}

		let clickElements = this.getClickElements(parentElement);
		if (!clickElements.length) {
			// no elements to click at the beginning
			return foundDataElements;
		}

		const doneClickingElements = new UniqueElementList(this.getClickElementUniquenessType());

		// initial click and wait
		let [currentClickElement] = clickElements;
		if (this.clickType === 'clickOnce') {
			doneClickingElements.push(currentClickElement);
		}
		this.triggerButtonClick(currentClickElement);
		let nextElementSelection = Date.now() + delay;

		return new Promise(resolve => {
			// repeatedly click and find new items
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

				// no new elements found. Stop clicking this button
				if (!addedAnElement) {
					doneClickingElements.push(currentClickElement);
				}

				// find those click elements that are not in the black list
				clickElements = this.getClickElements(parentElement).filter(
					element => !doneClickingElements.isAdded(element)
				);

				// continue clicking and add delay, but if there is nothing
				// more to click then finish
				if (!clickElements.length || paginationCount >= paginationLimit) {
					clearInterval(interval);
					resolve(foundDataElements);
				} else {
					paginationCount++;
					[currentClickElement] = clickElements;
					// click on elements only once if the type is clickonce
					if (this.clickType === 'clickOnce') {
						doneClickingElements.push(currentClickElement);
					}
					this.triggerButtonClick(currentClickElement);
					nextElementSelection = now + delay;
				}
			}, 50);
		});
	}

	async afterSelect(cssSelector, controller, inputId) {
		if (inputId === 'clickElementSelector') {
			this.clickElementSelector = cssSelector;
		} else {
			this.selector = cssSelector;
		}
		controller._editSelector(this);
	}

	getDataColumns() {
		return [];
	}

	getFeatures() {
		return [
			'selector',
			'multiple',
			'delay',
			'clickElementSelector',
			'clickType',
			'discardInitialElements',
			'clickElementUniquenessType',
			'paginationLimit',
			'mergeIntoList',
		];
	}
}
