/**
 * Array of sitemap object migrations.
 * Each entry must be a function transforming sitemap object to next version.
 * Function at index K transforms specification version K to K + 1.
 *
 * TODO design more traditional migration manager, with each migration in its own module
 */
export default [
	// 1. assign uuids to selectors
	sitemapObj => {
		const id2uuid = { _root: '0' };
		sitemapObj.selectors.forEach((selector, index) => {
			selector.uuid = String(index + 1);
			id2uuid[selector.id] = selector.uuid;
		});
		sitemapObj.selectors.forEach(selector => {
			selector.parentSelectors = selector.parentSelectors.map(id => id2uuid[id]);
		});
		return sitemapObj;
	},
];
