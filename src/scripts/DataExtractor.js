import Sitemap from './Sitemap';
import SelectorList from './SelectorList';
import '../libs/jquery.whencallsequentially';
import 'sugar';

export default class DataExtractor {
	constructor(options) {
		if (options.sitemap instanceof Sitemap) {
			this.sitemap = options.sitemap;
		} else {
			this.sitemap = Sitemap.sitemapFromObj(options.sitemap);
		}

		this.parentSelectorId = options.parentSelectorId;
		this.parentElement = options.parentElement || $('html')[0];
	}

	/**
	 * Returns a list of independent selector lists. follow=true splits selectors in trees.
	 * Two side by side type=multiple selectors split trees.
	 */
	findSelectorTrees() {
		return this._findSelectorTrees(this.parentSelectorId, new SelectorList());
	}

	/**
	 * the selector cannot return multiple records and it also cannot create new jobs. Also all of its child selectors
	 * must have the same features
	 * @param selector
	 * @returns {boolean}
	 */
	selectorIsCommonToAllTrees(selector) {
		// selectors which return mutiple items cannot be common to all
		// selectors
		if (selector.willReturnMultipleRecords()) {
			return false;
		}

		// Link selectors which will follow to a new page also cannot be common
		// to all selectors
		if (
			selector.canCreateNewJobs() &&
			this.sitemap.getDirectChildSelectors(selector.uuid).length > 0
		) {
			return false;
		}

		// also all child selectors must have the same features
		const childSelectors = this.sitemap.getAllSelectors(selector.uuid);
		for (const i in childSelectors) {
			const childSelector = childSelectors[i];
			if (!this.selectorIsCommonToAllTrees(childSelector)) {
				return false;
			}
		}
		return true;
	}

	getSelectorsCommonToAllTrees(parentSelectorId) {
		const commonSelectors = [];
		const childSelectors = this.sitemap.getDirectChildSelectors(parentSelectorId);

		childSelectors.forEach(
			function (childSelector) {
				if (this.selectorIsCommonToAllTrees(childSelector)) {
					commonSelectors.push(childSelector);
					// also add all child selectors which. Child selectors were also checked

					const selectorChildSelectors = this.sitemap.getAllSelectors(childSelector.uuid);
					selectorChildSelectors.forEach(function (selector) {
						if (commonSelectors.indexOf(selector) === -1) {
							commonSelectors.push(selector);
						}
					});
				}
			}.bind(this)
		);

		return commonSelectors;
	}

	_findSelectorTrees(parentSelectorId, commonSelectorsFromParent) {
		const commonSelectors = commonSelectorsFromParent.concat(
			this.getSelectorsCommonToAllTrees(parentSelectorId)
		);

		// find selectors that will be making a selector tree
		let selectorTrees = [];
		const childSelectors = this.sitemap.getDirectChildSelectors(parentSelectorId);
		childSelectors.forEach(
			function (selector) {
				if (!this.selectorIsCommonToAllTrees(selector)) {
					// this selector will be making a new selector tree. But this selector might contain some child
					// selectors that are making more trees so here should be a some kind of seperation for that
					if (!selector.canHaveLocalChildSelectors()) {
						const selectorTree = commonSelectors.concat([selector]);
						selectorTrees.push(selectorTree);
					} else {
						// find selector tree within this selector
						const commonSelectorsFromParent = commonSelectors.concat([selector]);
						const childSelectorTrees = this._findSelectorTrees(
							selector.uuid,
							commonSelectorsFromParent
						);
						selectorTrees = selectorTrees.concat(childSelectorTrees);
					}
				}
			}.bind(this)
		);

		// it there were not any selectors that make a separate tree then all common selectors make up a single selector tree
		if (selectorTrees.length === 0) {
			return [commonSelectors];
		}
		return selectorTrees;
	}

