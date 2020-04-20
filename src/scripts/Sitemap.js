import DatePatternSupport from './DateUtils/DatePatternSupport';
import SelectorList from './SelectorList';
import Model from './Model';
import * as Papa from 'papaparse';

export default class Sitemap {
	constructor(id, startUrls, model, selectors) {
		this._id = id;
		this.startUrls = startUrls;
		this.model = new Model(model);
		this.selectors = new SelectorList(selectors ? selectors : []);
	}

	static sitemapFromObj(sitemapObj) {
		let sitemap = new Sitemap(sitemapObj._id, sitemapObj.startUrls, sitemapObj.model, sitemapObj.selectors);
		if (sitemapObj._rev) {
			sitemap._rev = sitemapObj._rev;
		}
		return sitemap;
	}

	static isUrlValid(url) {
		try {
			new URL(url);
			return true;
		} catch (e) {
			if (e instanceof TypeError) {
				return false;
			}
			throw e;
		}
	}

	static validateStartUrls(startUrls) {
		if (!Array.isArray(startUrls) || !startUrls.length) {
			return false;
		}
		return startUrls.map(item => item.trim()).every(this.isUrlValid);
	}

	/**
	 * Returns all selectors or recursively find and return all child selectors of a parent selector.
	 * @param parentSelectorId
	 * @returns {Array}
	 */
	getAllSelectors(parentSelectorId) {
		return this.selectors.getAllSelectors(parentSelectorId);
	}

	/**
	 * Returns only selectors that are directly under a parent
	 * @param parentSelectorId
	 * @returns {Array}
	 */
	getDirectChildSelectors(parentSelectorId) {
		return this.selectors.getDirectChildSelectors(parentSelectorId);
	}

	/**
	 * Returns all selector id parameters
	 * @returns {Array}
	 */
	getSelectorIds() {
		let ids = ['_root'];
		this.selectors.forEach(function(selector) {
			ids.push(selector.id);
		});
		return ids;
	}

	/**
	 * Returns only selector ids which can have child selectors
	 * @returns {Array}
	 */
	getPossibleParentSelectorIds() {
		let ids = ['_root'];
		this.selectors.forEach(
			function(selector) {
				if (selector.canHaveChildSelectors()) {
					ids.push(selector.id);
				}
			}.bind(this)
		);
		return ids;
	}

	getStartUrls() {
		let startUrls = this.startUrls;
		startUrls = DatePatternSupport.expandUrl(startUrls);

		let nextUrls = function(url) {
			let urls = [];
			let lpad = function(str, length) {
				while (str.length < length) str = '0' + str;
				return str;
			};

			let re = /^(.*?)\[(\d+)\-(\d+)(:(\d+))?\](.*)$/;
			let matches = url.match(re);
			if (matches) {
				let startStr = matches[2];
				let endStr = matches[3];
				let start = parseInt(startStr);
				let end = parseInt(endStr);
				let incremental = 1;
				console.log(matches[5]);
				if (matches[5] !== undefined) {
					incremental = parseInt(matches[5]);
				}
				let nextSet = nextUrls(matches[6]);
				for (let i = start; i <= end; i += incremental) {
					let current;

					// with zero padding
					if (startStr.length === endStr.length) {
						current = matches[1] + lpad(i.toString(), startStr.length);
					} else {
						current = matches[1] + i;
					}
					nextSet.forEach(function(next) {
						urls.push(current + next);
					});
				}
			} else {
				urls.push(url);
			}
			return urls;
		};
		let urls = [];

		startUrls.forEach(function(startUrl) {
			urls = urls.concat(nextUrls(startUrl));
		});

		return urls;
	}

