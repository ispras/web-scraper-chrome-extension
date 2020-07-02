import Selector from '../Selector';
import * as $ from 'jquery';

export default class SelectorFile extends Selector {
	constructor(options) {
		super(options);
		this.updateData(options, this.getFeatures());
	}

	canReturnMultipleRecords() {
		return false;
	}

	canHaveChildSelectors() {
		return false;
	}

	canHaveLocalChildSelectors() {
		return false;
	}

	canCreateNewJobs() {
		return false;
	}

	willReturnElements() {
		return false;
	}

	downloadsAttachments() {
		return !!this.downloadFile;
	}

	async _getData(parentElement) {
		const elements = this.getDataElements(parentElement);

		const urlsHref = elements.map(element =>
			this.stringReplace(element.href, this.stringReplacement)
		);
		const urlsSrc = elements.map(element => {
			let { src } = element;
			// get url from style
			if (src == null) {
				src = $(element).css('background-image');
				src = /^url\((['"]?)(.*)\1\)$/.exec(src);
				src = src ? src[2] : '';
			}
			return this.stringReplace(src, this.stringReplacement);
		});
		const urls = urlsSrc[0].length ? urlsSrc : urlsHref;
		const result = {};
		if (this.multiple) {
			result[`${this.id}-url`] = urls;
		} else {
			result[`${this.id}-url`] = urls.length ? urls[0] : null;
		}

		if (this.downloadFile) {
			const files = [];
			for (const [i, url] of urls.entries()) {
				try {
					if (url) {
						const file = await this.downloadFileAsBase64(url);
						if (!file.filename) {
							// TODO consider $(elements[i]).text() for filename
							file.filename = elements[i].download || this.getFilenameFromUrl(url);
						}
						files.push(file);
					}
				} catch (e) {
					console.warn(`Failed to download File by url ${url}`, e);
				}
			}
			if (files.length) {
				result[`_attachments-${this.id}`] = files;
			}
		}

		return [result];
	}

	getDataColumns() {
		const dataColumns = [`${this.id}-url`];
		if (this.downloadFile) {
			dataColumns.push(`${this.id}-path`, `${this.id}-checksum`, `${this.id}-filename`);
		}
		return dataColumns;
	}

	getUrlColumn() {
		return `${this.id}-url`;
	}

	getFeatures() {
		return ['selector', 'multiple', 'delay', 'downloadFile', 'stringReplacement'];
	}

	getItemCSSSelector() {
		return 'a';
	}
}
