/**
 * Only Elements unique will be added to this array
 * @constructor
 */
UniqueElementList = function(clickElementUniquenessType) {
	this.clickElementUniquenessType = clickElementUniquenessType;
	this.addedElements = {};
};

UniqueElementList.prototype = new Array;

UniqueElementList.prototype.push = function(element) {

	var getStyles = function(_elem, _style) {
		var computedStyle;
		if ( typeof _elem.currentStyle != 'undefined' ) {
			computedStyle = _elem.currentStyle;
		} else {
			computedStyle = document.defaultView.getComputedStyle(_elem, null);
		}		
		return _style ? computedStyle[_style] : computedStyle;
	};
	
	var copyComputedStyle = function(src, dest) {
		var styles = getStyles(src);
		for ( var i in styles ) {
			// Do not use `hasOwnProperty`, nothing will get copied
			if ( typeof i == "string" && i != "cssText" && !/\d/.test(i) ) {
				// The try is for setter only properties
				try {
					dest.style[i] = styles[i];
					// `fontSize` comes before `font` If `font` is empty, `fontSize` gets
					// overwritten.  So make sure to reset this property. (hackyhackhack)
					// Other properties may need similar treatment
					if ( i == "font" ) {
						dest.style.fontSize = styles.fontSize;
					}
				} catch (e) {}
			}
		}
	};

	if(this.isAdded(element)) {
		return false;
	}
	else {
		var elementUniqueId = this.getElementUniqueId(element);
		this.addedElements[elementUniqueId] = true;
		var clone = $(element).clone(true)[0];	

		// clone computed styles (to extract images from background)		
		var items = element.getElementsByTagName("*");
		var itemsCloned = clone.getElementsByTagName("*");		
		$(items).each(function(i, item) {
			copyComputedStyle(item, itemsCloned[i]);	
		});		
		
		Array.prototype.push.call(this, clone);
		return true;
	}
};

UniqueElementList.prototype.getElementUniqueId = function(element) {

	if(this.clickElementUniquenessType === 'uniqueText') {
		var elementText = $(element).text().trim();
		return elementText;
	}
	else if(this.clickElementUniquenessType === 'uniqueHTMLText') {

		var elementHTML =  $("<div class='-web-scraper-should-not-be-visible'>").append($(element).eq(0).clone()).html();
		return elementHTML;
	}
	else if(this.clickElementUniquenessType === 'uniqueHTML') {

		// get element without text
		var $element = $(element).eq(0).clone();

		var removeText = function($element) {
			$element.contents()
				.filter(function() {
					if(this.nodeType !== 3) {
						removeText($(this));
					}
					return this.nodeType == 3; //Node.TEXT_NODE
				}).remove();
		};
		removeText($element);

		var elementHTML =  $("<div class='-web-scraper-should-not-be-visible'>").append($element).html();
		return elementHTML;
	}
	else if(this.clickElementUniquenessType === 'uniqueCSSSelector') {
		var cs = new CssSelector({
			enableSmartTableSelector: false,
			parent: $("body")[0],
			enableResultStripping:false
		});
		var CSSSelector = cs.getCssSelector([element]);
		return CSSSelector;
	}
	else {
		throw "Invalid clickElementUniquenessType "+this.clickElementUniquenessType;
	}
};

UniqueElementList.prototype.isAdded = function(element) {

	var elementUniqueId = this.getElementUniqueId(element);
	var isAdded = elementUniqueId in this.addedElements;
	return isAdded;
};
