export default class ElementSelectorList extends Array {
	constructor(CssSelector) {
		super();
		this.CssSelector = CssSelector;
	}

	getCssSelector() {
		let resultSelectors = [];

		// TDD
		for (let i = 0; i < this.length; i++) {
			let selector = this[i];

			let isFirstSelector = i === this.length - 1;
			let resultSelector = selector.getCssSelector(isFirstSelector);

			if (this.CssSelector.enableSmartTableSelector) {
				if (selector.tag === 'tr') {
					if (selector.element.children.length === 2) {
						if (
							selector.element.children[0].tagName === 'TD' ||
							selector.element.children[0].tagName === 'TH' ||
							selector.element.children[0].tagName === 'TR'
						) {
							let text = selector.element.children[0].textContent;
							text = text.trim();

							// escape quotes
							text.replace(/(\\*)(')/g, function (x) {
								let l = x.length;
								return l % 2 ? x : x.substring(0, l - 1) + "\\'";
							});
							resultSelector += ":contains('" + text + "')";
						}
					}
				}
			}

			resultSelectors.push(resultSelector);
		}

		return resultSelectors.reverse().join(' ');
	}
}
