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
		const urls = this.sitemap.getStartUrls();

		urls.forEach(
			function (url) {
				const firstJob = new Job(url, this.sitemap.rootSelector.uuid, this);
				this.queue.add(firstJob);
			}.bind(this)
		);
	}

	run(executionCallback) {
		const scraper = this;

		// callback when scraping is finished
		this.executionCallback = executionCallback;

		this.initFirstJobs();

		this.store.initSitemapDataDb(this.sitemap._id).then(function (resultWriter) {
			scraper.resultWriter = resultWriter;
			scraper._run();
		});
	}

	recordCanHaveChildJobs(record) {
		if (record._follow === undefined) {
			return false;
		}

		const selectorId = record._followSelectorId;
		const childSelectors = this.sitemap.getDirectChildSelectors(selectorId);
		if (childSelectors.length === 0) {
			return false;
		}
		return true;
	}

	generateDownloadPath(filename, maxLength = 100) {
		// TODO consider using URL-based hash
		const path = `${this.sitemap._id}/${nanoid(8)}--${filename}`;
		if (path.length <= maxLength) {
			return path;
		}
		const extensionMatch = /\.[^/]*$/.exec(path);
		if (extensionMatch) {
			const [extension] = extensionMatch;
			if (extension.length <= maxLength) {
				return path.substr(0, maxLength - extension.length) + extension;
			}
		}
		return path.substr(0, maxLength);
	}

	/**
	 * Save files for user if the records contains them
	 * @param record
	 */
	saveFile(record) {
		const deferredResponse = $.Deferred();
		if (!('_attachments' in record)) {
			deferredResponse.resolve();
			return deferredResponse.promise();
		}

		const downloads = record._attachments.map(async attachment => {
			const { url, mimeType, fileBase64, checksum, filename } = attachment;
			if (this.downloadPaths.has(url)) {
				return { url, filename, checksum, path: this.downloadPaths.get(url) };
			}
			const downloadPath = this.generateDownloadPath(filename);
			try {
				const blob = await Base64.base64ToBlob(fileBase64, mimeType);
				const downloadUrl = window.URL.createObjectURL(blob);
				await this.browser.downloadFile(downloadUrl, downloadPath);
				this.downloadPaths.set(url, downloadPath);
				return { url, filename, checksum, path: downloadPath };
			} catch (e) {
				console.error(`Failed to save attachment for url ${url}`, e);
				return attachment;
			}
		});

		Promise.all(downloads).then(attachments => {
			record._attachments = attachments;
			deferredResponse.resolve();
		});
		return deferredResponse.promise();
	}

	// @TODO remove recursion and add an iterative way to run these jobs.
	_run() {
		const job = this.queue.getNextJob();
		if (job === false) {
			console.log('Scraper execution is finished');
			this.executionCallback();
			return;
		}

		job.execute(
			this.browser,
			function (job) {
				const scrapedRecords = [];
				const deferredDatamanipulations = [];

				const records = job.getResults();
				records.forEach(
					function (record) {
						// var record = JSON.parse(JSON.stringify(rec));

						deferredDatamanipulations.push(this.saveFile.bind(this, record));

						// @TODO refactor job exstraction to a seperate method
						if (this.recordCanHaveChildJobs(record)) {
							// var followSelectorId = record._followSelectorId;
							const followURL = record._follow;
							const followSelectorId = record._followSelectorId;
							delete record._follow;
							delete record._followSelectorId;
							const newJob = new Job(followURL, followSelectorId, this, job, record);
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
								delete record._follow;
								delete record._followSelectorId;
							}
							scrapedRecords.push(record);
						}
					}.bind(this)
				);

				$.whenCallSequentially(deferredDatamanipulations).done(
					function () {
						this.store.saveSitemap(this.sitemap, function () {});
						this.resultWriter.writeDocs(scrapedRecords).then(() => {
							const now = new Date().getTime();
							// delay next job if needed
							this._timeNextScrapeAvailable =
								now +
								this.requestInterval +
								Math.random() * this.requestIntervalRandomness;
							if (now >= this._timeNextScrapeAvailable) {
								this._run();
							} else {
								const delay = this._timeNextScrapeAvailable - now;
								setTimeout(
									function () {
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
