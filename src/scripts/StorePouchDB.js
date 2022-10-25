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

	sanitizeSitemapDataDbName(dbName, projectId) {
		return `sitemap-data-${projectId.replace(/[^a-z0-9_\$\(\)\+\-/]/gi, '_')}-${dbName.replace(
			/[^a-z0-9_\$\(\)\+\-/]/gi,
			'_'
		)}`;
	}

	getSitemapDataDbLocation(sitemapId, projectId) {
		const dbName = this.sanitizeSitemapDataDbName(sitemapId, projectId);
		return this.config.dataDb + dbName;
	}

	getSitemapDataDb(sitemapId, projectId) {
		const dbLocation = this.getSitemapDataDbLocation(sitemapId, projectId);
		return new PouchDB(dbLocation);
	}

	/**
	 * creates or clears a sitemap db
	 * @param {type} sitemapId
	 * @returns {undefined}
	 */
	async initSitemapDataDb(sitemapId, projectId) {
		const store = this;
		let db = this.getSitemapDataDb(sitemapId, projectId);
		try {
			await db.destroy();
			db = store.getSitemapDataDb(sitemapId, projectId);
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

	async saveSitemap(sitemap, previousSitemapId) {
		if (previousSitemapId && previousSitemapId !== sitemap._id) {
			const { _rev, ...bareSitemap } = sitemap;
			const updatedSitemap = await this.createSitemap(bareSitemap);
			await this.moveSitemapData(previousSitemapId, sitemap._id);
			await this.deleteSitemap({ _rev, _id: previousSitemapId });
			sitemap._rev = updatedSitemap._rev;
			return sitemap;
		}
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
		if (browser.extension) {
			// TODO investigate why this is necessary
			return Array.from(result.rows, row => row.doc);
		}
		return Array.from(result.rows, row => {
			const sitemapObj = row.doc;
			try {
				return Sitemap.sitemapFromObj(sitemapObj);
			} catch (error) {
				console.error('Failed to read sitemap', sitemapObj, error);
				return null;
			}
		}).filter(Boolean);
	}

	async getSitemapData(sitemap, projectId) {
		const db = this.getSitemapDataDb(sitemap._id, projectId);
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

	async moveSitemapData(fromSitemapId, toSitemapId) {
		const fromDataDb = this.getSitemapDataDb(fromSitemapId);
		const toDataDb = this.getSitemapDataDb(toSitemapId);
		await fromDataDb.replicate.to(toDataDb);
		await fromDataDb.destroy();
	}

	async sitemapExists(sitemapId) {
		return this.sitemapDb
			.get(sitemapId)
			.then(() => true)
			.catch(() => false);
	}
}
