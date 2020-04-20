class Field {
	constructor(entity, field, fieldName) {
		this.entity = entity;
		this.field = field;
		this.fieldName = fieldName;
	}
}

export default class Model extends Array {
	constructor(fields) {
		super();
		const fieldsArray = fields || [];
		fieldsArray.forEach(fieldObj => {
			this.push(new Field(fieldObj.entity, fieldObj.field, fieldObj.fieldName));
		});
	}

	static validateModel(model) {
		if (model === undefined) {
			return {
				message: 'Empty value is possible model',
				valid: true,
			};
		}
		if (!Array.isArray(model)) {
			return {
				valid: false,
				message: 'JSON must be array',
			};
		}

		if (
			!model.every(
				fieldRule =>
					'entity' in fieldRule && 'field' in fieldRule && 'fieldName' in fieldRule
			)
		) {
			return {
				valid: false,
				message: 'Each object in JSON array must contain keys entity, field, fieldName.',
			};
		}

		return {
			message: 'Valid model',
			valid: true,
		};
	}

	toString() {
		return this.length ? JSON.stringify(this, null, 4) : '';
	}
}
