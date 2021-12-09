export default class Queue {
	constructor() {
		this.jobs = [];
		this.scrapedUrls = {};
	}

	/**
	 * Returns false if page is already scraped
	 * @param job
	 * @returns {boolean}
	 */
	add(job) {
		if (this.canBeAdded(job)) {
			this.jobs.push(job);
			this._setUrlScraped(job.url);
			return true;
		}
		return false;
	}

	canBeAdded(job) {
		if (this.isScraped(job.url)) {
			return false;
		}

		// reject documents
		if (job.url.match(/\.(doc|docx|pdf|ppt|pptx|odt)$/i) !== null) {
			return false;
		}
		return true;
	}

	getQueueSize() {
		return this.jobs.length;
	}

	isScraped(url) {
		return this.scrapedUrls[url] !== undefined;
	}

	_setUrlScraped(url) {
		this.scrapedUrls[url] = true;
	}

	getNextJob() {
		// @TODO test this
		if (this.getQueueSize() > 0) {
			return this.jobs.pop();
		}
		return false;
	}
}
