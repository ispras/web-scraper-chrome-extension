import Selector from '../Selector';
import '../../libs/jquery.whencallsequentially';

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

	_getData(parentElement) {
		let dfd = $.Deferred();

		let elements = this.getDataElements(parentElement);
		if (!this.multiple && !elements.length) {
			let data = {};
			data[this.id + '-src'] = null;
			dfd.resolve([data]);
			return dfd.promise();
		}

		let dataPromises = elements.map(
			element =>
				new Promise(resolve => {
					let data = {};
					let src = element.src;

					// get url from style
					if (src == null) {
						src = $(element).css('background-image');
						src = /^url\((['"]?)(.*)\1\)$/.exec(src);
						src = src ? src[2] : '';
					}

					src = this.stringReplace(src, this.stringReplacement);
					data[this.id + '-src'] = src;

					// download image if required
					if (!this.downloadImage) {
						resolve(data);
					} else {
						this.downloadFileAsBase64(src)
							.done(imageResponse => {
								data['_fileBase64-' + this.id] = imageResponse.fileBase64;
								data['_fileMimeType-' + this.id] = imageResponse.mimeType;
								data['_filename' + this.id] = imageResponse.filename;
								resolve(data);
							})
							.fail(() => {
								// failed to download image continue.
								// @TODO handle errror
								resolve(data);
							});
					}
				})
		);

		Promise.all(dataPromises).then(dfd.resolve);
		return dfd.promise();
	}

	getDataColumns() {
		let dataColumns = [this.id + '-src'];
		if (this.downloadImage) {
			dataColumns.push(this.id + '-download_path');
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
