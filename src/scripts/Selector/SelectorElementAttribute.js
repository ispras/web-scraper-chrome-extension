import * as $ from 'jquery';
import Selector from '../Selector';

export default class SelectorElementAttribute extends Selector {
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

	async _getData(parentElement) {
		const elements = this.getDataElements(parentElement);
		let attributes = elements.map(element => $(element).attr(this.extractAttribute));
		if (!this.multiple) {
			attributes = attributes.length ? attributes[0] : null;
		}
		return [{ [this.id]: attributes }];
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['selector', 'multiple', 'extractAttribute', 'delay', 'textmanipulation'];
	}
}
