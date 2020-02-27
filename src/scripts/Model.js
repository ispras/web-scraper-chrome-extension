export default class Model {
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
}
