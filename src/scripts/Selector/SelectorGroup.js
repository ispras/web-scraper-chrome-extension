import * as $ from 'jquery';
import Selector from '../Selector';

export default class SelectorGroup extends Selector {
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

	async getData(parentElement) {
		const [{ [this.id]: records }] = await super.getData(parentElement);
		return [{ [this.id]: JSON.stringify(records) }];
	}

	async _getData(parentElement) {
		// cannot reuse this.getDataElements because it depends on *multiple* property
		const $elements = $(this.selector, parentElement);
		const records = $.map($elements, element => {
			const $element = $(element);
			const record = { [this.id]: $element.text() };
			if (this.extractAttribute) {
				record[`${this.id}-${this.extractAttribute}`] = $element.attr(
					this.extractAttribute
				);
			}
			if (this.extractStyle) {
				record[`${this.id}-${this.extractStyle}`] = $element.css(this.extractStyle);
			}
			return record;
		});
		return [{ [this.id]: records }];
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['selector', 'delay', 'extractAttribute', 'textmanipulation', 'extractStyle'];
	}
}
