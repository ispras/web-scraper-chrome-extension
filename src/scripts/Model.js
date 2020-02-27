class Field {
	constructor(entity, field, field_name) {
		this.entity = entity;
		this.field = field;
		this.field_name = field_name;
	}
}

export default class Model extends Array {

	constructor(fields) {
		super();
		let fieldsArray = fields ? fields : [];
		for (let fieldObj of fieldsArray) {
			this.push(new Field(fieldObj.entity, fieldObj.field, fieldObj.field_name));
		}
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
		for (let field_rule of model) {
			if (!('entity' in field_rule) || !('field' in field_rule) || !('field_name' in field_rule)) {
				return {
					valid: false,
					message: 'Each object in JSON array must contain keys entity, field, field_name.',
				};
			}
		}
		return {
			message: 'Valid model',
			valid: true,
		};
	}

	getDataForSelector(selectorId) {
		let dataList = [];
		let idInData = false;

		for (let field of this) {
			dataList.push(field);
			if (field.field_name === selectorId) {
				idInData = true;
			}
		}

		if (!idInData && selectorId) {
			dataList.push(new Field( '', '', selectorId));
		}

		return dataList;
	}

	toString() {
		if (this.length) {
			return JSON.stringify(this, null, 4);
		} else {
			return '';
		}
	}
}
