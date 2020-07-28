import SparkMD5 from 'spark-md5';
import ElementQuery from './ElementQuery';
import Base64 from './Base64';

export default class Selector {
	constructor(selector) {}

	/**
	 * Update current selector configuration
	 * @param data
	 * @param features
	 */
	updateData(data, features) {
		let allowedKeys = ['id', 'type', 'selector', 'parentSelectors'];
		allowedKeys = allowedKeys.concat(features);

		// update data
		for (let key in data) {
			if (allowedKeys.indexOf(key) !== -1 || typeof data[key] === 'function') {
				this[key] = data[key];
			}
		}

		// remove values that are not needed for this type of selector
		for (let key in this) {
			if (allowedKeys.indexOf(key) === -1 && typeof this[key] !== 'function') {
				delete this[key];
			}
		}
	}

	afterSelect(selector, controller) {
		this.selector = selector;
		controller._editSelector(this);
		return Promise.resolve();
	}

	/**
	 * Manipulates return data from selector.
	 * @param data
	 */
	manipulateData(data) {
		let isTextManipulationDefined =
			typeof this.textmanipulation != 'undefined' && this.textmanipulation !== '';
		if (!isTextManipulationDefined) {
			return data;
		}

		// TODO refactor + selector group semantics
		if (Array.isArray(data)) {
			return data.map(e => this.manipulateData(e));
		}
		if (Object.isObject(data) && this.id in data) {
			data[this.id] = this.manipulateData(data[this.id]);
			return data;
		}

		let regex = function (content, regex, regexgroup) {
			try {
				content = $.trim(content);
				let matches = content.match(new RegExp(regex, 'm')),
					groupDefined = regexgroup !== '';

				regexgroup = groupDefined ? regexgroup : 0;

				if (matches !== null && regexgroup in matches) {
					return matches[regexgroup];
				} else {
					return '';
				}
			} catch (e) {
				console.log(
					'%c Skipping regular expression: ' + e.message,
					'background: red; color: white;'
				);
			}
		};

		let removeHtml = function (content) {
			return $('<div/>').html(content).text();
		};

		let trimText = function (content) {
			return content.trim();
		};

		let replaceText = function (content, replaceText, replacementText) {
			let replace;
			try {
				let regex = new RegExp(replaceText, 'gm');
				replace = regex.test(content) ? regex : replaceText;
			} catch (e) {
				replace = replaceText;
			}

			return content.replace(replace, replacementText);
		};

		let textPrefix = function (content, prefix) {
			return (content = prefix + content);
		};

		let textSuffix = function (content, suffix) {
			return (content += suffix);
		};

		let applyTextManipulation = function (content) {
			let isString = typeof content === 'string' || content instanceof String,
				isUnderlyingString = !isString && $(content).text() !== '';

			if (!isString && !isUnderlyingString) {
				return content;
			}

			content = isString ? content : $(content).text();

			// use key in object since unit tests might not define each property
			let keys = [];
			for (let key in this.textmanipulation) {
				if (!this.textmanipulation.hasOwnProperty(key)) {
					continue;
				}
				keys.push(key);
			}

			function propertyIsAvailable(key) {
				return keys.indexOf(key) >= 0;
			}

			if (propertyIsAvailable('regex')) {
				let group = this.textmanipulation.regexgroup;
				let value = this.textmanipulation.regex;
				group = typeof group != 'undefined' ? group : '';
				if (value !== '') {
					content = regex(content, value, group);
				}
			}

			if (propertyIsAvailable('removeHtml')) {
				if (this.textmanipulation.removeHtml) {
					content = removeHtml(content);
				}
			}

			if (propertyIsAvailable('trimText')) {
				if (this.textmanipulation.trimText) {
					content = trimText(content);
				}
			}

			if (propertyIsAvailable('replaceText')) {
				let replacement = this.textmanipulation.replacementText;
				replacement = typeof replacement != 'undefined' ? replacement : '';
				content = replaceText(content, this.textmanipulation.replaceText, replacement);
			}

			if (propertyIsAvailable('textPrefix')) {
				if (this.textmanipulation.textPrefix !== '') {
					content = textPrefix(content, this.textmanipulation.textPrefix);
				}
			}

			if (propertyIsAvailable('textSuffix')) {
				if (this.textmanipulation.textSuffix !== '') {
					content = textSuffix(content, this.textmanipulation.textSuffix);
				}
			}

			return content;
		}.bind(this);

		return applyTextManipulation(data);
	}

