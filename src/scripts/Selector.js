import ElementQuery from './ElementQuery';

export default class Selector {
	constructor(selector) {
		// if (selector.type === 'ConstantValue'){
		// 	this = new ConstantValue(selector);
		// }
		// this.updateData(['id', 'type', 'selector', 'parentSelectors']);
		// this.initType();
	}

	/**
	 * Update current selector configuration
	 * @param data
	 */
	updateData(data, features) {
		let allowedKeys = ['id', 'type', 'selector', 'parentSelectors'];
		//XXX no need in information from window
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

	/**
	 * override objects methods based on seletor type
	 */
	initType() {
		// if (window[this.type] === undefined) {
		// 	throw 'Selector type not defined ' + this.type;
		// }
		//
		// // overrides objects methods
		// for (let i in window[this.type]) {
		// 	this[i] = window[this.type][i];
		// }
	}

	/**
	 * Manipulates return data from selector.
	 * @param data
	 */
	manipulateData(data) {
		let regex = function(content, regex, regexgroup) {
			try {
				content = $.trim(content);
				let matches = content.match(new RegExp(regex, 'gm')),
					groupDefined = regexgroup !== '';

				regexgroup = groupDefined ? regexgroup : 0;

				if (matches !== null) {
					return matches[regexgroup];
				} else {
					return '';
				}
			} catch (e) {
				console.log('%c Skipping regular expression: ' + e.message, 'background: red; color: white;');
			}
		};

		let removeHtml = function(content) {
			return $('<div/>')
				.html(content)
				.text();
		};

		let trimText = function(content) {
			return content.trim();
		};

		let replaceText = function(content, replaceText, replacementText) {
			let replace;
			try {
				let regex = new RegExp(replaceText, 'gm');
				replace = regex.test(content) ? regex : replaceText;
			} catch (e) {
				replace = replaceText;
			}

			return content.replace(replace, replacementText);
		};

		let textPrefix = function(content, prefix) {
			return (content = prefix + content);
		};

		let textSuffix = function(content, suffix) {
			return (content += suffix);
		};

		$(data).each(
			function(i, element) {
				let content = element[this.id],
					isString = typeof content === 'string' || content instanceof String,
					isUnderlyingString = !isString && $(content).text() !== '',
					isArray = Array.isArray(content),
					isTextmManipulationDefined = typeof this.textmanipulation != 'undefined' && this.textmanipulation !== '',
					textManipulationAvailable = (isString || isUnderlyingString) && isTextmManipulationDefined;

				if (textManipulationAvailable) {
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

					element[this.id] = content;
				} else if (isArray && isTextmManipulationDefined) {
					element[this.id] = JSON.stringify(content);
					this.manipulateData(element);
				}
			}.bind(this)
		);
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

	getData(parentElement) {
		let d = $.Deferred();
		let timeout = this.delay || 0;

		// this works much faster because $.whenCallSequentially isn't running next data extraction immediately
		if (timeout === 0) {
			let deferredData = this._getData(parentElement);
			deferredData.done(
				function(data) {
					this.manipulateData(data);
					d.resolve(data);
				}.bind(this)
			);
		} else {
			setTimeout(
				function() {
					let deferredData = this._getData(parentElement);
					deferredData.done(
						function(data) {
							this.manipulateData(data);
							d.resolve(data);
						}.bind(this)
					);
				}.bind(this),
				timeout
			);
		}

		return d.promise();
	}

	getFilenameFromUrl(url) {
		let parts = url.split('/');
		let filename = parts[parts.length - 1];
		filename = filename.replace(/\?/g, '');
		if (filename.length > 130) {
			filename = filename.substr(0, 130);
		}
		return filename;
	}

	downloadFileAsBase64(url) {
		let deferredResponse = $.Deferred();
		let xhr = new XMLHttpRequest();
		let fileName = this.getFilenameFromUrl(url);
		xhr.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (this.status == 200) {
					let blob = this.response;
					let mimeType = blob.type;
					let deferredBlob = Base64.blobToBase64(blob);

					deferredBlob.done(function(fileBase64) {
						deferredResponse.resolve({
							mimeType: mimeType,
							fileBase64: fileBase64,
							filename: fileName,
						});
					});
				} else {
					deferredResponse.reject(xhr.statusText);
				}
			}
		};
		xhr.open('GET', url);
		xhr.responseType = 'blob';
		xhr.send();

		return deferredResponse.promise();
	}
}
