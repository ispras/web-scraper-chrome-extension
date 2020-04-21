import Selector from '../Selector';

export default class SelectorImage extends Selector {
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
		let images = elements.map(element => {
			let { src } = element;
			// get url from style
			if (src == null) {
				src = $(element).css('background-image');
				src = /^url\((['"]?)(.*)\1\)$/.exec(src);
				src = src ? src[2] : '';
			}
			src = this.stringReplace(src, this.stringReplacement);
			return { [`${this.id}-src`]: src };
		});
		if (this.downloadImage) {
			for (const image of images) {
				const url = image[`${this.id}-src`];
				if (url) {
					const imageResponse = await this.downloadFileAsBase64(url);
					image[`_fileBase64-${this.id}`] = imageResponse.fileBase64;
					image[`_mimeType-${this.id}`] = imageResponse.mimeType;
					image[`_filename-${this.id}`] = imageResponse.filename;
				}
			}
		}
		if (!this.multiple) {
			images = images.length ? images[0] : null;
		}
		return [{ [this.id]: images }];
	}

	getDataColumns() {
		const dataColumns = [`${this.id}-src`];
		if (this.downloadImage) {
			dataColumns.push(`${this.id}-download_path`);
		}
		return dataColumns;
	}

	getFeatures() {
		return ['selector', 'multiple', 'delay', 'downloadImage', 'stringReplacement'];
	}

	getItemCSSSelector() {
		return ['img', 'div'];
	}
}
