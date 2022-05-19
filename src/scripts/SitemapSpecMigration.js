import { currentSitemapSpecVersion } from './Config';

export default class SitemapSpecMigration {
	static versionMigrationManager(sitemapObj) {
		let smObj = sitemapObj;
		if (sitemapObj.sitemapSpecificationVersion !== currentSitemapSpecVersion) {
			let migrations = [this.transformZeroToFirstVersion.bind(this)]; // Transformations must be only in sequential order
			for (let i = sitemapObj.sitemapSpecificationVersion; i < migrations.length; i++) {
				smObj = migrations[i](smObj);
			}
		}
		return smObj;
	}

	// Transform old type sitemaps(without uuid and specification version = 0)
	// to new type sitemaps(with uuid and specification version = 1)
	static transformZeroToFirstVersion(sitemapObj) {
		let lastSelectorsUUID = 0;

		sitemapObj.selectors.forEach(selector => {
			selector['uuid'] = String(lastSelectorsUUID + 1);
			lastSelectorsUUID += 1;
		});
		sitemapObj.selectors.forEach(selector => {
			let newParentSelectorsList = [];
			selector.parentSelectors.forEach(parentSelector => {
				if (parentSelector === '_root') {
					newParentSelectorsList.push(sitemapObj.rootSelector.uuid);
				} else {
					newParentSelectorsList.push(
						this.findSelectorInSitemapObjById(parentSelector, sitemapObj).uuid
					);
				}
			});
			selector.parentSelectors = newParentSelectorsList;
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
