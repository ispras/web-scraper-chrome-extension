import Translator from './Translator';

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
				message: Translator.getTranslationByKey('model_empty_message'),
				valid: true,
			};
		}
		if (!Array.isArray(model)) {
			return {
				valid: false,
				message: Translator.getTranslationByKey('model_json_array_message'),
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
				message: Translator.getTranslationByKey('model_json_error_message'),
			};
		}

		return {
			message: Translator.getTranslationByKey('model_correct_message'),
			valid: true,
		};
	}

	toString() {
		return this.length ? JSON.stringify(this, null, 4) : '';
	}
}
