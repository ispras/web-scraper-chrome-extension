import Selector from '../Selector';

export default class SelectorElementExists extends Selector {
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
		return true;
	}

	canCreateNewJobs() {
		return false;
	}

	willReturnElements() {
		return false;
	}

	async _getData(parentElement) {
		return [{ [this.id]: Boolean(parentElement) }];
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['selector'];
	}
}