	getSelectorTreeCommonData(selectors, parentSelectorId, parentElement) {
		const childSelectors = selectors.getDirectChildSelectors(parentSelectorId);
		const deferredDataCalls = [];
		childSelectors.forEach(
			function (selector) {
				if (!selectors.willReturnMultipleRecords(selector.uuid)) {
					deferredDataCalls.push(
						this.getSelectorCommonData.bind(this, selectors, selector, parentElement)
					);
				}
			}.bind(this)
		);

		const deferredResponse = $.Deferred();
		$.whenCallSequentially(deferredDataCalls).done(function (responses) {
			let commonData = {};
			responses.forEach(function (data) {
				commonData = Object.merge(commonData, data);
			});
			deferredResponse.resolve(commonData);
		});

		return deferredResponse;
	}

	getSelectorCommonData(selectors, selector, parentElement) {
		const d = $.Deferred();
		const deferredData = selector.getData(parentElement);
		deferredData.then(
			function (data) {
				if (selector.willReturnElements()) {
					if (selector.multiple && selector.mergeIntoList) {
						$.whenCallSequentially(
							data.map(
								function (element) {
									return this.getSelectorTreeData.bind(
										this,
										selectors,
										selector.uuid,
										element,
										{}
									);
								}.bind(this)
							)
						).done(function (results) {
							d.resolve({ [selector.id]: results.flat() });
						});
					} else {
						const newParentElement = data[0];
						const deferredChildCommonData = this.getSelectorTreeCommonData(
							selectors,
							selector.uuid,
							newParentElement
						);
						deferredChildCommonData.done(function (data) {
							d.resolve(data);
						});
					}
				} else {
					d.resolve(data[0]);
				}
			}.bind(this)
		);

		return d;
	}

	/**
	 * Returns all data records for a selector that can return multiple records
	 */
	getMultiSelectorData(selectors, selector, parentElement, commonData) {
		const deferredResponse = $.Deferred();

		// if the selector is not an Element selector then its fetched data is the result.
		if (!selector.willReturnElements()) {
			const deferredData = selector.getData(parentElement);
			deferredData.then(function (selectorData) {
				const newCommonData = Object.clone(commonData, true);
				const resultData = [];

				selectorData.forEach(function (record) {
					Object.merge(record, newCommonData, true);
					resultData.push(record);
				});

				deferredResponse.resolve(resultData);
			});

			return deferredResponse;
		}

		// handle situation when this selector is an elementSelector
		const deferredData = selector.getData(parentElement);
		deferredData.then(
			function (selectorData) {
				const deferredDataCalls = [];

				selectorData.forEach(
					function (element) {
						const newCommonData = Object.clone(commonData, true);
						const childRecordDeferredCall = this.getSelectorTreeData.bind(
							this,
							selectors,
							selector.uuid,
							element,
							newCommonData
						);
						deferredDataCalls.push(childRecordDeferredCall);
					}.bind(this)
				);

				$.whenCallSequentially(deferredDataCalls).done(function (responses) {
					const resultData = [];
					responses.forEach(function (childRecordList) {
						childRecordList.forEach(function (childRecord) {
							const rec = {};
							Object.merge(rec, childRecord, true);
							resultData.push(rec);
						});
					});
					deferredResponse.resolve(resultData);
				});
			}.bind(this)
		);

		return deferredResponse;
	}

	getSelectorTreeData(selectors, parentSelectorId, parentElement, commonData) {
		const childSelectors = selectors.getDirectChildSelectors(parentSelectorId);
		const childCommonDataDeferred = this.getSelectorTreeCommonData(
			selectors,
			parentSelectorId,
			parentElement
		);
		const deferredResponse = $.Deferred();

		childCommonDataDeferred.done(
			function (childCommonData) {
				commonData = Object.merge(commonData, childCommonData);

				const dataDeferredCalls = [];

				childSelectors.forEach(
					function (selector) {
						if (selectors.willReturnMultipleRecords(selector.uuid)) {
							const newCommonData = Object.clone(commonData, true);
							const dataDeferredCall = this.getMultiSelectorData.bind(
								this,
								selectors,
								selector,
								parentElement,
								newCommonData
							);
							dataDeferredCalls.push(dataDeferredCall);
						}
					}.bind(this)
				);

				// merge all data records together
				$.whenCallSequentially(dataDeferredCalls).done(function (responses) {
					const resultData = [];
					responses.forEach(function (childRecords) {
						childRecords.forEach(function (childRecord) {
							const rec = {};
							Object.merge(rec, childRecord, true);
							resultData.push(rec);
						});
					});

					if (resultData.length === 0) {
						// If there are no multi record groups then return common data.
						// In a case where common data is empty return nothing.
						if (Object.keys(commonData).length === 0) {
							deferredResponse.resolve([]);
						} else {
							deferredResponse.resolve([commonData]);
						}
					} else {
						deferredResponse.resolve(resultData);
					}
				});
			}.bind(this)
		);

		return deferredResponse;
	}

