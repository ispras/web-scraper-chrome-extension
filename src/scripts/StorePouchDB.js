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
	async initSitemapDataDb(sitemapId) {
		let store = this;
		let db = this.getSitemapDataDb(sitemapId);
		try {
			await db.destroy();
			db = store.getSitemapDataDb(sitemapId);
			return new StoreScrapeResultWriter(db);
		} catch (reason) {
			console.log(reason);
		}
	}

	async createSitemap(sitemap) {
		let sitemapJson = JSON.parse(JSON.stringify(sitemap));

		if (!sitemap._id) {
			console.log('cannot save sitemap without an id', sitemap);
		}

		let response = await this.sitemapDb.put(sitemapJson);
		sitemap._rev = response.rev;
		return sitemap;
	}

	saveSitemap(sitemap) {
		return this.createSitemap(sitemap);
	}

	async deleteSitemap(sitemap) {
		let sitemapJson = JSON.parse(JSON.stringify(sitemap));
		await this.sitemapDb.remove(sitemapJson);
		let db = this.getSitemapDataDb(sitemap._id);
		await db.destroy();
	}

	async getAllSitemaps() {
		let result = await this.sitemapDb.allDocs({ include_docs: true });
		return Array.from(result.rows, row => {
			let sitemapObj = row.doc;
			if (!!browser.extension) {
				return sitemapObj;
			} else {
				let sitemap = Sitemap.sitemapFromObj(sitemapObj);
				if (sitemapObj._rev) {
					sitemap._rev = sitemapObj._rev;
				}
				return sitemap;
			}
		});
	}

	async getSitemapData(sitemap) {
		let db = this.getSitemapDataDb(sitemap._id);
		let response = await db.allDocs({ include_docs: true });

		let responseData = Array.from(response.rows, row => {
			return row.doc;
		});
		return normalizeProperties(responseData);
	}

	async sitemapExists(sitemapId) {
		return this.sitemapDb
			.get(sitemapId)
			.then(() => {
				return Promise.resolve(true);
			})
			.catch(() => {
				return Promise.resolve(false);
			});
	}
}