	/**
	 * Is this selector configured to return multiple items?
	 * @returns {boolean}
	 */
	willReturnMultipleRecords() {
		return this.canReturnMultipleRecords() && this.multiple;
	}

	/**
	 * CSS selector which will be used for element selection
	 * @returns {string}
	 */
	getItemCSSSelector() {
		return '*';
	}

	/**
	 * Check whether a selector is a paren selector of this selector
	 * @param selectorId
	 * @returns {boolean}
	 */
	hasParentSelector(selectorId) {
		return this.parentSelectors.indexOf(selectorId) !== -1;
	}

	removeParentSelector(selectorId) {
		let index = this.parentSelectors.indexOf(selectorId);
		if (index !== -1) {
			this.parentSelectors.splice(index, 1);
		}
	}

	renameParentSelector(originalId, replacementId) {
		if (this.hasParentSelector(originalId)) {
			let pos = this.parentSelectors.indexOf(originalId);
			this.parentSelectors.splice(pos, 1, replacementId);
		}
	}

	getDataElements(parentElement) {
		let elements = ElementQuery(this.selector, parentElement);
		if (this.multiple) {
			return elements;
		} else if (elements.length > 0) {
			return [elements[0]];
		} else {
			return [];
		}
	}

	stringReplace(url, stringReplacement) {
		if (stringReplacement && stringReplacement.replaceString) {
			let replace;
			let replacement = stringReplacement.replacementString || '';
			try {
				let regex = new RegExp(stringReplacement.replaceString, 'gm');
				replace = regex.test(url) ? regex : stringReplacement.replaceString;
			} catch (e) {
				replace = stringReplacement.replaceString;
			}

			return url.replace(replace, replacement);
		} else {
			return url;
		}
	}

	getElementCSSSelector(element) {
		function localCssSelector(element) {
			const tagName = element.tagName.toLocaleLowerCase();
			if (tagName === 'html' || tagName === 'body') {
				return tagName;
			}
			let nthChild = 1;
			let prevSibling = element.previousElementSibling;
			while (prevSibling) {
				nthChild++;
				prevSibling = prevSibling.previousElementSibling;
			}
			return `${tagName}:nth-child(${nthChild})`;
		}

		let cssSelector = localCssSelector(element);
		let parent = element.parentElement;
		while (parent) {
			cssSelector = `${localCssSelector(parent)}>${cssSelector}`;
			parent = parent.parentElement;
		}

		return cssSelector;
	}

	async getData(parentElement) {
		const timeout = parseInt(this.delay);
		if (timeout) {
			await new Promise(resolve => setTimeout(resolve, timeout));
		}
		const data = await this._getData(parentElement);
		return this.manipulateData(data);
	}

	downloadsAttachments() {
		return false;
	}

	getFilenameFromUrl(url) {
		const parts = url.split('/');
		let filename = parts[parts.length - 1];
		[filename] = filename.split('?', 1);
		[filename] = filename.split('#', 1);
		return filename;
	}

	async downloadFileAsBase64(url) {
		const response = await fetch(url);
		const blob = await response.blob();
		const mimeType = blob.type;
		const fileBase64 = await Base64.blobToBase64(blob);
		const checksum = SparkMD5.ArrayBuffer.hash(await blob.arrayBuffer());
		const result = { url, mimeType, fileBase64, checksum };
		const contentDisposition = response.headers.get('Content-Disposition');
		if (contentDisposition) {
			const filenameMatch = /filename="(.*?)"/.exec(contentDisposition);
			if (filenameMatch) {
				const [, filename] = filenameMatch;
				result.filename = filename;
			}
		}
		return result;
	}
}
