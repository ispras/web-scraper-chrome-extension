import PouchDB from 'pouchdb';
import * as browser from 'webextension-polyfill';
import Sitemap from './Sitemap';

/**
 * Make sure all obj have the same properties
 * They can differe if table selector retrieves dynamic columns
 */
let normalizeProperties = function(docs) {
	// get all keys of the objects
	let keys = [];
	docs.forEach(function(doc) {
		for (let key in doc) {
			if (doc.hasOwnProperty(key) && keys.indexOf(key) === -1) {
				keys.push(key);
			}
		}
	});

	// add missing keys to objects
	docs.forEach(function(doc) {
		let objKeys = Object.keys(doc);
		keys.forEach(function(key) {
			if (!(key in doc)) {
				doc[key] = '';
			}
		});
	});
};

class StoreScrapeResultWriter {
	constructor(db) {
		this.db = db;
	}

	writeDocs(docs, callback) {
		if (docs.length === 0) {
			callback();
		} else {
			normalizeProperties(docs);
			this.db.bulkDocs({ docs: docs }, function(err, response) {
				if (err !== null) {
					console.log('Error while persisting scraped data to db', err);
				}
				callback();
			});
		}
	}
}

export default class StorePouchDB {
	constructor(config) {
		this.config = config;
		// configure couchdb
		this.sitemapDb = new PouchDB(this.config.sitemapDb);
	}

	sanitizeSitemapDataDbName(dbName) {
		return 'sitemap-data-' + dbName.replace(/[^a-z0-9_\$\(\)\+\-/]/gi, '_');
	}

	getSitemapDataDbLocation(sitemapId) {
		let dbName = this.sanitizeSitemapDataDbName(sitemapId);
		return this.config.dataDb + dbName;
	}

	getSitemapDataDb(sitemapId) {
		let dbLocation = this.getSitemapDataDbLocation(sitemapId);
		return new PouchDB(dbLocation);
	}

	/**
	 * creates or clears a sitemap db
	 * @param {type} sitemapId
	 * @returns {undefined}
	 */
	initSitemapDataDb(sitemapId) {
		// let dbLocation = this.getSitemapDataDbLocation(sitemapId);
		let store = this;
		let db = this.getSitemapDataDb(sitemapId);

		return new Promise(resolve => {
			db.destroy()
				.then(() => {
					let db = store.getSitemapDataDb(sitemapId);
					let dbWriter = new StoreScrapeResultWriter(db);
					resolve(dbWriter);
				})
				.catch(reason => {
					console.log(reason);
					resolve();
				});
		});
	}

	createSitemap(sitemap) {
		let sitemapJson = JSON.parse(JSON.stringify(sitemap));

		if (!sitemap._id) {
			console.log('cannot save sitemap without an id', sitemap);
		}

		return new Promise(resolve => {
			this.sitemapDb.put(
				sitemapJson,
				function(sitemap, err, response) {
					// @TODO handle err
					if (response) {
						sitemap._rev = response.rev;
					}
					// this.initSitemapDataDb(sitemap._id).then(function () {
					resolve(sitemap);
					// });
				}.bind(this, sitemap)
			);
		});
	}

	saveSitemap(sitemap) {
		// @TODO remove
		return this.createSitemap(sitemap);
	}

	deleteSitemap(sitemap) {
		sitemap = JSON.parse(JSON.stringify(sitemap));
		return new Promise(resolve => {
			this.sitemapDb.remove(
				sitemap,
				function(err, response) {
					// @TODO handle err

					// delete sitemap data db
					let dbLocation = this.getSitemapDataDbLocation(sitemap._id);
					// PouchDB.destroy(dbLocation, function () {
					resolve();
					// }.bind(this));
				}.bind(this)
			);
		});
	}

	getAllSitemaps() {
		return new Promise(resolve => {
			this.sitemapDb.allDocs({ include_docs: true }, function(err, response) {
				let sitemaps = [];
				for (let i in response.rows) {
					let sitemap = response.rows[i].doc;
					if (!browser.extension) {
						sitemap = new Sitemap(sitemap);
					}

					sitemaps.push(sitemap);
				}
				resolve(sitemaps);
			});
		});
	}

	getSitemapData(sitemap) {
		return new Promise(resolve => {
			let db = this.getSitemapDataDb(sitemap._id);
			db.allDocs(
				{ include_docs: true },
				function(err, response) {
					let responseData = [];
					for (let i in response.rows) {
						let doc = response.rows[i].doc;
						responseData.push(doc);
					}
					normalizeProperties(responseData);
					resolve(responseData);
				}.bind(this)
			);
		});
	}

	// @TODO make this call lighter
	sitemapExists(sitemapId) {
		return new Promise(resolve => {
			this.getAllSitemaps().then(function(sitemaps) {
				let sitemapFound = false;
				for (let i in sitemaps) {
					if (sitemaps[i]._id === sitemapId) {
						sitemapFound = true;
					}
				}
				resolve(sitemapFound);
			});
		});
	}
}
