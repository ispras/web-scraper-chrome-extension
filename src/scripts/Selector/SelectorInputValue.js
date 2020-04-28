import * as $ from 'jquery';
import Selector from '../Selector';

export default class SelectorInputValue extends Selector {
	constructor(options) {
		super(options);
		this.updateData(options, this.getFeatures());
	}

	canReturnMultipleRecords() {
		return false;
	}

	canHaveChildSelectors() {
		return true;
	}

	canHaveLocalChildSelectors() {
		return true;
	}

	canCreateNewJobs() {
		return false;
	}

	willReturnElements() {
		return false;
	}

	async _getData(parentElement) {
		const elements = this.getDataElements(parentElement);
		elements.forEach(element => $(element).val(this.value));
		return [{ [this.id]: this.value }];
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['value', 'selector'];
	}
}
