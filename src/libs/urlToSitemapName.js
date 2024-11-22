export default function urlToSitemapName(url) {
	try {
		let hostname = new URL(url).hostname.replace(/^www\./, '');
		return hostname.replace(/\./g, '_').replace(/\//g, '_');
	} catch (e) {
		console.error('invalid_URL:', e);
		return '';
	}
}