	/**
	 * Extracts '_attachments-XXX' properties and merges them into single top-level
	 * '_attachments' property.
	 */
	manageAttachments(dataObject) {
		function popAttachments(data) {
			if (Array.isArray(data)) {
				return data.flatMap(popAttachments);
			}
			if (Object.isObject(data)) {
				return Object.entries(data).flatMap(([key, value]) => {
					if (key.startsWith('_attachments-')) {
						delete data[key];
						return value;
					}
					return popAttachments(value);
				});
			}
			return [];
		}

		const attachments = popAttachments(dataObject);
		const uniqueAttachments = new Map();
		attachments.forEach(attachment => {
			const { url } = attachment;
			if (!uniqueAttachments.has(url)) {
				uniqueAttachments.set(url, attachment);
			}
		});

		if (uniqueAttachments.size) {
			dataObject._attachments = [...uniqueAttachments.values()];
		}
	}

	getData() {
		const selectorTrees = this.findSelectorTrees();
		const dataDeferredCalls = [];

		selectorTrees.forEach(
			function (selectorTree) {
				const deferredTreeDataCall = this.getSelectorTreeData.bind(
					this,
					selectorTree,
					this.parentSelectorId,
					this.parentElement,
					{}
				);
				dataDeferredCalls.push(deferredTreeDataCall);
			}.bind(this)
		);

		const responseDeferred = $.Deferred();
		$.whenCallSequentially(dataDeferredCalls).done(
			function (responses) {
				let results = [];
				responses.forEach(function (dataResults) {
					results = results.concat(dataResults);
				});
				results.forEach(this.manageAttachments);
				results.forEach(dataObject => {
					dataObject._url = window.location.href;
					dataObject._timestamp = Date.now();
				});
				responseDeferred.resolve(results);
			}.bind(this)
		);
		return responseDeferred;
	}

	getSingleSelectorData(parentSelectorIds, selectorId) {
		// to fetch only single selectors data we will create a sitemap that only contains this selector, his
		// parents and all child selectors
		const { sitemap } = this;
		const selector = this.sitemap.selectors.getSelectorByUid(selectorId);
		const childSelectors = sitemap.selectors.getAllSelectors(selectorId);
		const parentSelectors = [];
		for (let i = parentSelectorIds.length - 1; i >= 0; i--) {
			const id = parentSelectorIds[i];
			if (id === this.sitemap.rootSelector.uuid) break;
			const parentSelector = this.sitemap.selectors.getSelectorByUid(id);
			parentSelectors.push(parentSelector);
		}

		// merge all needed selectors together
		const selectors = parentSelectors.concat(childSelectors);
		selectors.push(selector);
		sitemap.selectors = new SelectorList(selectors);

		let parentSelectorId;
		// find the parent that leaded to the page where required selector is being used
		for (let i = parentSelectorIds.length - 1; i >= 0; i--) {
			const id = parentSelectorIds[i];
			if (id === this.sitemap.rootSelector.uuid) {
				parentSelectorId = id;
				break;
			}
			const parentSelector = this.sitemap.selectors.getSelectorByUid(parentSelectorIds[i]);
			if (!parentSelector.willReturnElements()) {
				parentSelectorId = id;
				break;
			}
		}
		this.parentSelectorId = parentSelectorId;

		return this.getData();
	}
}
