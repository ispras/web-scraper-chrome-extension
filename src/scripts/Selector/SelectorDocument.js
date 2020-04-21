import Selector from '../Selector';

export default class SelectorDocument extends Selector {
	constructor(options) {
		super(options);
		this.updateData(options, this.getFeatures());
	}

	canReturnMultipleRecords() {
		return true;
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

	async _getData(parentElement) {
		const elements = this.getDataElements(parentElement);
		let documents = elements.map(element => {
			const text = $(element).text();
			const href = this.stringReplace(element.href, this.stringReplacement);
			return { [this.id]: text, [`${this.id}-href`]: href };
		});
		if (this.downloadDocument) {
			for (const document of documents) {
				const url = document[`${this.id}-href`];
				if (url) {
					const documentResponse = await this.downloadFileAsBase64(url);
					document[`_fileBase64-${this.id}`] = documentResponse.fileBase64;
					document[`_mimeType-${this.id}`] = documentResponse.mimeType;
					document[`_filename-${this.id}`] = documentResponse.filename;
				}
			}
		}
		if (!this.multiple) {
			documents = documents.length ? documents[0] : null;
		}
		return [{ [this.id]: documents }];
	}

	getDataColumns() {
		const dataColumns = [this.id, `${this.id}-href`];
		if (this.downloadDocument) {
			dataColumns.push(`${this.id}-download_path`);
		}
		return dataColumns;
	}

	getFeatures() {
		return ['selector', 'multiple', 'delay', 'downloadDocument', 'stringReplacement'];
	}
}
