import * as $ from 'jquery';
import Selector from '../Selector';

export default class SelectorElementStyle extends Selector {
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
		let styles = elements.map(element => $(element).css(this.extractStyle));
		if (!this.multiple) {
			styles = styles.length ? styles[0] : null;
		}
		return [{ [this.id]: styles }];
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['selector', 'multiple', 'extractStyle', 'delay', 'textmanipulation'];
	}
}
