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

	_getData(parentElement) {
		var dfd = $.Deferred();

		// cannot reuse this.getDataElements because it depends on *multiple* property
		var elements = $(this.selector, parentElement);

		var records = [];
		$(elements).each(
			function(k, element) {
				var data = {};

				data[this.id] = $(element).text();

				if (this.extractAttribute) {
					data[this.id + '-' + this.extractAttribute] = $(element).attr(this.extractAttribute);
				}

				if (this.extractStyle) {
					data[this.id + '-' + this.extractStyle] = $(element).css(this.extractStyle);
				}

				records.push(data);
			}.bind(this)
		);

		var result = {};
		result[this.id] = records;

		dfd.resolve([result]);
		return dfd.promise();
	}

	getDataColumns() {
		return [this.id];
	}

	getFeatures() {
		return ['selector', 'delay', 'extractAttribute', 'textmanipulation', 'extractStyle'];
	}
}
