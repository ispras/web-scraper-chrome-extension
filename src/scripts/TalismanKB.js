import Translator from './Translator';
import 'sugar';

const KB_TYPES = {
	CONCEPT: 'c',
	LINK: 'l',
	CONCEPT_PROPERTY: 'cp',
	LINK_PROPERTY: 'lp',
};

const LINK_DIRECTION = {
	RIGHT: '->',
	LEFT: '<-',
	NONE: '-',
};

/**
 * Utilities for integration with Talisman knowledge base
 */
export default class TalismanKB {
	constructor(store) {
		this.store = store;
	}

	makeSelectorId(kbType) {
		const { type, id, parentId, direction, childId, name } = kbType;
		if (type === KB_TYPES.CONCEPT) {
			return `[tlsmn:${type}:${id}] ${name}`;
		}
		if (type === KB_TYPES.LINK) {
			return `[tlsmn:${type}:${id}:${parentId}:${direction}:${childId}] ${name}`;
		}
		return `[tlsmn:${type}:${id}:${parentId}] ${name}`;
	}

	getKBType(selector) {
		const match = /^\[tlsmn:(.+?)]/.exec(selector.id);
		if (!match) {
			return undefined;
		}
		const [type, id, parentId, direction, childId] = match[1].split(':');
		if (type === KB_TYPES.CONCEPT) {
			return { type, id };
		}
		if (type === KB_TYPES.LINK) {
			return { type, id, parentId, direction, childId };
		}
		if (type in KB_TYPES) {
			return { type, id, parentId };
		}
		return undefined;
	}

	getParentKBTypes(selector, sitemap) {
		const seenSelectors = new Set([sitemap.rootSelector.uuid, selector.uuid]);
		const selectorQueue = selector.parentSelectors.filter(uid => !seenSelectors.has(uid));
		const parentKBTypes = [];
		while (selectorQueue.length) {
			const parentSelector = sitemap.getSelectorByUid(selectorQueue.pop());
			const kbType = this.getKBType(parentSelector);
			if (kbType && (kbType.type === KB_TYPES.CONCEPT || kbType.type === KB_TYPES.LINK)) {
				parentKBTypes.push(kbType);
			} else {
				parentSelector.parentSelectors.forEach(uid => {
					if (!seenSelectors.has(uid)) {
						seenSelectors.add(uid);
						selectorQueue.push(uid);
					}
				});
			}
		}
		return parentKBTypes;
	}

	makeHintField(kbType) {
		const field = `#${kbType.id} ${kbType.name}`;
		if (kbType.type === KB_TYPES.LINK && kbType.direction !== LINK_DIRECTION.NONE) {
			return `${field} (${kbType.direction})`;
		}
		return field;
	}

	makeSelectorIdHint(entity, kbType) {
		return {
			entity,
			field: this.makeHintField(kbType),
			fieldName: this.makeSelectorId(kbType),
		};
	}

	async getPropertyTypeHintsForConceptType(type) {
		const conceptType = await this.store.getConceptType(type.id);
		const entityPrefix = Translator.getTranslationByKey('prop_types_for_concept_type');
		const entity = `${entityPrefix} ${this.makeHintField({ ...type, ...conceptType })}`;
		return conceptType.listConceptPropertyType.map(propertyType =>
			this.makeSelectorIdHint(entity, {
				type: KB_TYPES.CONCEPT_PROPERTY,
				id: propertyType.id,
				name: propertyType.name,
				parentId: conceptType.id,
			})
		);
	}

	async getLinkTypeHintsForConceptType(type) {
		const conceptType = await this.store.getConceptType(type.id);
		const entityPrefix = Translator.getTranslationByKey('link_types_for_concept_type');
		const entity = `${entityPrefix} ${this.makeHintField({ ...type, ...conceptType })}`;
		return conceptType.listConceptLinkType.flatMap(linkType => {
			const parentId = conceptType.id;
			const childId =
				parentId === linkType.conceptFromType.id
					? linkType.conceptToType.id
					: linkType.conceptFromType.id;
			const directions = [];
			if (!linkType.isDirected) {
				directions.push(LINK_DIRECTION.NONE);
			} else {
				if (parentId === linkType.conceptFromType.id) {
					directions.push(LINK_DIRECTION.RIGHT);
				}
				if (parentId === linkType.conceptToType.id) {
					directions.push(LINK_DIRECTION.LEFT);
				}
			}
			return directions.map(direction =>
				this.makeSelectorIdHint(entity, {
					type: KB_TYPES.LINK,
					id: linkType.id,
					name: linkType.name,
					parentId,
					childId,
					direction,
				})
			);
		});
	}

	async getChildConceptTypeHintForLinkType(type) {
		const linkType = await this.store.getLinkType(type.id);
		const entityPrefix = Translator.getTranslationByKey('concept_types_for_link_type');
		const entity = `${entityPrefix} ${this.makeHintField({ ...type, ...linkType })}`;
		const conceptType =
			type.parentId === linkType.conceptFromType.id
				? linkType.conceptToType
				: linkType.conceptFromType;
		return this.makeSelectorIdHint(entity, {
			type: KB_TYPES.CONCEPT,
			id: conceptType.id,
			name: conceptType.name,
		});
	}

	async getPropertyTypeHintsForLinkType(type) {
		const linkType = await this.store.getLinkType(type.id);
		const entityPrefix = Translator.getTranslationByKey('prop_types_for_link_type');
		const entity = `${entityPrefix} ${this.makeHintField({ ...type, ...linkType })}`;
		return linkType.listConceptLinkPropertyType.map(propertyType =>
			this.makeSelectorIdHint(entity, {
				type: KB_TYPES.LINK_PROPERTY,
				id: propertyType.id,
				name: propertyType.name,
				parentId: linkType.id,
			})
		);
	}

	async getAllConceptTypeHints() {
		const entity = Translator.getTranslationByKey('all_concept_types');
		const conceptTypes = await this.store.listAllConceptTypes();
		return conceptTypes.map(({ id, name }) =>
			this.makeSelectorIdHint(entity, { type: KB_TYPES.CONCEPT, id, name })
		);
	}

	async generateIdHints(selector, sitemap) {
		const parentKBTypes = this.getParentKBTypes(selector, sitemap);

		const parentConceptTypes = parentKBTypes
			.filter(({ type }) => type === KB_TYPES.CONCEPT)
			.unique('id');
		const parentLinkTypes = parentKBTypes
			.filter(({ type }) => type === KB_TYPES.LINK)
			.unique('id');

		const hintsPromises = [];

		if (selector.willReturnElements()) {
			// may be concept type or link type

			hintsPromises.push(
				...parentConceptTypes.map(conceptType =>
					this.getLinkTypeHintsForConceptType(conceptType)
				)
			);

			hintsPromises.push(
				...parentLinkTypes.map(linkType =>
					this.getChildConceptTypeHintForLinkType(linkType)
				)
			);

			// show hints with all concept types
			hintsPromises.push(this.getAllConceptTypeHints());
		} else if (!selector.canCreateNewJobs()) {
			// concept or link property

			hintsPromises.push(
				...parentConceptTypes.map(conceptType =>
					this.getPropertyTypeHintsForConceptType(conceptType)
				)
			);

			hintsPromises.push(
				...parentLinkTypes.map(linkType => this.getPropertyTypeHintsForLinkType(linkType))
			);
		}

		// TODO improve error handling
		const hints = await Promise.all(hintsPromises.map(promise => promise.catch(console.error)));
		return hints.compact().flatten();
	}
}
