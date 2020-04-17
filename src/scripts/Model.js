import Translator from './Translator';

export default class Model {
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
		for (let field_rule of model) {
			if (!('entity' in field_rule) || !('field' in field_rule) || !('field_name' in field_rule)) {
				return {
					valid: false,
					message: Translator.getTranslationByKey('model_json_error_message'),
				};
			}
		}
		return {
			message: Translator.getTranslationByKey('model_correct_message'),
			valid: true,
		};
	}
}