	updateSelector(selector, selectorData) {
		// selector is undefined when creating a new one
		if (selector === undefined || selector.type !== selectorData.type) {
			selector = SelectorList.createSelector(selectorData);
		}

		// update child selectors
		if (selector.id !== undefined && selector.id !== selectorData.id) {
			this.selectors.forEach(function(currentSelector) {
				currentSelector.renameParentSelector(selector.id, selectorData.id);
			});

			// update cyclic selector
			let pos = selectorData.parentSelectors.indexOf(selector.id);
			if (pos !== -1) {
				selectorData.parentSelectors.splice(pos, 1, selectorData.id);
			}
		}

		selector.updateData(selectorData, selectorData.getFeatures());

		let index = this.getSelectorIds().indexOf(selector.id);
		if (index === -1) {
			this.selectors.push(selector);
		} else {
			//XXX Hot fix for replacing old selector with another type.
			this.selectors.splice(index - 1, 1, selector);
		}
	}
	deleteSelector(selectorToDelete) {
		this.selectors.forEach(
			function(selector) {
				if (selector.hasParentSelector(selectorToDelete.id)) {
					selector.removeParentSelector(selectorToDelete.id);
					if (selector.parentSelectors.length === 0) {
						this.deleteSelector(selector);
					}
				}
			}.bind(this)
		);

		for (let i in this.selectors) {
			if (this.selectors[i].id === selectorToDelete.id) {
				this.selectors.splice(i, 1);
				break;
			}
		}
	}
	getDataTableId() {
		return this._id.replace(/\./g, '_');
	}
	exportSitemap() {
		function removeEmpty(obj) {
			Object.keys(obj).forEach(function(key) {
				if (obj[key] && typeof obj[key] === 'object') {
					removeEmpty(obj[key]);
					if (Object.keys(obj[key]).length === 0) {
						delete obj[key];
					}
				} else if (obj[key] === false || obj[key] === [] || obj[key] === '') {
					delete obj[key];
				}
			});
		}
		let sitemapObj = JSON.parse(JSON.stringify(this));
		delete sitemapObj._rev;
		removeEmpty(sitemapObj);
		return JSON.stringify(sitemapObj);
	}

	// return a list of columns than can be exported
	getDataColumns() {
		let columns = [];
		this.selectors.forEach(function(selector) {
			columns = columns.concat(selector.getDataColumns());
		});

		let uniqueColumns = [];
		$.each(columns, function(i, e) {
			if ($.inArray(e, uniqueColumns) == -1) uniqueColumns.push(e);
		});

		return uniqueColumns;
	}
	getDataExportCsvBlob(data, option) {
		let delimiterKey = 'delimiter';
		let newlineKey = 'newline';
		let containBomKey = 'containBom';

		let columns = this.getDataColumns(),
			// default delimiter is comma
			delimiter = option.hasOwnProperty(delimiterKey) ? option[delimiterKey] : ',',
			// per default, new line is included at end of lines
			newline = option.hasOwnProperty(newlineKey) ? (option[newlineKey] == true ? '\r\n' : '') : '\r\n',
			// per default, utf8 BOM is included at the beginning.
			prepend = option.hasOwnProperty(containBomKey) ? (option[containBomKey] == true ? '\ufeff' : '') : '\ufeff', // utf-8 bom char
			options = {
				quotes: false,
				quoteChar: '"',
				delimiter: delimiter,
				header: true,
				newline: '\r\n', // between value rows
			},
			jsonData = [];

		// data
		data.forEach(function(row) {
			let jsonRow = {};
			columns.forEach(function(column) {
				let cellData = row[column];
				if (cellData === undefined) {
					cellData = '';
				} else if (typeof cellData === 'object') {
					cellData = JSON.stringify(cellData);
				}

				jsonRow[column] = cellData;
			});
			jsonData.push(jsonRow);
		});

		return new Blob([prepend + Papa.unparse(jsonData, options) + newline], { type: 'text/csv' });
	}
	getSelectorById(selectorId) {
		return this.selectors.getSelectorById(selectorId);
	}
	/**
	 * Create full clone of sitemap
	 * @returns {Sitemap}
	 */
	clone() {
		let clonedObj = JSON.parse(JSON.stringify(this));
		return new Sitemap(clonedObj._id, clonedObj.startUrls, clonedObj.model, clonedObj.selectors);
	}
}
