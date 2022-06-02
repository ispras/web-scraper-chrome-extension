import { currentSitemapSpecVersion } from './Config';

export default class SitemapSpecMigration {
	static versionMigrationManager(sitemapObj) {
		let smObj = sitemapObj;
		if (sitemapObj.sitemapSpecificationVersion !== currentSitemapSpecVersion) {
			if (sitemapObj.sitemapSpecificationVersion == null) {
				sitemapObj.sitemapSpecificationVersion = 0;
			}
			let migrations = [this.transformZeroToFirstVersion.bind(this)]; // Transformations must be only in sequential order
			if (migrations.length < currentSitemapSpecVersion) {
				return { migrationError: sitemapObj._id };
			}
			for (let i = sitemapObj.sitemapSpecificationVersion; i < migrations.length; i++) {
				smObj = migrations[i](smObj);
			}
		}
		return smObj;
	}

	// Transform old type sitemaps(without uuid and specification version = 0)
	// to new type sitemaps(with uuid and specification version = 1)
	static transformZeroToFirstVersion(sitemapObj) {
		const id2uuid = { _root: '0' };
		sitemapObj.selectors.forEach((selector, index) => {
			selector.uuid = String(index + 1);
			id2uuid[selector.id] = selector.uuid;
		});
		sitemapObj.selectors.forEach(selector => {
			selector.parentSelectors = selector.parentSelectors.map(id => id2uuid[id]);
		});
		sitemapObj.sitemapSpecificationVersion = 1;
		return sitemapObj;
	}

	static findSelectorInSitemapObjById(selectorId, obj) {
		for (let i = 0; i < obj.selectors.length; i++) {
			const selector = obj.selectors[i];
			if (selector.id === selectorId) {
				return selector;
			}
		}
	}
}
