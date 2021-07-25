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
		return [{ [this.id]: Boolean(this.getDataElements(parentElement).length) }];
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['selector'];
	}
}
