import Selector from '../Selector';

export default class SelectorPageURL extends Selector {
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

	async _getData() {
		return [{ [this.id]: document.location.href }];
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['delay', 'textmanipulation'];
	}
}
