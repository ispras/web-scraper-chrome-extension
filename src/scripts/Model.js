class Field {
	constructor(entity, field, fieldName) {
		this.entity = entity;
		this.field = field;
		this.field_name = fieldName;
	}
}

export default class Model extends Array {
	constructor(fields) {
		super();
		const fieldsArray = fields || [];
		fieldsArray.forEach(fieldObj => {
			this.push(new Field(fieldObj.entity, fieldObj.field, fieldObj.field_name));
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
					'entity' in fieldRule && 'field' in fieldRule && 'field_name' in fieldRule
			)
		) {
			return {
				valid: false,
				message: 'Each object in JSON array must contain keys entity, field, field_name.',
			};
		}

		return {
			message: 'Valid model',
			valid: true,
		};
	}

	getDataForSelector(selectorId) {
		const dataList = [];
		let idInData = false;

		this.forEach(field => {
			dataList.push(field);
			if (field.field_name === selectorId) {
				idInData = true;
			}
		});

		if (!idInData && selectorId) {
			dataList.push(new Field('', '', selectorId));
		}

		return dataList;
	}

	toString() {
		return this.length ? JSON.stringify(this, null, 4) : '';
	}
}
