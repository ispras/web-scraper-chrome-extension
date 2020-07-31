/**
 * Only Elements unique will be added to this array
 * @constructor
 */
export default class UniqueElementList extends Array {
	constructor(clickElementUniquenessType) {
		super();
		this.clickElementUniquenessType = clickElementUniquenessType;
		this.addedElements = {};
	}

	push(element) {
		let getStyles = function (_elem, _style) {
			let computedStyle;
			if (typeof _elem.currentStyle != 'undefined') {
				computedStyle = _elem.currentStyle;
			} else {
				computedStyle = document.defaultView.getComputedStyle(_elem, null);
			}
			return _style ? computedStyle[_style] : computedStyle;
		};

		let copyComputedStyle = function (src, dest) {
			let styles = getStyles(src);
			for (let i in styles) {
				// Do not use `hasOwnProperty`, nothing will get copied
				if (typeof i == 'string' && i != 'cssText' && !/\d/.test(i)) {
					// The try is for setter only properties
					try {
						dest.style[i] = styles[i];
						// `fontSize` comes before `font` If `font` is empty, `fontSize` gets
						// overwritten.  So make sure to reset this property. (hackyhackhack)
						// Other properties may need similar treatment
						if (i == 'font') {
							dest.style.fontSize = styles.fontSize;
						}
					} catch (e) {}
				}
			}
		};

		if (this.isAdded(element)) {
			return false;
		} else {
			let elementUniqueId = this.getElementUniqueId(element);
			this.addedElements[elementUniqueId] = true;
			let clone = $(element).clone(true)[0];

			// clone computed styles (to extract images from background)
			let items = element.getElementsByTagName('*');
			let itemsCloned = clone.getElementsByTagName('*');
			$(items).each(function (i, item) {
				copyComputedStyle(item, itemsCloned[i]);
			});

			Array.prototype.push.call(this, clone);
			return true;
		}
	}

	getElementUniqueId(element) {
		if (this.clickElementUniquenessType === 'uniqueText') {
			let elementText = $(element).text().trim();
			return elementText;
		} else if (this.clickElementUniquenessType === 'uniqueHTMLText') {
			let elementHTML = $("<div class='-web-scraper-should-not-be-visible'>")
				.append($(element).eq(0).clone())
				.html();
			return elementHTML;
		} else if (this.clickElementUniquenessType === 'uniqueHTML') {
			// get element without text
			let $element = $(element).eq(0).clone();

			let removeText = function ($element) {
				$element
					.contents()
					.filter(function () {
						if (this.nodeType !== 3) {
							removeText($(this));
						}
						return this.nodeType == 3; //Node.TEXT_NODE
					})
					.remove();
			};
			removeText($element);

			let elementHTML = $("<div class='-web-scraper-should-not-be-visible'>")
				.append($element)
				.html();
			return elementHTML;
		} else if (this.clickElementUniquenessType === 'uniqueCSSSelector') {
			let cs = new CssSelector({
				enableSmartTableSelector: false,
				parent: $('body')[0],
				enableResultStripping: false,
			});
			let CSSSelector = cs.getCssSelector([element]);
			return CSSSelector;
		} else {
			throw 'Invalid clickElementUniquenessType ' + this.clickElementUniquenessType;
		}
	}

	isAdded(element) {
		let elementUniqueId = this.getElementUniqueId(element);
		let isAdded = elementUniqueId in this.addedElements;
		return isAdded;
	}
}
