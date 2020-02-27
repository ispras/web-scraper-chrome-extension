import Sitemap from './Sitemap';
import StorePouchDB from './StorePouchDB';

export default class StoreRestApi {
	constructor(config) {
		this.base_uri = config.restUrl;
		this.localDataStore = new StorePouchDB(config);
	}

	createSitemap(sitemap) {
		return this.saveSitemap(sitemap);
	}

	saveSitemap(sitemap) {
		let base_uri = this.base_uri;
		return new Promise(resolve => {
			this.sitemapExists(sitemap._id).then(function(exists) {
				if (exists) {
					//update sitemap
					$.ajax({
						type: 'PUT',
						url: new URL('/sitemaps/' + sitemap._id, base_uri).href,
						data: Sitemap.sitemapFromObj(sitemap).exportSitemap(),
						success: function() {
							resolve(sitemap);
						},
						error: function(jqXHR, textStatus, errorThrown) {
							alert('StoreApi: Error updating sitemap.');
						},
						contentType: 'application/json',
					});
				} else {
					//create new sitemap
					$.ajax({
						type: 'POST',
						url: new URL('/sitemaps/', base_uri).href,
						data: Sitemap.sitemapFromObj(sitemap).exportSitemap(),
						success: function() {
							resolve(sitemap);
						},
						error: function(jqXHR, textStatus, errorThrown) {
							alert('StoreApi: Error creating sitemap.');
						},
						contentType: 'application/json',
					});
				}
			});
		});
	}

	deleteSitemap(sitemap) {
		return new Promise(resolve => {
			$.ajax({
				type: 'DELETE',
				url: new URL('/sitemaps/' + sitemap._id, this.base_uri).href,
				success: function(response) {
					resolve(response);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert('StoreApi: Error deleting sitemap.');
				},
				contentType: 'application/json',
			});
		});
	}

	getAllSitemaps() {
		return new Promise(resolve => {
			$.ajax({
				type: 'GET',
				url: new URL('/sitemaps/', this.base_uri).href,
				success: function(data) {
					let sitemaps = [];
					for (let i in data) {
						sitemaps.push(Sitemap.sitemapFromObj(data[i]));
					}
					resolve(sitemaps);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert('StoreApi: Could not get all sitemaps.');
				},
				contentType: 'application/json',
			});
		});
	}

	sitemapExists(sitemapId) {
		return new Promise(resolve => {
			$.ajax({
				type: 'GET',
				url: new URL('/sitemaps/', this.base_uri).href,
				success: function(data) {
					let exists = false;
					for (let i in data) {
						if (data[i]._id === sitemapId) {
							exists = true;
						}
					}
					resolve(exists);
				},
				error: function(jqXHR, textStatus, errorThrown) {
					alert('StoreApi: Could not get all sitemaps.');
				},
				contentType: 'application/json',
			});
		});
	}

	initSitemapDataDb(sitemapId) {
		return this.localDataStore.initSitemapDataDb(sitemapId);
	}

	getSitemapData(sitemap) {
		return this.localDataStore.getSitemapData(sitemap);
	}
}
