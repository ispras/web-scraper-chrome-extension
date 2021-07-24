import SparkMD5 from 'spark-md5';
import ElementQuery from './ElementQuery';
import Base64 from './Base64';
import * as chrono from 'chrono-node';

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

		let regex = function (content, regex_pattern, regexgroup) {
			try {
				const regex = new RegExp(regex_pattern);
				const match = regex.exec(content);

				if (match == null) {
					return;
				}

				if (!regexgroup) {
					return match.groups ? match.groups : match[0];
				}
				const res = {};

				const selectedGroups = regexgroup.split(',');

				if (selectedGroups.length == 1) {
					if (isNaN(group) && match.groups) {
						return match.groups[group];
					} else {
						return match[group];
					}
				}

				for (const group of selectedGroups) {
					if (isNaN(group) && match.groups) {
						res[group] = match.groups[group];
					} else {
						res[group] = match[group];
					}
				}
				return res;
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

		let removeSuffix = function (content, suffix) {
			if (content.endsWith(suffix)) {
				return content.slice(0, content.length - suffix.length);
			}
		};

		let removePrefix = function (content, prefix) {
			if (content.startsWith(prefix)) {
				return content.slice(prefix.length);
			}
		};

		let applyTextManipulation = function (content) {
			let isString = typeof content === 'string' || content instanceof String,
				isUnderlyingString = !isString && $(content).text() !== '';

			if (!isString && !isUnderlyingString) {
				return content;
			}

			content = isString ? content : $(content).text();

			const toDo = [];

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
					toDo.push([
						this.textmanipulation.regexPriority,
						content => regex(content, value, group),
					]);
				}
			}

			if (propertyIsAvailable('removeHtml')) {
				if (this.textmanipulation.removeHtml) {
					toDo.push([
						this.textmanipulation.removeHtmlPriority,
						content => removeHtml(content),
					]);
				}
			}

			if (propertyIsAvailable('trimText')) {
				if (this.textmanipulation.trimText) {
					toDo.push([
						this.textmanipulation.trimTextPriority,
						content => trimText(content),
					]);
				}
			}

			if (propertyIsAvailable('replaceText')) {
				if (this.textmanipulation.replaceText !== '') {
					let replacement = this.textmanipulation.replacementText;
					replacement = typeof replacement != 'undefined' ? replacement : '';

					toDo.push([
						this.textmanipulation.replacePriority,
						content =>
							replaceText(content, this.textmanipulation.replaceText, replacement),
					]);
				}
			}

			if (propertyIsAvailable('textPrefix')) {
				if (this.textmanipulation.textPrefix !== '') {
					toDo.push([
						this.textmanipulation.textSuffixPriority,
						content => textPrefix(content, this.textmanipulation.textPrefix),
					]);
				}
			}

			if (propertyIsAvailable('textSuffix')) {
				if (this.textmanipulation.textSuffix !== '') {
					toDo.push([
						this.textmanipulation.textSuffixPriority,
						content => textSuffix(content, this.textmanipulation.textSuffix),
					]);
				}
			}

			if (propertyIsAvailable('removeTextPrefix')) {
				if (this.textmanipulation.removeTextPrefix !== '') {
					toDo.push([
						this.textmanipulation.removeTextPrefixPriority,
						content => removePrefix(content, this.textmanipulation.removeTextPrefix),
					]);
				}
			}

			if (propertyIsAvailable('removeTextSuffix')) {
				if (this.textmanipulation.removeTextSuffix !== '') {
					toDo.push([
						this.textmanipulation.removeTextPrefixPriority,
						content => removeSuffix(content, this.textmanipulation.removeTextSuffix),
					]);
				}
			}

			toDo.sort((a, b) => b[0] - a[0]);
			content = toDo.reduce((prev, [_, func]) => func(prev), content);

			if (propertyIsAvailable('transform')) {
				switch (this.textmanipulation.transform) {
					case 'float':
						return parseFloat(content);
					case 'integer':
						return parseInt(content);
					case 'date':
						return chrono.parseDate(content);
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
		return this.canReturnMultipleRecords() && this.multiple && !this.mergeIntoList;
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
