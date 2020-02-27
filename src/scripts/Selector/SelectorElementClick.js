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

	/**
	 * Check whether element is still reachable from html. Useful to check whether the element is removed from DOM.
	 * @param element
	 */
	isElementInHTML(element) {
		return $(element).closest('html').length !== 0;
	}

	getElementCSSSelector(element) {
		let nthChild, prev;
		for (nthChild = 1, prev = element.previousElementSibling; prev !== null; prev = prev.previousElementSibling, nthChild++) {}
		let tagName = element.tagName.toLocaleLowerCase();
		let cssSelector = tagName + ':nth-child(' + nthChild + ')';

		while (element.parentElement) {
			element = element.parentElement;
			let tagName = element.tagName.toLocaleLowerCase();
			if (tagName === 'body' || tagName === 'html') {
				cssSelector = tagName + '>' + cssSelector;
			} else {
				for (nthChild = 1, prev = element.previousElementSibling; prev !== null; prev = prev.previousElementSibling, nthChild++) {}
				cssSelector = tagName + ':nth-child(' + nthChild + ')>' + cssSelector;
			}
		}

		return cssSelector;
	}

	triggerButtonClick(clickElement) {
		let cssSelector = this.getElementCSSSelector(clickElement);

		// this function will trigger the click from browser land
		let script = document.createElement('script');
		script.type = 'text/javascript';
		script.text = '' + '(function(){ ' + "let el = document.querySelectorAll('" + cssSelector + "')[0]; " + 'el.click(); ' + '})();';
		document.body.appendChild(script);
	}

	getClickElementUniquenessType() {
		if (this.clickElementUniquenessType === undefined) {
			return 'uniqueText';
		} else {
			return this.clickElementUniquenessType;
		}
	}

	_getData(parentElement) {
		let paginationLimit = parseInt(this.paginationLimit);
		let paginationCount = 1;
		let delay = parseInt(this.delay) || 0;
		let deferredResponse = $.Deferred();
		let foundElements = new UniqueElementList('uniqueHTMLText');
		let clickElements = this.getClickElements(parentElement);
		let doneClickingElements = new UniqueElementList(this.getClickElementUniquenessType());

		// add elements that are available before clicking
		let elements = this.getDataElements(parentElement);
		elements.forEach(foundElements.push.bind(foundElements));

		// discard initial elements
		if (this.discardInitialElements) {
			foundElements = new UniqueElementList('uniqueText');
		}

		// no elements to click at the beginning
		if (clickElements.length === 0) {
			deferredResponse.resolve(foundElements);
			return deferredResponse.promise();
		}

		// initial click and wait
		let currentClickElement = clickElements[0];
		this.triggerButtonClick(currentClickElement);
		let nextElementSelection = new Date().getTime() + delay;

		// infinitely scroll down and find all items
		let interval = setInterval(
			function() {
				// find those click elements that are not in the black list
				let allClickElements = this.getClickElements(parentElement);
				clickElements = [];
				allClickElements.forEach(function(element) {
					if (!doneClickingElements.isAdded(element)) {
						clickElements.push(element);
					}
				});

				let now = new Date().getTime();
				// sleep. wait when to extract next elements
				if (now < nextElementSelection) {
					//console.log("wait");
					return;
				}

				// add newly found elements to element foundElements array.
				let elements = this.getDataElements(parentElement);
				let addedAnElement = false;
				elements.forEach(function(element) {
					let added = foundElements.push(element);
					if (added) {
						addedAnElement = true;
					}
				});
				//console.log("added", addedAnElement);

				// no new elements found. Stop clicking this button
				if (!addedAnElement) {
					doneClickingElements.push(currentClickElement);
				}

				// continue clicking and add delay, but if there is nothing
				// more to click the finish
				//console.log("total buttons", clickElements.length)
				if (clickElements.length === 0 || paginationCount >= paginationLimit) {
					clearInterval(interval);
					deferredResponse.resolve(foundElements);
				} else {
					paginationCount++;
					//console.log("click");
					currentClickElement = clickElements[0];
					// click on elements only once if the type is clickonce
					if (this.clickType === 'clickOnce') {
						doneClickingElements.push(currentClickElement);
					}
					this.triggerButtonClick(currentClickElement);
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
		return ['selector', 'multiple', 'delay', 'clickElementSelector', 'clickType', 'discardInitialElements', 'clickElementUniquenessType', 'paginationLimit'];
	}
}
