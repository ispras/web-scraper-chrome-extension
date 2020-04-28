import Selector from '../Selector';

export default class SelectorDocument extends Selector {
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
		return !!this.downloadDocument;
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

		if (this.downloadDocument) {
			const documents = [];
			for (const [i, url] of urls.entries()) {
				try {
					if (url) {
						const document = await this.downloadFileAsBase64(url);
						if (!document.filename) {
							// TODO consider $(elements[i]).text() for filename
							document.filename =
								elements[i].download || this.getFilenameFromUrl(url);
						}
						documents.push(document);
					}
				} catch (e) {
					console.warn(`Failed to download document by url ${url}`, e);
				}
			}
			if (documents.length) {
				result[`_attachments-${this.id}`] = documents;
			}
		}

		return [result];
	}

	getDataColumns() {
		const dataColumns = [`${this.id}-href`];
		if (this.downloadDocument) {
			dataColumns.push(`${this.id}-path`, `${this.id}-checksum`, `${this.id}-filename`);
		}
		return dataColumns;
	}

	getUrlColumn() {
		return `${this.id}-href`;
	}

	getFeatures() {
		return ['selector', 'multiple', 'delay', 'downloadDocument', 'stringReplacement'];
	}

	getItemCSSSelector() {
		return 'a';
	}
}
