import Selector from '../Selector';

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
		const elements = this.getDataElements(parentElement).filter(element => 'href' in element);
		const urls = elements.map(element =>
			this.stringReplace(element.href, this.stringReplacement)
		);

		const result = {};
		if (this.multiple) {
			result[`${this.id}-href`] = urls;
		} else {
			result[`${this.id}-href`] = urls.length ? urls[0] : null;
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
		const dataColumns = [`${this.id}-href`];
		if (this.downloadFile) {
			dataColumns.push(`${this.id}-path`, `${this.id}-checksum`, `${this.id}-filename`);
		}
		return dataColumns;
	}

	getUrlColumn() {
		return `${this.id}-href`;
	}

	getFeatures() {
		return ['selector', 'multiple', 'delay', 'downloadFile', 'stringReplacement'];
	}

	getItemCSSSelector() {
		return 'a';
	}
}
