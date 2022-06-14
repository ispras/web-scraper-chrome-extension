import Selector from './Selector';
import ConstantValue from './Selector/ConstantValue';
import SelectorText from './Selector/SelectorText';
import SelectorDocument from './Selector/SelectorDocument';
import SelectorPopupLink from './Selector/SelectorPopupLink';
import SelectorInputValue from './Selector/SelectorInputValue';
import SelectorElement from './Selector/SelectorElement';
import SelectorLink from './Selector/SelectorLink';
import SelectorImage from './Selector/SelectorImage';
import SelectorHTML from './Selector/SelectorHTML';
import SelectorGroup from './Selector/SelectorGroup';
import SelectorElementStyle from './Selector/SelectorElementStyle';
import SelectorElementClick from './Selector/SelectorElementClick';
import SelectorElementScroll from './Selector/SelectorElementScroll';
import SelectorElementAttribute from './Selector/SelectorElementAttribute';
import SelectorTable from './Selector/SelectorTable';
import SelectorPageURL from './Selector/SelectorPageURL';

export default class SelectorList extends Array {
	static createSelector(options) {
		switch (options.type) {
			case 'ConstantValue':
				return new ConstantValue(options);
			case 'SelectorPageURL':
				return new SelectorPageURL(options);
			case 'SelectorDocument':
				return new SelectorDocument(options);
			case 'SelectorElement':
				return new SelectorElement(options);
			case 'SelectorElementAttribute':
				return new SelectorElementAttribute(options);
			case 'SelectorElementScroll':
				return new SelectorElementScroll(options);
			case 'SelectorElementClick':
				return new SelectorElementClick(options);
			case 'SelectorElementStyle':
				return new SelectorElementStyle(options);
			case 'SelectorGroup':
				return new SelectorGroup(options);
			case 'SelectorHTML':
				return new SelectorHTML(options);
			case 'SelectorImage':
				return new SelectorImage(options);
			case 'SelectorInputValue':
				return new SelectorInputValue(options);
			case 'SelectorLink':
				return new SelectorLink(options);
			case 'SelectorPopupLink':
				return new SelectorPopupLink(options);
			case 'SelectorTable':
				return new SelectorTable(options);
			case 'SelectorText':
				return new SelectorText(options);
			default:
				return new SelectorText(options);
		}
	}

	constructor(selectors) {
		super();
		if (selectors === undefined) {
			return;
		}

		for (let i = 0; i < selectors.length; i++) {
			this.push(selectors[i]);
		}
	}

	push(selector) {
		if (!this.hasSelector(selector.uuid)) {
			if (!(selector instanceof Selector)) {
				selector = SelectorList.createSelector(selector);
			}
			Array.prototype.push.call(this, selector);
		}
	}

