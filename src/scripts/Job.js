export default class Job {
	constructor(url, parentSelector, scraper, parentJob, baseData, baseDataPath) {
		if (parentJob !== undefined) {
			this.url = this.combineUrls(parentJob.url, url);
		} else {
			this.url = url;
		}
		this.parentSelector = parentSelector;
		this.scraper = scraper;
		this.dataItems = [];
		this.baseData = baseData || {};
		this.baseDataPath = baseDataPath || [];
	}

	combineUrls(parentUrl, childUrl) {
		const urlMatcher = new RegExp(
			'(https?://)?([a-z0-9\\-\\.]+\\.[a-z0-9\\-]+(:\\d+)?|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}(:\\d+)?)?(\\/[^\\?]*\\/|\\/)?([^\\?]*)?(\\?.*)?',
			'i'
		);

		const parentMatches = parentUrl.match(urlMatcher);
		const childMatches = childUrl.match(urlMatcher);

		// special case for urls like this: ?a=1  or like-this/
		if (
			childMatches[1] === undefined &&
			childMatches[2] === undefined &&
			childMatches[5] === undefined &&
			childMatches[6] === undefined
		) {
			const url =
				parentMatches[1] +
				parentMatches[2] +
				parentMatches[5] +
				parentMatches[6] +
				childMatches[7];
			return url;
		}

		if (childMatches[1] === undefined) {
			childMatches[1] = parentMatches[1];
		}
		if (childMatches[2] === undefined) {
			childMatches[2] = parentMatches[2];
		}
		if (childMatches[5] === undefined) {
			if (parentMatches[5] === undefined) {
				childMatches[5] = '/';
			} else {
				childMatches[5] = parentMatches[5];
			}
		}

		if (childMatches[6] === undefined) {
			childMatches[6] = '';
		}
		if (childMatches[7] === undefined) {
			childMatches[7] = '';
		}

		return (
			childMatches[1] + childMatches[2] + childMatches[5] + childMatches[6] + childMatches[7]
		);
	}

	execute(popupBrowser, callback, scope) {
		const { sitemap } = this.scraper;
		const job = this;
		popupBrowser.fetchData(
			this.url,
			sitemap,
			this.parentSelector,
			results => {
				// merge data with data from initialization
				results.forEach(result => {
					const mergedResult = this.mergeWithBaseData(result);
					this.dataItems.push(mergedResult);
				});

				if (sitemap) {
					// table selector can dynamically add columns (addMissingColumns Feature)
					sitemap.selectors = this.scraper.sitemap.selectors;
				}

				console.log(job);
				callback(job);
			},
			this
		);
	}

	mergeWithBaseData(result) {
		const mergedData = structuredClone(this.baseData);
		const { _url, _timestamp, ...resultData } = result;
		const insertAt = this.baseDataPath.reduce((data, key) => data[key] || {}, mergedData);
		Object.assign(mergedData, { _url, _timestamp });
		Object.assign(insertAt, resultData);
		return mergedData;
	}

	getResults() {
		return this.dataItems;
	}
}
