import '@wikimedia/jquery.i18n/src/jquery.i18n';
import '@wikimedia/jquery.i18n/src/jquery.i18n.messagestore';
import '@wikimedia/jquery.i18n/src/jquery.i18n.parser';
import '@wikimedia/jquery.i18n/src/jquery.i18n.fallbacks';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter';
import '@wikimedia/jquery.i18n/src/jquery.i18n.emitter.bidi';

export default class Model {
	static validateModel(model) {
		if (model === undefined) {
			return {
				message: $.i18n('model-empty-message'),
				valid: true,
			};
		}
		if (!Array.isArray(model)) {
			return {
				valid: false,
				message: $.i18n('model-json-array-message'),
			};
		}
		for (let field_rule of model) {
			if (!('entity' in field_rule) || !('field' in field_rule) || !('field_name' in field_rule)) {
				return {
					valid: false,
					message: $.i18n('model-json-error-message'),
				};
			}
		}
		return {
			message: $.i18n('model-correct-message'),
			valid: true,
		};
	}
}
