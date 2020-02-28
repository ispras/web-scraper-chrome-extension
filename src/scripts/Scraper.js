import Job from './Job';
import '../libs/jquery.whencallsequentially';
import Base64 from './Base64';
import * as nanoid from 'nanoid';

export default class Scraper {
	/**
	 * Scraping delay between two page opening requests
	 */
	constructor(options) {
		this.queue = options.queue;
		this.sitemap = options.sitemap;
		this.store = options.store;
		this.browser = options.browser;
		this.resultWriter = null; // db instance for scraped data writing
		this.requestInterval = 2000;
		this._timeNextScrapeAvailable = 0;
		this.requestInterval = parseInt(options.requestInterval);
		this.requestIntervalRandomness = parseInt(options.requestIntervalRandomness);
		this.pageLoadDelay = parseInt(options.pageLoadDelay);
		this.downloadPaths = new Map(); // url -> local path
	}

	initFirstJobs() {
		var urls = this.sitemap.getStartUrls();

		urls.forEach(
			function(url) {
				var firstJob = new Job(url, '_root', this);
				this.queue.add(firstJob);
			}.bind(this)
		);
	}

	run(executionCallback) {
		var scraper = this;

		// callback when scraping is finished
		this.executionCallback = executionCallback;

		this.initFirstJobs();

		this.store.initSitemapDataDb(this.sitemap._id).then(function(resultWriter) {
			scraper.resultWriter = resultWriter;
			scraper._run();
		});
	}

	recordCanHaveChildJobs(record) {
		if (record._follow === undefined) {
			return false;
		}

		var selectorId = record._followSelectorId;
		var childSelectors = this.sitemap.getDirectChildSelectors(selectorId);
		if (childSelectors.length === 0) {
			return false;
		} else {
			return true;
		}
	}

	getFileFilename(url) {
		var parts = url.split('/');
		var filename = parts[parts.length - 1];
		filename = filename.replace(/\?/g, '');
		if (filename.length > 130) {
			filename = filename.substr(0, 130);
		}
		return filename;
	}

	/**
	 * Save files for user if the records contains them
	 * @param record
	 */
	saveFile(record) {
		let deferredResponse = $.Deferred();
		let downloads = [];
		let prefixLength = '_fileBase64-'.length;

		for (let attr in record) {
			if (attr.substr(0, prefixLength) === '_fileBase64-') {
				let selectorId = attr.substring(prefixLength, attr.length);
				let url = record[selectorId + '-src'] || record[selectorId + '-href'];
				let fileBase64 = record['_fileBase64-' + selectorId];
				let filename = record['_filename' + selectorId];
				let fileMimeType = record['_fileMimeType-' + selectorId];
				delete record['_fileBase64-' + selectorId];
				delete record['_filename' + selectorId];
				delete record['_fileMimeType-' + selectorId];

				if (this.downloadPaths.has(url)) {
					record[selectorId + '-download_path'] = this.downloadPaths.get(url);
					continue;
				}

				let downloadPath = this.sitemap._id + '/' + selectorId + '/' + nanoid(10) + '--' + filename;
				this.downloadPaths.set(url, downloadPath);
				record[selectorId + '-download_path'] = downloadPath;

				downloads.push(
					Base64.base64ToBlob(fileBase64, fileMimeType).then(blob => {
						let downloadUrl = window.URL.createObjectURL(blob);
						return this.browser.downloadFile(downloadUrl, downloadPath);
					})
				);
			}
		}

		Promise.allSettled(downloads).then(deferredResponse.resolve);
		return deferredResponse.promise();
	}

	// @TODO remove recursion and add an iterative way to run these jobs.
	_run() {
		var job = this.queue.getNextJob();
		if (job === false) {
			console.log('Scraper execution is finished');
			this.executionCallback();
			return;
		}

		job.execute(
			this.browser,
			function(job) {
				var scrapedRecords = [];
				var deferredDatamanipulations = [];

				var records = job.getResults();
				records.forEach(
					function(record) {
						//var record = JSON.parse(JSON.stringify(rec));

						deferredDatamanipulations.push(this.saveFile.bind(this, record));

						// @TODO refactor job exstraction to a seperate method
						if (this.recordCanHaveChildJobs(record)) {
							// var followSelectorId = record._followSelectorId;
							var followURL = record['_follow'];
							var followSelectorId = record['_followSelectorId'];
							delete record['_follow'];
							delete record['_followSelectorId'];
							var newJob = new Job(followURL, followSelectorId, this, job, record);
							if (this.queue.canBeAdded(newJob)) {
								this.queue.add(newJob);
							}
							// store already scraped links
							else {
								console.log('Ignoring next');
								console.log(record);
								//						scrapedRecords.push(record);
							}
						} else {
							if (record._follow !== undefined) {
								delete record['_follow'];
								delete record['_followSelectorId'];
							}
							scrapedRecords.push(record);
						}
					}.bind(this)
				);

				$.whenCallSequentially(deferredDatamanipulations).done(
					function() {
						this.store.saveSitemap(this.sitemap, function() {});
						this.resultWriter.writeDocs(scrapedRecords).then(() => {
							var now = new Date().getTime();
							// delay next job if needed
							this._timeNextScrapeAvailable = now + this.requestInterval + Math.random() * this.requestIntervalRandomness;
							if (now >= this._timeNextScrapeAvailable) {
								this._run();
							} else {
								var delay = this._timeNextScrapeAvailable - now;
								setTimeout(
									function() {
										this._run();
									}.bind(this),
									delay
								);
							}
						});
					}.bind(this)
				);
			}.bind(this)
		);
	}
}
