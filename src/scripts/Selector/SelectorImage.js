import * as $ from 'jquery';
import Selector from '../Selector';

export default class SelectorImage extends Selector {
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
		const urls = elements.map(element => {
			let { src } = element;
			// get url from style
			if (src == null) {
				src = $(element).css('background-image');
				src = /^url\((['"]?)(.*)\1\)$/.exec(src);
				src = src ? src[2] : '';
			}
			return this.stringReplace(src, this.stringReplacement);
		});

		const result = {};
		if (this.multiple) {
			result[`${this.id}-src`] = urls;
		} else {
			result[`${this.id}-src`] = urls.length ? urls[0] : null;
		}

		if (this.downloadFile) {
			const images = [];
			for (const [i, url] of urls.entries()) {
				try {
					if (url) {
						const image = await this.downloadFileAsBase64(url);
						if (!image.filename) {
							image.filename = this.getFilenameFromUrl(url);
						}
						images.push(image);
					}
				} catch (e) {
					console.warn(`Failed to download image by url ${url}`, e);
				}
			}
			if (images.length) {
				result[`_attachments-${this.id}`] = images;
			}
		}

		return [result];
	}

	getDataColumns() {
		const dataColumns = [`${this.id}-src`];
		if (this.downloadImage) {
			dataColumns.push(`${this.id}-path`, `${this.id}-checksum`, `${this.id}-filename`);
		}
		return dataColumns;
	}

	getUrlColumn() {
		return `${this.id}-src`;
	}

	getFeatures() {
		return ['selector', 'multiple', 'delay', 'downloadFile', 'stringReplacement'];
	}

	getItemCSSSelector() {
		return ['img', 'div'];
	}
}