	hasSelector(selectorId) {
		if (selectorId instanceof Object) {
			selectorId = selectorId.id;
		}

		for (let i = 0; i < this.length; i++) {
			if (this[i].id === selectorId) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Returns all selectors or recursively find and return all child selectors of a parent selector.
	 * @param parentSelectorId
	 * @returns {Array}
	 */
	getAllSelectors(parentSelectorId) {
		if (parentSelectorId === undefined) {
			return this;
		}

		const getAllChildSelectors = function (parentSelectorId, resultSelectors) {
			this.forEach(function (selector) {
				if (selector.hasParentSelector(parentSelectorId)) {
					if (resultSelectors.indexOf(selector) === -1) {
						resultSelectors.push(selector);
						getAllChildSelectors(selector.uuid, resultSelectors);
					}
				}
			});
		}.bind(this);

		const resultSelectors = [];
		getAllChildSelectors(parentSelectorId, resultSelectors);
		return resultSelectors;
	}

	/**
	 * Returns only selectors that are directly under a parent
	 * @param parentSelectorId
	 * @returns {Array}
	 */
	getDirectChildSelectors(parentSelectorId) {
		const resultSelectors = new SelectorList();
		this.forEach(function (selector) {
			if (selector.hasParentSelector(parentSelectorId)) {
				resultSelectors.push(selector);
			}
		});
		return resultSelectors;
	}

	clone() {
		const resultList = new SelectorList();
		this.forEach(function (selector) {
			resultList.push(selector);
		});
		return resultList;
	}

	fullClone() {
		const resultList = new SelectorList();
		this.forEach(function (selector) {
			resultList.push(JSON.parse(JSON.stringify(selector)));
		});
		return resultList;
	}

	concat() {
		const resultList = this.clone();
		for (const i in arguments) {
			arguments[i].forEach(function (selector) {
				resultList.push(selector);
			});
		}
		return resultList;
	}

	/**
	 * Returns all selectors if this selectors including all parent selectors within this page
	 * @TODO not used any more.
	 * @param selectorId
	 * @returns {*}
	 */
	getOnePageSelectors(selectorId) {
		let resultList = new SelectorList();
		const selector = this.getSelectorByUid(selectorId);
		resultList.push(this.getSelectorByUid(selectorId));

		// recursively find all parent selectors that could lead to the page where selectorId is used.
		const findParentSelectors = function (selector) {
			selector.parentSelectors.forEach(
				function (parentSelectorUUID) {
					if (parentSelectorUUID === '0') return;
					const parentSelector = this.getSelectorByUid(parentSelectorUUID);
					if (resultList.indexOf(parentSelector) !== -1) return;
					if (parentSelector.willReturnElements()) {
						resultList.push(parentSelector);
						findParentSelectors(parentSelector);
					}
				}.bind(this)
			);
		}.bind(this);

		findParentSelectors(selector);

		// add all child selectors
		resultList = resultList.concat(this.getSinglePageAllChildSelectors(selector.id));
		return resultList;
	}

	/**
	 * Returns all child selectors of a selector which can be used within one page.
	 * @param parentSelectorId
	 */
	getSinglePageAllChildSelectors(parentSelectorId) {
		const resultList = new SelectorList();
		const addChildSelectors = function (parentSelector) {
			if (parentSelector.willReturnElements()) {
				const childSelectors = this.getDirectChildSelectors(parentSelector.id);
				childSelectors.forEach(function (childSelector) {
					if (resultList.indexOf(childSelector) === -1) {
						resultList.push(childSelector);
						addChildSelectors(childSelector);
					}
				});
			}
		}.bind(this);

		const parentSelector = this.getSelectorByUid(parentSelectorId);
		addChildSelectors(parentSelector);
		return resultList;
	}

	willReturnMultipleRecords(selectorId) {
		// handle reuqested selector
		const selector = this.getSelectorByUid(selectorId);
		if (selector.mergeIntoList) {
			return false;
		}
		if (selector.willReturnMultipleRecords()) {
			return true;
		}

		// handle all its child selectors
		const childSelectors = this.getAllSelectors(selectorId);
		for (let i = 0; i < childSelectors.length; i++) {
			const selector = childSelectors[i];
			if (selector.willReturnMultipleRecords()) {
				return true;
			}
		}

		return false;
	}

	/**
	 * When serializing to JSON convert to an array
	 * @returns {Array}
	 */
	toJSON() {
		const result = [];
		this.forEach(function (selector) {
			result.push(selector);
		});
		return result;
	}

	getSelectorByUid(selectorUid) {
		for (let i = 0; i < this.length; i++) {
			const selector = this[i];
			if (selector.uuid === selectorUid) {
				return selector;
			}
		}
	}

	getSelectorById(selectorId) {
		for (let i = 0; i < this.length; i++) {
			const selector = this[i];
			if (selector.id === selectorId) {
				return selector;
			}
		}
	}

	/**
	 * returns css selector for a given element. css selector includes all parent element selectors
	 * @param selectorId
	 * @param parentSelectorIds array of parent selector ids from devtools Breadcumb
	 * @returns string
	 */
	getCSSSelectorWithinOnePage(selectorId, parentSelectorIds) {
		let CSSSelector = this.getSelectorByUid(selectorId).selector;
		const parentCSSSelector = this.getParentCSSSelectorWithinOnePage(parentSelectorIds);
		CSSSelector = parentCSSSelector + CSSSelector;

		return CSSSelector;
	}

	/**
	 * returns css selector for parent selectors that are within one page
	 * @param parentSelectorIds array of parent selector ids from devtools Breadcumb
	 * @returns string
	 */
	getParentCSSSelectorWithinOnePage(parentSelectorIds) {
		let CSSSelector = '';

		for (let i = parentSelectorIds.length - 1; i > 0; i--) {
			const parentSelectorId = parentSelectorIds[i];
			const parentSelector = this.getSelectorByUid(parentSelectorId);
			if (parentSelector.willReturnElements()) {
				CSSSelector = `${parentSelector.selector} ${CSSSelector}`;
			} else {
				break;
			}
		}

		return CSSSelector;
	}

	hasRecursiveElementSelectors() {
		let RecursionFound = false;

		this.forEach(
			function (topSelector) {
				const visitedSelectors = [];

				const checkRecursion = function (parentSelector) {
					// already visited
					if (visitedSelectors.indexOf(parentSelector) !== -1) {
						RecursionFound = true;
						return;
					}

					if (parentSelector.willReturnElements()) {
						visitedSelectors.push(parentSelector);
						const childSelectors = this.getDirectChildSelectors(parentSelector.id);
						childSelectors.forEach(checkRecursion);
						visitedSelectors.pop();
					}
				}.bind(this);

				checkRecursion(topSelector);
			}.bind(this)
		);

		return RecursionFound;
	}
}
