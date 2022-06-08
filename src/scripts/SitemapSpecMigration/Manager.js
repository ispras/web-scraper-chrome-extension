import migrations from './Migrations';

export default class SitemapSpecMigrationManager {
	static applyMigrations(sitemapObj) {
		const sitemapSpecVersion = sitemapObj.sitemapSpecificationVersion || 0;
		if (sitemapSpecVersion === migrations.length) {
			return sitemapObj;
		}
		for (let version = sitemapSpecVersion; version < migrations.length; version++) {
			sitemapObj = migrations[version](sitemapObj);
			sitemapObj.sitemapSpecificationVersion = version + 1;
		}
		return sitemapObj;
	}

	static currentVersion() {
		return migrations.length;
	}
}
