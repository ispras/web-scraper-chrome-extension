import DatePatternSupport from './DateUtils/DatePatternSupport';
import SelectorList from './SelectorList';
import Model from './Model';
import SitemapSpecMigrationManager from './SitemapSpecMigration/Manager';

export default class Sitemap {
	constructor(id, startUrls, urlPattern, model, selectors) {
		this.rootSelector = { id: '_root', uuid: '0' };
		this._id = id;
		this.startUrls = startUrls;
		this.urlPattern = urlPattern;
		this.model = new Model(model);
		this.selectors = new SelectorList(selectors || []);
		this.sitemapSpecificationVersion = SitemapSpecMigrationManager.currentVersion();
	}

	static sitemapFromObj(sitemapObj) {
		sitemapObj = SitemapSpecMigrationManager.applyMigrations(sitemapObj);
		const sitemap = new Sitemap(
			sitemapObj._id,
			sitemapObj.startUrls,
			sitemapObj.urlPattern,
			sitemapObj.model,
			sitemapObj.selectors
		);
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

	static validateUrlPattern(urlPattern) {
		try {
			new RegExp(urlPattern);
			return true;
		} catch (e) {
			return false;
		}
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
	getSelectorUUIDs() {
		const uuids = [this.rootSelector.uuid];
		this.selectors.forEach(function (selector) {
			uuids.push(selector.uuid);
		});
		return uuids;
	}

	/**
	 * Returns only selector ids which can have child selectors
	 * @returns {Array}
	 */
	getPossibleParentSelectorIds() {
		const ids = [{ ...this.rootSelector }];
		this.selectors.forEach(function (selector) {
			if (selector.canHaveChildSelectors()) {
				ids.push({ id: selector.id, uuid: selector.uuid });
			}
		});
		return ids;
	}

	getStartUrls() {
		let { startUrls } = this;
		startUrls = DatePatternSupport.expandUrl(startUrls);

		const nextUrls = function (url) {
			const urls = [];
			const lpad = function (str, length) {
				while (str.length < length) str = `0${str}`;
				return str;
			};

			const re = /^(.*?)\[(\d+)\-(\d+)(:(\d+))?\](.*)$/;
			const matches = url.match(re);
			if (matches) {
				const startStr = matches[2];
				const endStr = matches[3];
				const start = parseInt(startStr);
				const end = parseInt(endStr);
				let incremental = 1;
				console.log(matches[5]);
				if (matches[5] !== undefined) {
					incremental = parseInt(matches[5]);
				}
				const nextSet = nextUrls(matches[6]);
				for (let i = start; i <= end; i += incremental) {
					let current;

					// with zero padding
					if (startStr.length === endStr.length) {
						current = matches[1] + lpad(i.toString(), startStr.length);
					} else {
						current = matches[1] + i;
					}
					nextSet.forEach(function (next) {
						urls.push(current + next);
					});
				}
			} else {
				urls.push(url);
			}
			return urls;
		};
		let urls = [];

		startUrls.forEach(function (startUrl) {
			urls = urls.concat(nextUrls(startUrl));
		});

		return urls;
	}

	updateSelector(selector, newSelectorData, saveChildrenForNewType = false) {
		// selector is undefined when creating a new one and delete old one, if it exist
		if (selector === undefined || selector.type !== newSelectorData.type) {
			if (selector) {
				if (
					selector.canHaveChildSelectors() &&
					newSelectorData.canHaveChildSelectors() &&
					saveChildrenForNewType
				) {
					// custom logic: we don’t delete children, but redefined them a parent
					const children = this.selectors.filter(selectorFromList =>
						selectorFromList.parentSelectors.includes(selector.uuid)
					);
					const newSelector = SelectorList.createSelector(newSelectorData);
					children.forEach(child => {
						const parentUuidIndex = child.parentSelectors.indexOf(selector.uuid);
						child.parentSelectors[parentUuidIndex] = newSelector.uuid;
					});
					selector = newSelector;
				} else {
					this.deleteSelector(selector);
					selector = SelectorList.createSelector(newSelectorData);
				}
			} else {
				selector = SelectorList.createSelector(newSelectorData);
			}
		}

		// update child selectors
		if (selector.uuid !== undefined && selector.uuid !== newSelectorData.uuid) {
			this.selectors.forEach(function (currentSelector) {
				currentSelector.renameParentSelector(selector.uuid, newSelectorData.uuid);
			});

			// update cyclic selector
			const pos = newSelectorData.parentSelectors.indexOf(selector.uuid);
			if (pos !== -1) {
				newSelectorData.parentSelectors.splice(pos, 1, newSelectorData.uuid);
			}
		}

		selector.updateData(newSelectorData, newSelectorData.getFeatures());

		const index = this.getSelectorUUIDs().indexOf(selector.uuid);
		if (index === -1) {
			this.selectors.push(selector);
		} else {
			// XXX Hot fix for replacing old selector with another type.
			this.selectors.splice(index - 1, 1, selector);
		}
	}

	cleanRedundantParents(selectorsList) {
		const currentUuidList = selectorsList.map(selector => selector.uuid);
		currentUuidList.push(this.rootSelector.uuid);
		selectorsList.forEach(selector => {
			selector.parentSelectors = selector.parentSelectors.filter(uuid =>
				currentUuidList.includes(uuid)
			);
		});
		return selectorsList;
	}

	createRemainingSelectorsList(selectorToDelete) {
		const newList = [];
		const selectorsQueue = [this.rootSelector];
		while (selectorsQueue.length > 0) {
			const currentSelector = selectorsQueue.shift();
			const selectorChildren = this.selectors.filter(selector =>
				selector.parentSelectors.includes(currentSelector.uuid)
			);

			selectorChildren.forEach(child => {
				if (child.uuid !== selectorToDelete.uuid && !newList.includes(child)) {
					selectorsQueue.push(child);
					newList.push(child);
				}
			});
		}
		return newList;
	}

	deleteSelector(selectorToDelete) {
		const newListSelectors = this.cleanRedundantParents(
			this.createRemainingSelectorsList(selectorToDelete)
		);
		this.selectors = new SelectorList(newListSelectors);
	}

	getDataTableId() {
		return this._id.replace(/\./g, '_');
	}

	exportSitemap() {
		function removeEmpty(obj) {
			Object.keys(obj).forEach(function (key) {
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
		const sitemapObj = JSON.parse(JSON.stringify(this));
		delete sitemapObj._rev;
		removeEmpty(sitemapObj);
		if (sitemapObj['selectors'] === undefined) {
			sitemapObj['selectors'] = [];
		}
		return JSON.stringify(sitemapObj, null, 2);
	}

	// return a list of columns than can be exported
	getDataColumns() {
		let columns = [];
		this.selectors.forEach(function (selector) {
			columns = columns.concat(selector.getDataColumns());
		});

		const uniqueColumns = [];
		$.each(columns, function (i, e) {
			if ($.inArray(e, uniqueColumns) == -1) uniqueColumns.push(e);
		});

		return uniqueColumns;
	}

	getSelectorByUid(selectorId) {
		return this.selectors.getSelectorByUid(selectorId);
	}

	/**
	 * Create full clone of sitemap
	 * @returns {Sitemap}
	 */
	clone() {
		const clonedObj = JSON.parse(JSON.stringify(this));
		return new Sitemap(
			clonedObj._id,
			clonedObj.startUrls,
			clonedObj.urlPattern,
			clonedObj.model,
			clonedObj.selectors
		);
	}
}
