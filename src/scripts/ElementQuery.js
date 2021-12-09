function getSelectorParts(CSSSelector) {
	const selectors = CSSSelector.split(/(,|".*?"|'.*?'|\(.*?\))/);

	const resultSelectors = [];
	let currentSelector = '';
	selectors.forEach(function (selector) {
		if (selector === ',') {
			if (currentSelector.trim().length) {
				resultSelectors.push(currentSelector.trim());
			}
			currentSelector = '';
		} else {
			currentSelector += selector;
		}
	});
	if (currentSelector.trim().length) {
		resultSelectors.push(currentSelector.trim());
	}

	return resultSelectors;
}

/**
 * Element selector. Uses jQuery as base and adds some more features
 * @param parentElement
 * @param selector
 */
export default function ElementQuery(CSSSelector, parentElement) {
	CSSSelector = CSSSelector || '';

	const selectedElements = [];

	const addElement = function (element) {
		if (selectedElements.indexOf(element) === -1) {
			selectedElements.push(element);
		}
	};

	const selectorParts = getSelectorParts(CSSSelector);
	selectorParts.forEach(function (selector) {
		// handle special case when parent is selected
		if (selector === '_parent_') {
			$(parentElement).each(function (i, element) {
				addElement(element);
			});
		} else {
			const elements = $(selector, parentElement);
			elements.each(function (i, element) {
				addElement(element);
			});
		}
	});

	return selectedElements;
}
