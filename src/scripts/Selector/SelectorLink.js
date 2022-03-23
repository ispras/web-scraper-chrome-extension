import * as $ from 'jquery';
import Selector from '../Selector';

export default class SelectorLink extends Selector {
	constructor(options) {
		super(options);
		this.updateData(options, this.getFeatures());
	}

	canReturnMultipleRecords() {
		return true;
	}

	canHaveChildSelectors() {
		return true;
	}

	canHaveLocalChildSelectors() {
		return false;
	}

	canCreateNewJobs() {
		return true;
	}

	willReturnElements() {
		return false;
	}

	async _getData(parentElement) {
		const elements = this.getDataElements(parentElement);
		if (!this.multiple && !elements.length) {
			return [{ [this.id]: null }];
		}
		return elements.map(element => {
			const $element = $(element);
			const text = $element.text();
			let url = this.extractAttribute ? $element.attr(this.extractAttribute) : text;
			url = this.stringReplace(url, this.stringReplacement);
			return {
				[this.id]: text,
				[`${this.id}-href`]: url,
				_followSelectorId: this.uuid,
				_follow: url,
			};
		});
	}

	getDataColumns() {
		return [this.id, `${this.id}-href`];
	}

	getFeatures() {
		return ['selector', 'extractAttribute', 'multiple', 'delay', 'stringReplacement'];
	}

	getItemCSSSelector() {
		return 'a';
	}
}
