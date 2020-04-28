import PouchDB from 'pouchdb';
import * as browser from 'webextension-polyfill';
import Sitemap from './Sitemap';
import 'sugar';

class StoreScrapeResultWriter {
	constructor(db) {
		this.db = db;
	}

	writeDocs(docs) {
		if (docs.length === 0) {
			return Promise.resolve();
		}
		// Extra wrapping is added since PouchDB forbids identifiers starting
		// with underscore. We use them for our attachments and meta information.
		// TODO Consider moving custom properties from doc to wrapper level
		return this.db.bulkDocs({ docs: docs.map(doc => ({ data: doc })) }).catch(err => {
			if (err !== null) {
				console.log('Error while persisting scraped data to db', err);
			}
		});
	}
}

export default class StorePouchDB {
	constructor(config) {
		this.config = config;
		// configure couchdb
		this.sitemapDb = new PouchDB(this.config.sitemapDb);
	}

	sanitizeSitemapDataDbName(dbName) {
		return `sitemap-data-${dbName.replace(/[^a-z0-9_\$\(\)\+\-/]/gi, '_')}`;
	}

	getSitemapDataDbLocation(sitemapId) {
		const dbName = this.sanitizeSitemapDataDbName(sitemapId);
		return this.config.dataDb + dbName;
	}

	getSitemapDataDb(sitemapId) {
		const dbLocation = this.getSitemapDataDbLocation(sitemapId);
		return new PouchDB(dbLocation);
	}

	/**
	 * creates or clears a sitemap db
	 * @param {type} sitemapId
	 * @returns {undefined}
	 */
	async initSitemapDataDb(sitemapId) {
		const store = this;
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
		const sitemapJson = JSON.parse(JSON.stringify(sitemap));

		if (!sitemap._id) {
			console.log('cannot save sitemap without an id', sitemap);
		}

		const response = await this.sitemapDb.put(sitemapJson);
		sitemap._rev = response.rev;
		return sitemap;
	}

	saveSitemap(sitemap) {
		return this.createSitemap(sitemap);
	}

	async deleteSitemap(sitemap) {
		const sitemapJson = JSON.parse(JSON.stringify(sitemap));
		await this.sitemapDb.remove(sitemapJson);
		const db = this.getSitemapDataDb(sitemap._id);
		await db.destroy();
	}

	async getAllSitemaps() {
		const result = await this.sitemapDb.allDocs({ include_docs: true });
		return Array.from(result.rows, row => {
			const sitemapObj = row.doc;
			if (browser.extension) {
				return sitemapObj;
			}
			const sitemap = Sitemap.sitemapFromObj(sitemapObj);
			if (sitemapObj._rev) {
				sitemap._rev = sitemapObj._rev;
			}
			return sitemap;
		});
	}

	async getSitemapData(sitemap) {
		const db = this.getSitemapDataDb(sitemap._id);
		const response = await db.allDocs({ include_docs: true });
		return Array.from(response.rows, row => {
			const { doc } = row;
			delete doc._id;
			delete doc._rev;
			const { data, ...rest } = doc;
			// these conditions are included for backwards compatibility
			return Object.isObject(data) && Object.isEmpty(rest) ? data : doc;
		});
	}

	async sitemapExists(sitemapId) {
		return this.sitemapDb
			.get(sitemapId)
			.then(() => true)
			.catch(() => false);
	}
}
