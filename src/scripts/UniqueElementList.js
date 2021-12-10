/**
 * Only Elements unique will be added to this array
 * @constructor
 */
import CssSelector from '../libs/css-selector/lib/CssSelector';

export default class UniqueElementList extends Array {
	constructor(clickElementUniquenessType) {
		super();
		this.clickElementUniquenessType = clickElementUniquenessType;
		this.addedElements = {};
	}

	push(element) {
		const getStyles = function (_elem, _style) {
			let computedStyle;
			if (typeof _elem.currentStyle !== 'undefined') {
				computedStyle = _elem.currentStyle;
			} else {
				computedStyle = document.defaultView.getComputedStyle(_elem, null);
			}
			return _style ? computedStyle[_style] : computedStyle;
		};

		const copyComputedStyle = function (src, dest) {
			const styles = getStyles(src);
			for (const i in styles) {
				// Do not use `hasOwnProperty`, nothing will get copied
				if (typeof i === 'string' && i != 'cssText' && !/\d/.test(i)) {
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
		}
		const elementUniqueId = this.getElementUniqueId(element);
		this.addedElements[elementUniqueId] = true;
		const clone = $(element).clone(true)[0];

		// clone computed styles (to extract images from background)
		const items = element.getElementsByTagName('*');
		const itemsCloned = clone.getElementsByTagName('*');
		$(items).each(function (i, item) {
			copyComputedStyle(item, itemsCloned[i]);
		});

		Array.prototype.push.call(this, clone);
		return true;
	}

	getElementUniqueId(element) {
		if (this.clickElementUniquenessType === 'uniqueText') {
			const elementText = $(element).text().trim();
			return elementText;
		}
		if (this.clickElementUniquenessType === 'uniqueHTMLText') {
			const elementHTML = $("<div class='-web-scraper-should-not-be-visible'>")
				.append($(element).eq(0).clone())
				.html();
			return elementHTML;
		}
		if (this.clickElementUniquenessType === 'uniqueHTML') {
			// get element without text
			const $element = $(element).eq(0).clone();

			const removeText = function ($element) {
				$element
					.contents()
					.filter(function () {
						if (this.nodeType !== 3) {
							removeText($(this));
						}
						return this.nodeType == 3; // Node.TEXT_NODE
					})
					.remove();
			};
			removeText($element);

			const elementHTML = $("<div class='-web-scraper-should-not-be-visible'>")
				.append($element)
				.html();
			return elementHTML;
		}
		if (this.clickElementUniquenessType === 'uniqueCSSSelector') {
			const cs = new CssSelector({
				enableSmartTableSelector: false,
				parent: $('body')[0],
				enableResultStripping: false,
			});
			const CSSSelector = cs.getCssSelector([element]);
			return CSSSelector;
		}
		throw `Invalid clickElementUniquenessType ${this.clickElementUniquenessType}`;
	}

	isAdded(element) {
		const elementUniqueId = this.getElementUniqueId(element);
		const isAdded = elementUniqueId in this.addedElements;
		return isAdded;
	}
}
