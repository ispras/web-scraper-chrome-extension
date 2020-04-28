import * as $ from 'jquery';
import Selector from '../Selector';

export default class SelectorHTML extends Selector {
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
		let htmls = elements.map(element => $(element).html());
		if (!this.multiple) {
			htmls = htmls.length ? htmls[0] : null;
		}
		return [{ [this.id]: htmls }];
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['selector', 'multiple', 'textmanipulation', 'delay'];
	}
}
