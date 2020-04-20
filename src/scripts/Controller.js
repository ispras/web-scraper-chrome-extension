import * as $ from 'jquery';
import * as ich from 'icanhaz/ICanHaz';
import * as browser from 'webextension-polyfill';
import * as renderjson from 'renderjson/renderjson';
import 'jquery-searcher/dist/jquery.searcher.min';
import 'jquery-flexdatalist/jquery.flexdatalist';
import '../libs/jquery.bootstrapvalidator/bootstrapValidator';

import getContentScript from './ContentScript';
import Sitemap from './Sitemap';
import SelectorGraphv2 from './SelectorGraphv2';
import SelectorList from './SelectorList';
import SelectorTable from './Selector/SelectorTable';
import Model from './Model';

export default class SitemapController {
	constructor(store, templateDir) {
		this.store = store;
		this.templateDir = templateDir;
		this.contentScript = getContentScript('DevTools');
		this.selectorTypes = [
			{
				type: 'SelectorText',
				title: 'Text',
			},
			{
				type: 'ConstantValue',
				title: 'Constant value',
			},
			{
				type: 'SelectorInputValue',
				title: 'Input value',
			},
			{
				type: 'SelectorLink',
				title: 'Link',
			},
			{
				type: 'SelectorPopupLink',
				title: 'Popup Link',
			},
			{
				type: 'SelectorImage',
				title: 'Image',
			},
			{
				type: 'SelectorDocument',
				title: 'Document',
			},
			{
				type: 'SelectorTable',
				title: 'Table',
			},
			{
				type: 'SelectorElementAttribute',
				title: 'Element attribute',
			},
			{
				type: 'SelectorElementStyle',
				title: 'Element style',
			},
			{
				type: 'SelectorHTML',
				title: 'HTML',
			},
			{
				type: 'SelectorElement',
				title: 'Element',
			},
			{
				type: 'SelectorElementScroll',
				title: 'Element scroll down',
			},
			{
				type: 'SelectorElementClick',
				title: 'Element click',
			},
			{
				type: 'SelectorGroup',
				title: 'Grouped',
			},
		];
		this.jsonRenderer = renderjson
			.set_icons('+', '-')
			.set_show_to_level('all')
			.set_max_string_length(80)
			.set_replacer((key, value) => {
				if (typeof value === 'string') {
					return value
						.replace(/(\r\n|\n|\r)/gm, ' ')
						.replace(/\s+/g, ' ')
						.trim();
				}
				return value;
			})
			.set_sort_objects(true);
		return this.init();
	}

	control(controls) {
		const controller = this;

		for (const selector in controls) {
			for (const event in controls[selector]) {
				$(document).on(
					event,
					selector,
					(function (selector, event) {
						return function () {
							const continueBubbling = controls[selector][event].call(
								controller,
								this
							);
							if (continueBubbling !== true) {
								return false;
							}
						};
					})(selector, event)
				);
			}
		}
	}

	/**
	 * Loads templates for ICanHaz
	 */
	async loadTemplates() {
		const templateIds = [
			'Viewport',
			'SitemapList',
			'SitemapListItem',
			'SitemapCreate',
			'SitemapImport',
			'SitemapExport',
			'SitemapBrowseData',
			'SitemapScrapeConfig',
			'SitemapExportDataCSV',
			'SitemapEditMetadata',
			'SelectorList',
			'SelectorListItem',
			'SelectorEdit',
			'SelectorEditTableColumn',
			'SitemapSelectorGraph',
			'DataPreview',
			'ItemCard',
		];

		return Promise.all(
			templateIds.map(templateId => {
				return $.get(`${this.templateDir + templateId}.html`)
					.promise()
					.then(template => {
						ich.addTemplate(templateId, template);
					});
			})
		);
	}

	async init() {
		await this.loadTemplates();
		// function() {
		// currently viewed objects
		this.clearState();

		// render main viewport
		ich.Viewport().appendTo('body');

		// cancel all form submits
		$('form').bind('submit', () => {
			return false;
		});

		this.control({
			'#sitemapFiles': {
				change: this.readBlob,
			},
			'#sitemaps-nav-button': {
				click: this.showSitemaps,
			},
			'#create-sitemap-create-nav-button': {
				click: this.showCreateSitemap,
			},
			'#create-sitemap-import-nav-button': {
				click: this.showImportSitemapPanel,
			},
			'#sitemap-export-nav-button': {
				click: this.showSitemapExportPanel,
			},
			'#sitemap-export-data-csv-nav-button': {
				click: this.showSitemapExportDataCsvPanel,
			},
			'#submit-create-sitemap': {
				click: this.createSitemap,
			},
			'#submit-import-sitemap': {
				click: this.importSitemap,
			},
			'#sitemap-edit-metadata-nav-button': {
				click: this.editSitemapMetadata,
			},
			'#sitemap-selector-list-nav-button': {
				click: this.showSitemapSelectorList,
			},
			'#sitemap-selector-graph-nav-button': {
				click: this.showSitemapSelectorGraph,
			},
			'#sitemap-browse-nav-button': {
				click: this.browseSitemapData,
			},
			'button#submit-edit-sitemap': {
				click: this.editSitemapMetadataSave,
			},
			'#edit-sitemap-metadata-form': {
				submit: () => false,
			},
			'#sitemaps tr td:nth-of-type(1)': {
				click: this.editSitemap,
			},
			'#sitemaps button[action=delete-sitemap]': {
				click: this.deleteSitemap,
			},
			'#sitemap-scrape-nav-button': {
				click: this.showScrapeSitemapConfigPanel,
			},
			'#submit-scrape-sitemap-form': {
				submit: () => false,
			},
			'#submit-scrape-sitemap': {
				click: this.scrapeSitemap,
			},
			'#sitemaps button[action=browse-sitemap-data]': {
				click: this.sitemapListBrowseSitemapData,
			},
			// @TODO move to tr
			'#selector-tree tbody tr': {
				click: this.showChildSelectors,
			},
			'#selector-tree .breadcrumb a': {
				click: this.treeNavigationShowSitemapSelectorList,
			},
			'#selector-tree tr button[action=edit-selector]': {
				click: this.editSelector,
			},
			'#edit-selector select[name=type]': {
				change: () => this.selectorTypeChanged(true),
			},
			'#edit-selector button[action=save-selector]': {
				click: this.saveSelector,
			},
			'#edit-selector button[action=cancel-selector-editing]': {
				click: this.cancelSelectorEditing,
			},
			'#edit-selector #selectorId': {
				keyup: this.updateSelectorParentListOnIdChange,
			},
			'#selector-tree button[action=add-selector]': {
				click: this.addSelector,
			},
			'#selector-tree tr button[action=delete-selector]': {
				click: this.deleteSelector,
			},
			'#selector-tree tr button[action=preview-selector]': {
				click: this.previewSelectorFromSelectorTree,
			},
			'#selector-tree tr button[action=data-preview-selector]': {
				click: this.previewSelectorDataFromSelectorTree,
			},
			'#edit-selector button[action=select-selector]': {
				click: this.selectSelector,
			},
			'#edit-selector button[action=select-table-header-row-selector]': {
				click: this.selectTableHeaderRowSelector,
			},
			'#edit-selector button[action=refresh-header-row-selector]': {
				click: this.refreshTableColumns,
			},
			'#edit-selector button[action=select-table-data-row-selector]': {
				click: this.selectTableDataRowSelector,
			},
			'#edit-selector button[action=preview-selector]': {
				click: this.previewSelector,
			},
			'#edit-selector button[action=preview-click-element-selector]': {
				click: this.previewClickElementSelector,
			},
			'#edit-selector button[action=preview-table-row-selector]': {
				click: this.previewTableRowSelector,
			},
			'#edit-selector button[action=preview-selector-data]': {
				click: this.previewSelectorDataFromSelectorEditing,
			},
		});
		await this.showSitemaps();
	}

	clearState() {
		this.state = {
			// sitemap that is currently open
			currentSitemap: null,
			// selector ids that are shown in the navigation
			editSitemapBreadcumbsSelectors: null,
			currentParentSelectorId: null,
			currentSelector: null,
		};
	}

	setStateEditSitemap(sitemap) {
		this.state.currentSitemap = sitemap;
		this.state.editSitemapBreadcumbsSelectors = [{ id: '_root' }];
		this.state.currentParentSelectorId = '_root';
	}

	setActiveNavigationButton(navigationId) {
		$('.nav .active').removeClass('active');
		$(`#${navigationId}-nav-button`).closest('li').addClass('active');

		if (navigationId.match(/^sitemap-/)) {
			const navButton = $('#sitemap-nav-button');
			navButton.removeClass('disabled');
			navButton.closest('li').addClass('active');
			$('#navbar-active-sitemap-id').text(`(${this.state.currentSitemap._id})`);
		} else {
			$('#sitemap-nav-button').addClass('disabled');
			$('#navbar-active-sitemap-id').text('');
		}

		if (navigationId.match(/^create-sitemap-/)) {
			$('#create-sitemap-nav-button').closest('li').addClass('active');
		}
	}

	/**
	 * Returns bootstrapValidator object for current form in viewport
	 */
	getFormValidator() {
		return $('#viewport form').data('bootstrapValidator');
	}

	/**
	 * Returns whether current form in the viewport is valid
	 * @returns {Boolean}
	 */
	isValidForm() {
		const validator = this.getFormValidator();
		// validator.validate();
		// validate method calls submit which is not needed in this case.
		for (const field in validator.options.fields) {
			validator.validateField(field);
		}

		return validator.isValid();
	}

	/**
	 * Add validation to sitemap creation or editing form
	 */
	initSitemapValidation() {
		$('#viewport form').bootstrapValidator({
			fields: {
				_id: {
					validators: {
						notEmpty: {
							message: 'The sitemap id is required and cannot be empty',
						},
						stringLength: {
							min: 3,
							message: 'The sitemap id should be at least 3 characters long',
						},
						regexp: {
							regexp: /^[a-z][a-z0-9_\$\(\)\+\-/]+$/,
							message:
								'Only lowercase characters (a-z), digits (0-9), or any of the characters _, $, (, ), +, -, and / are allowed. Must begin with a letter.',
						},
						// placeholder for sitemap id existance validation
						callback: {
							message: 'Sitemap with this id already exists',
							callback() {
								return true;
							},
						},
					},
				},
				startUrls: {
					validators: {
						notEmpty: {
							message: 'The start URL is required and cannot be empty',
						},
						callback: {
							message: 'The start URLs are not valid. Please use "," as a seperator.',
							callback(value) {
								return Sitemap.validateStartUrls(value.split(','));
							},
						},
					},
				},
				model: {
					validators: {
						callback: {
							callback(value) {
								if (!value) {
									return {
										message: 'Empty value is possible model',
										valid: true,
									};
								}
								try {
									return Model.validateModel(JSON.parse(value));
								} catch (e) {
									return {
										valid: false,
										message: 'JSON is not valid',
									};
								}
							},
						},
					},
				},
			},
		});
	}

	showCreateSitemap() {
		this.setActiveNavigationButton('create-sitemap-create');
		const sitemapForm = ich.SitemapCreate();
		$('#viewport').html(sitemapForm);
		this.initSitemapValidation();
		return true;
	}

	initImportSitemapValidation() {
		$('#viewport form').bootstrapValidator({
			fields: {
				_id: {
					validators: {
						stringLength: {
							min: 3,
							message: 'The sitemap id should be at least 3 characters long',
						},
						regexp: {
							regexp: /^[a-z][a-z0-9_\$\(\)\+\-/]+$/,
							message:
								'Only lowercase characters (a-z), digits (0-9), or any of the characters _, $, (, ), +, -, and / are allowed. Must begin with a letter.',
						},
						// placeholder for sitemap id existance validation
						callback: {
							message: 'Sitemap with this id already exists',
							callback(value, validator) {
								validator.revalidateField('sitemapJSON');
								return true;
							},
						},
					},
				},
				sitemapJSON: {
					validators: {
						notEmpty: {
							message: 'Sitemap JSON is required and cannot be empty',
						},
						callback: {
							message: 'JSON is not valid',
							callback(value, validator) {
								try {
									const sitemap = JSON.parse(value);

									const renameId = $('#viewport form [name="_id"]').val();
									if (!renameId) {
										if (!sitemap.hasOwnProperty('_id')) {
											return {
												valid: false,
												message:
													'The sitemap id is required and cannot be empty',
											};
										}
										if (sitemap._id.length < 3) {
											return {
												valid: false,
												message:
													'The sitemap id should be at least 3 characters long',
											};
										}
										if (
											!sitemap._id.match('^[a-z][a-z0-9_\\$\\(\\)\\+\\-/]+$')
										) {
											return {
												valid: false,
												message:
													'Only lowercase characters (a-z), digits (0-9), or any of the characters _, $, (, ), +, -, and / are allowed. Must begin with a letter.',
											};
										}
									}

									// check for start urls
									if (!sitemap.hasOwnProperty('startUrls')) {
										return {
											valid: false,
											message:
												'The start URL is required and cannot be empty',
										};
									}
									if (!Sitemap.validateStartUrls(sitemap.startUrls)) {
										return {
											valid: false,
											message: 'The start URLs are not valid',
										};
									}

									const result = Model.validateModel(sitemap.model);
									if (!result.valid) {
										return result;
									}
								} catch (e) {
									return {
										valid: false,
										message: 'JSON is not valid',
									};
								}
								return {
									message: 'Valid sitemap',
									valid: true,
								};
							},
						},
					},
				},
			},
		});
	}

	readBlob() {
		const { files } = $('#sitemapFiles')[0];
		if (!files.length) {
			alert('Please select a file!');
			return;
		}
		const file = files[0];
		const validator = this.getFormValidator();
		const blob = file.slice(0, file.size);
		blob.text().then(text => {
			$('#sitemapJSON').val(text);
			validator.revalidateField('_id');
			validator.revalidateField('sitemapJSON');
		});
		return true;
	}

	showImportSitemapPanel() {
		this.setActiveNavigationButton('create-sitemap-import');
		const sitemapForm = ich.SitemapImport();
		$('#viewport').html(sitemapForm);
		this.initImportSitemapValidation();
		return true;
	}

	showSitemapExportPanel() {
		this.setActiveNavigationButton('sitemap-export');
		const sitemap = this.state.currentSitemap;
		const sitemapJSON = sitemap.exportSitemap();

		const sitemapExportForm = ich.SitemapExport({
			sitemapJSON,
		});

		const blob = new Blob([sitemapJSON], { type: 'text/json' });

		$('#viewport').html(sitemapExportForm);

		const downloadButton = $('#download-button');
		downloadButton.attr('href', window.URL.createObjectURL(blob));
		downloadButton.attr('download', `${sitemap._id}.json`);

		return true;
	}

	async showSitemaps() {
		this.clearState();
		this.setActiveNavigationButton('sitemaps');

		const sitemaps = await this.store.getAllSitemaps();
		const $sitemapListPanel = ich.SitemapList();

		sitemaps.forEach(sitemap => {
			const $sitemap = ich.SitemapListItem(sitemap);
			$sitemap.data('sitemap', sitemap);
			$sitemapListPanel.find('tbody').append($sitemap);
		});
		$('#viewport').html($sitemapListPanel);
	}

	getSitemapFromMetadataForm() {
		const id = $('#viewport form input[name=_id]').val();
		const $startUrlInputs = $('#viewport form .input-start-url');
		const startUrls = $startUrlInputs
			.val()
			.split(',')
			.map(item => item.trim());
		const modelStr = $('#viewport .input-model').val();
		return {
			id,
			startUrls,
			model: modelStr ? JSON.parse(modelStr) : undefined,
		};
	}

	async createSitemap() {
		// cancel submit if invalid form

		if (!this.isValidForm()) {
			return false;
		}

		const sitemapData = this.getSitemapFromMetadataForm();

		// check whether sitemap with this id already exist
		const sitemapExists = await this.store.sitemapExists(sitemapData.id);
		if (sitemapExists) {
			const validator = this.getFormValidator();
			validator.updateStatus('_id', 'INVALID', 'callback');
		} else {
			let sitemap = new Sitemap(sitemapData.id, sitemapData.startUrls, sitemapData.model, []);
			sitemap = await this.store.createSitemap(sitemap);
			this._editSitemap(sitemap, ['_root']);
		}
	}

	async importSitemap() {
		// cancel submit if invalid form

		if (!this.isValidForm()) {
			return false;
		}

		// load data from form
		const sitemapJSON = $('[name=sitemapJSON]').val();
		const sitemapObj = JSON.parse(sitemapJSON);

		let id = $('input[name=_id]').val();
		if (!id) {
			id = sitemapObj._id;
		}

		// check whether sitemap with this id already exist
		const sitemapExists = await this.store.sitemapExists(id);
		if (sitemapExists) {
			const validator = this.getFormValidator();
			validator.updateStatus('_id', 'INVALID', 'callback');
		} else {
			let sitemap = new Sitemap(
				id,
				sitemapObj.startUrls,
				sitemapObj.model,
				sitemapObj.selectors
			);
			sitemap = await this.store.createSitemap(sitemap);
			this._editSitemap(sitemap, ['_root']);
		}
	}

	editSitemapMetadata() {
		this.setActiveNavigationButton('sitemap-edit-metadata');

		const sitemap = this.state.currentSitemap.clone();
		if (sitemap.model) {
			sitemap.model = sitemap.model.toString();
		}
		const $sitemapMetadataForm = ich.SitemapEditMetadata(sitemap);
		$('#viewport').html($sitemapMetadataForm);
		this.initSitemapValidation();

		return true;
	}

	async editSitemapMetadataSave() {
		const sitemap = this.state.currentSitemap;
		const sitemapData = this.getSitemapFromMetadataForm();

		// cancel submit if invalid form
		if (!this.isValidForm()) {
			return false;
		}

		// check whether sitemap with this id already exist
		const sitemapExists = await this.store.sitemapExists(sitemapData.id);

		if (sitemap._id !== sitemapData.id && sitemapExists) {
			const validator = this.getFormValidator();
			validator.updateStatus('_id', 'INVALID', 'callback');
			return false;
		}

		// just change sitemaps url
		if (sitemapData.id === sitemap._id) {
			// change data
			sitemap.startUrls = sitemapData.startUrls;
			sitemap.model = new Model(sitemapData.model);
			await this.store.saveSitemap(sitemap);
		} else {
			// id changed. we need to delete the old one and create a new one
			const oldSitemap = sitemap;
			const newSitemap = new Sitemap(
				sitemapData.id,
				sitemapData.startUrls,
				sitemapData.model,
				sitemap.selectors
			);
			if (newSitemap._rev) {
				delete newSitemap._rev;
			}
			await this.store.createSitemap(newSitemap);
			await this.store.deleteSitemap(oldSitemap);
			this.state.currentSitemap = newSitemap;
		}
		this.showSitemapSelectorList();
	}

	/**
	 * Callback when sitemap edit button is clicked in sitemap grid
	 */
	editSitemap(td) {
		const sitemap = $(td).parent().data('sitemap');
		this._editSitemap(sitemap);
	}

	_editSitemap(sitemap) {
		this.setStateEditSitemap(sitemap);
		this.setActiveNavigationButton('sitemap');

		this.showSitemapSelectorList();
	}

	showSitemapSelectorList() {
		this.setActiveNavigationButton('sitemap-selector-list');

		const sitemap = this.state.currentSitemap;
		const parentSelectors = this.state.editSitemapBreadcumbsSelectors;
		const parentSelectorId = this.state.currentParentSelectorId;

		const $selectorListPanel = ich.SelectorList({
			parentSelectors,
		});
		const selectors = sitemap.getDirectChildSelectors(parentSelectorId);
		selectors.forEach(function (selector) {
			const $selector = ich.SelectorListItem(selector);
			$selector.data('selector', selector);
			$selectorListPanel.find('tbody').append($selector);
		});
		$('#viewport').html($selectorListPanel);

		return true;
	}

	showSitemapSelectorGraph() {
		this.setActiveNavigationButton('sitemap-selector-graph');
		const sitemap = this.state.currentSitemap;
		const $selectorGraphPanel = ich.SitemapSelectorGraph();
		$('#viewport').html($selectorGraphPanel);
		const graphDiv = $('#selector-graph')[0];
		const graph = new SelectorGraphv2(sitemap);
		graph.draw(graphDiv, $(document).width(), 200);
		return true;
	}

	showChildSelectors(tr) {
		const selector = $(tr).data('selector');
		const parentSelectors = this.state.editSitemapBreadcumbsSelectors;
		this.state.currentParentSelectorId = selector.id;
		parentSelectors.push(selector);

		this.showSitemapSelectorList();
	}

	treeNavigationShowSitemapSelectorList(button) {
		const parentSelectors = this.state.editSitemapBreadcumbsSelectors;
		const controller = this;
		$('#selector-tree .breadcrumb li a').each(function (i, parentSelectorButton) {
			if (parentSelectorButton === button) {
				parentSelectors.splice(i + 1);
				controller.state.currentParentSelectorId = parentSelectors[i].id;
			}
		});
		this.showSitemapSelectorList();
	}

	initSelectorValidation() {
		return $('#viewport form').bootstrapValidator({
			fields: {
				id: {
					validators: {
						notEmpty: {
							message: 'Selector id required and cannot be empty',
						},
						stringLength: {
							min: 3,
							message: 'The selector id should be at least 3 characters long',
						},
						regexp: {
							regexp: /^[^_].*$/,
							message: 'Selector id cannot start with an underscore _',
						},
					},
				},
				selector: {
					validators: {
						notEmpty: {
							message: 'Selector is required and cannot be empty',
						},
					},
				},
				regex: {
					validators: {
						callback: {
							message:
								'JavaScript does not support regular expressions that can match 0 characters.',
							callback(value, validator) {
								// allow no regex
								if (!value) {
									return true;
								}

								try {
									const matches = ''.match(new RegExp(value));
									return !(matches !== null && matches[0] === '');
								} catch (e) {
									return false;
								}
							},
						},
					},
				},
				regexgroup: {
					validators: {
						callback: {
							message: 'Regex group must be numeric',
							callback(value, validator) {
								if (value === '') {
									return true;
								}
								return !isNaN(value);
							},
						},
					},
				},
				clickElementSelector: {
					validators: {
						notEmpty: {
							message: 'Click selector is required and cannot be empty',
						},
					},
				},
				tableHeaderRowSelector: {
					validators: {
						notEmpty: {
							message: 'Header row selector is required and cannot be empty',
						},
					},
				},
				tableDataRowSelector: {
					validators: {
						notEmpty: {
							message: 'Data row selector is required and cannot be empty',
						},
					},
				},
				delay: {
					validators: {
						numeric: {
							message: 'Delay must be numeric',
						},
					},
				},
				paginationLimit: {
					validators: {
						numeric: {
							message: 'Pagination limit must be numeric or empty',
						},
						callback: {
							message: 'Pagination limit must be 1 at least',
							callback(value, validator) {
								if (!value) {
									return true;
								}
								return value >= 1;
							},
						},
					},
				},
				parentSelectors: {
					validators: {
						notEmpty: {
							message: 'You must choose at least one parent selector',
						},
						callback: {
							message: 'Cannot handle recursive element selectors',
							callback: function (value, validator, $field) {
								const sitemap = this.getCurrentlyEditedSelectorSitemap();
								return !sitemap.selectors.hasRecursiveElementSelectors();
							}.bind(this),
						},
					},
				},
			},
		});
	}

	editSelector(button) {
		const selector = $(button).closest('tr').data('selector');
		this._editSelector(selector);
	}

	updateSelectorParentListOnIdChange() {
		const selector = this.getCurrentlyEditedSelector();
		$('.currently-edited').val(selector.id).text(selector.id);
	}

	_editSelector(selector) {
		const sitemap = this.state.currentSitemap;
		const selectorIds = sitemap.getPossibleParentSelectorIds();

		const $editSelectorForm = ich.SelectorEdit({
			selector,
			selectorIds,
			selectorTypes: this.selectorTypes,
		});
		$('#viewport').html($editSelectorForm);

		$('#selectorId').flexdatalist({
			init: this.initSelectorValidation(),
			textProperty: '{fieldName}',
			valueProperty: 'fieldName',
			data: [...sitemap.model, { entity: '', field: '', fieldName: selector.id }],
			searchIn: ['entity', 'field'],
			visibleProperties: ['entity', 'field'],
			groupBy: 'entity',
			searchContain: true,
			noResultsText: '',
			minLength: 1,
		});

		// mark initially opened selector as currently edited
		$('#edit-selector #parentSelectors option').each((_, element) => {
			if ($(element).val() === selector.id) {
				$(element).addClass('currently-edited');
			}
		});

		// set clickType
		if (selector.clickType) {
			$editSelectorForm.find('[name=clickType]').val(selector.clickType);
		}

		// set clickElementUniquenessType
		if (selector.clickElementUniquenessType) {
			$editSelectorForm
				.find('[name=clickElementUniquenessType]')
				.val(selector.clickElementUniquenessType);
		}

		// handle selects seperately
		$editSelectorForm.find('[name=type]').val(selector.type);
		selector.parentSelectors.forEach(parentSelectorId => {
			$editSelectorForm
				.find(`#parentSelectors [value='${parentSelectorId}']`)
				.attr('selected', 'selected');
		});

		this.state.currentSelector = selector;
		this.selectorTypeChanged(false);
	}

	selectorTypeChanged(changeTrigger) {
		// let type = $('#edit-selector select[name=type]').val();
		// add this selector to possible parent selector
		const selector = this.getCurrentlyEditedSelector();
		// this.state.currentSelector = selector;
		const features = selector.getFeatures();
		$('#edit-selector .feature').hide();
		features.forEach(function (feature) {
			$(`#edit-selector .feature-${feature}`).show();
		});

		if (changeTrigger && selector.type === 'SelectorLink') {
			$('#edit-selector [name=extractAttribute]').val('href');
		}

		if (selector.canHaveChildSelectors()) {
			if ($('#edit-selector #parentSelectors .currently-edited').length === 0) {
				const $option = $('<option class="currently-edited"></option>');
				$option.text(selector.id).val(selector.id);
				$('#edit-selector #parentSelectors').append($option);
			}
		}
		// remove if type doesn't allow to have child selectors
		else {
			$('#edit-selector #parentSelectors .currently-edited').remove();
		}
	}

	saveSelector(button) {
		const sitemap = this.state.currentSitemap;
		const selector = this.state.currentSelector;
		const newSelector = this.getCurrentlyEditedSelector();
		const validator = this.getFormValidator();
		validator.revalidateField('id');
		// cancel submit if invalid form
		if (!this.isValidForm()) {
			return false;
		}

		// cancel possible element selection
		this.contentScript.removeCurrentContentSelector().done(
			function () {
				sitemap.updateSelector(selector, newSelector);
				this.store.saveSitemap(sitemap).then(
					function () {
						this.showSitemapSelectorList();
					}.bind(this)
				);
			}.bind(this)
		);
	}

	/**
	 * Get selector from selector editing form
	 */
	getCurrentlyEditedSelector() {
		const id = $('#edit-selector [name=id]').val();
		const selectorsSelector = $('#edit-selector [name=selector]').val();
		const tableDataRowSelector = $('#edit-selector [name=tableDataRowSelector]').val();
		const tableHeaderRowSelector = $('#edit-selector [name=tableHeaderRowSelector]').val();
		const tableAddMissingColumns = $('#edit-selector [name=tableAddMissingColumns]').is(
			':checked'
		);
		const verticalTable = $('#edit-selector [name=verticalTable]').is(':checked');
		const clickElementSelector = $('#edit-selector [name=clickElementSelector]').val();
		const type = $('#edit-selector [name=type]').val();
		const clickElementUniquenessType = $(
			'#edit-selector [name=clickElementUniquenessType]'
		).val();
		const clickType = $('#edit-selector [name=clickType]').val();
		const paginationLimit = $('#edit-selector [name=paginationLimit]').val();
		const discardInitialElements = $('#edit-selector [name=discardInitialElements]').is(
			':checked'
		);
		const multiple = $('#edit-selector [name=multiple]').is(':checked');
		const downloadImage = $('#edit-selector [name=downloadImage]').is(':checked');
		const downloadDocument = $('#edit-selector [name=downloadDocument]').is(':checked');
		const clickPopup = $('#edit-selector [name=clickPopup]').is(':checked');
		const delay = $('#edit-selector [name=delay]').val();
		const extractAttribute = $('#edit-selector [name=extractAttribute]').val();
		const extractStyle = $('#edit-selector [name=extractStyle]').val();
		const value = $('#edit-selector [name=value]').val();
		const parentSelectors = $('#edit-selector [name=parentSelectors]').val();
		const columns = [];
		const $columnHeaders = $('#edit-selector .column-header');
		const $columnNames = $('#edit-selector .column-name');
		const $columnExtracts = $('#edit-selector .column-extract');
		const stringReplacement = {
			replaceString: $('#edit-selector [name=replaceString]').val(),
			replacementString: $('#edit-selector [name=replacementString]').val(),
		};
		const textmanipulation = {
			removeHtml: $('#edit-selector [name=removeHtml]').is(':checked'),
			trimText: $('#edit-selector [name=trimText]').is(':checked'),
			replaceText: $('#edit-selector [name=replaceText]').val(),
			replacementText: $('#edit-selector [name=replacementText]').val(),
			textPrefix: $('#edit-selector [name=textPrefix]').val(),
			textSuffix: $('#edit-selector [name=textSuffix]').val(),
			regex: $('#edit-selector [name=regex]').val(),
			regexgroup: $('#edit-selector [name=regexgroup]').val(),
		};

		$columnHeaders.each(function (i) {
			const header = $($columnHeaders[i]).val();
			const name = $($columnNames[i]).val();
			const extract = $($columnExtracts[i]).is(':checked');
			columns.push({
				header,
				name,
				extract,
			});
		});

		return SelectorList.createSelector({
			id,
			selector: selectorsSelector,
			tableHeaderRowSelector,
			tableAddMissingColumns,
			verticalTable,
			tableDataRowSelector,
			clickElementSelector,
			clickElementUniquenessType,
			clickType,
			paginationLimit,
			discardInitialElements,
			type,
			multiple,
			downloadImage,
			downloadDocument,
			clickPopup,
			extractAttribute,
			extractStyle,
			value,
			parentSelectors,
			columns,
			delay,
			textmanipulation,
			stringReplacement,
		});
	}

	/**
	 * @returns {Sitemap|*} Cloned Sitemap with currently edited selector
	 */
	getCurrentlyEditedSelectorSitemap() {
		const sitemap = this.state.currentSitemap.clone();
		const selector = sitemap.getSelectorById(this.state.currentSelector.id);
		const newSelector = this.getCurrentlyEditedSelector();
		sitemap.updateSelector(selector, newSelector);
		return sitemap;
	}

	cancelSelectorEditing(button) {
		// cancel possible element selection
		this.contentScript.removeCurrentContentSelector().done(
			function () {
				this.showSitemapSelectorList();
			}.bind(this)
		);
	}

	addSelector() {
		const parentSelectorId = this.state.currentParentSelectorId;
		const sitemap = this.state.currentSitemap;

		const selector = SelectorList.createSelector({
			parentSelectors: [parentSelectorId],
			type: 'SelectorText',
			multiple: false,
		});

		this._editSelector(selector, sitemap);
	}

	deleteSelector(button) {
		const sitemap = this.state.currentSitemap;
		const selector = $(button).closest('tr').data('selector');
		sitemap.deleteSelector(selector);

		this.store.saveSitemap(sitemap).then(
			function () {
				this.showSitemapSelectorList();
			}.bind(this)
		);
	}

	deleteSitemap(button) {
		const sitemap = $(button).closest('tr').data('sitemap');
		const controller = this;
		this.store.deleteSitemap(sitemap).then(function () {
			controller.showSitemaps();
		});
	}

	initScrapeSitemapConfigValidation() {
		$('#viewport form').bootstrapValidator({
			fields: {
				requestInterval: {
					validators: {
						notEmpty: {
							message: 'The request interval is required and cannot be empty',
						},
						numeric: {
							message: 'The request interval must be numeric',
						},
						callback: {
							message: 'The request interval must be atleast 2000 milliseconds',
							callback(value, validator) {
								return value >= 2000;
							},
						},
					},
				},
				requestIntervalRandomness: {
					validators: {
						notEmpty: {
							message:
								'The request interval randomness is required and cannot be empty',
						},
						numeric: {
							message: 'The request interval randomness must be numeric',
						},
					},
				},
				pageLoadDelay: {
					validators: {
						notEmpty: {
							message: 'The page load delay is required and cannot be empty',
						},
						numeric: {
							message: 'The page laod delay must be numeric',
						},
						callback: {
							message: 'The page load delay must be atleast 500 milliseconds',
							callback(value, validator) {
								return value >= 500;
							},
						},
					},
				},
			},
		});
	}

	showScrapeSitemapConfigPanel() {
		this.setActiveNavigationButton('sitemap-scrape');
		const scrapeConfigPanel = ich.SitemapScrapeConfig();
		$('#viewport').html(scrapeConfigPanel);
		this.initScrapeSitemapConfigValidation();
		return true;
	}

	scrapeSitemap() {
		if (!this.isValidForm()) {
			return false;
		}

		const requestInterval = $('input[name=requestInterval]').val();
		const pageLoadDelay = $('input[name=pageLoadDelay]').val();
		const intervalRandomness = $('input[name=requestIntervalRandomness]').val();

		const sitemap = this.state.currentSitemap;
		const request = {
			scrapeSitemap: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
			requestInterval,
			pageLoadDelay,
			requestIntervalRandomness: intervalRandomness,
		};

		// show sitemap scraping panel
		this.getFormValidator().destroy();
		$('.scraping-in-progress').removeClass('hide');
		$('#submit-scrape-sitemap').closest('.form-group').hide();
		$('#scrape-sitemap-config input').prop('disabled', true);

		browser.runtime.sendMessage(request).then(
			function (selectors) {
				// table selector can dynamically add columns
				// replace current selector (columns) with the dynamicly created once
				sitemap.selectors = new SelectorList(selectors);
				this.browseSitemapData();
			}.bind(this)
		);
		return false;
	}

	sitemapListBrowseSitemapData(button) {
		const sitemap = $(button).closest('tr').data('sitemap');
		this.setStateEditSitemap(sitemap);
		this.browseSitemapData();
	}

	browseSitemapData() {
		this.setActiveNavigationButton('sitemap-browse');
		let sitemap = this.state.currentSitemap;
		this.store.getSitemapData(sitemap).then(data => {
			let $dataPanel = ich.SitemapBrowseData();
			$('#viewport').html($dataPanel);

			// display data
			// Doing this the long way so there aren't xss vulnerubilites
			// while working with data or with the selector titles

			let $accordion = $('#sitemap-data');
			for (let rowNum = 0; rowNum < data.length; rowNum++) {
				let $card = ich.ItemCard({
					id: rowNum,
					url: data[rowNum].url || 'Item' + rowNum,
				});
				$accordion.append($card);
			}

			for (let rowNum = 0; rowNum < data.length; rowNum++) {
				let row = data[rowNum];
				if (row.hasOwnProperty('_id')) {
					delete row['_id'];
				}
				if (row.hasOwnProperty('_rev')) {
					delete row['_rev'];
				}
				$('#json-' + rowNum).html(this.jsonRenderer(row));
			}

			$accordion.searcher({
				itemSelector: '.panel', // jQuery selector for the data item element
				textSelector: '.panel-body', // jQuery selector for the element which contains the text
				inputSelector: '#search-input', // jQuery selector for the input element
			});

			$('.collapse').collapse('show');
		});

		return true;
	}

	showSitemapExportDataCsvPanel() {
		this.setActiveNavigationButton('sitemap-export-data-csv');

		const sitemap = this.state.currentSitemap;
		const exportPanel = ich.SitemapExportDataCSV(sitemap);
		$('#viewport').html(exportPanel);

		$('.result').hide();
		$('.download-button').hide();

		// generate data
		$('#generate-csv').click(
			function () {
				$('.result').show();
				$('.download-button').hide();

				const options = {
					delimiter: $('#delimiter').val(),
					newline: $('#newline').prop('checked'),
					containBom: $('#utf-bom').prop('checked'),
				};

				this.store.getSitemapData(sitemap).then(function (data) {
					const blob = sitemap.getDataExportCsvBlob(data, options);
					const button_a = $('.download-button a');
					button_a.attr('href', window.URL.createObjectURL(blob));
					button_a.attr('download', `${sitemap._id}.csv`);
					$('.download-button').show();
					$('.result').hide();
				});
			}.bind(this)
		);

		return true;
	}

	async selectSelector(button) {
		const input = $(button).closest('.form-group').find('input.selector-value');
		const sitemap = this.getCurrentlyEditedSelectorSitemap();
		let selector = this.getCurrentlyEditedSelector();
		const currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
		const parentCSSSelector = sitemap.selectors.getParentCSSSelectorWithinOnePage(
			currentStateParentSelectorIds
		);

		const result = await this.contentScript
			.selectSelector({
				parentCSSSelector: parentCSSSelector,
				allowedElements: selector.getItemCSSSelector(),
			})
			.promise();

		selector = this.getCurrentlyEditedSelector();
		await selector.afterSelect(result.CSSSelector, this);

		// update validation for selector field
		const validator = this.getFormValidator();
		validator.revalidateField(input);
	}

	getCurrentStateParentSelectorIds() {
		return this.state.editSitemapBreadcumbsSelectors.map(selector => selector.id);
	}

	async refreshTableColumns() {
		const selector = this.getCurrentlyEditedSelector();

		if (!selector instanceof SelectorTable) {
			//wrong selector triggered this event
			return false;
		}

		const html = await this.getSelectorHTML().promise();
		selector.getTableHeaderColumnsFromHTML(html);
		this.renderTableHeaderColumns(selector.headerColumns);
	}

	async selectTableHeaderRowSelector(button) {
		const sitemap = this.getCurrentlyEditedSelectorSitemap();
		const selector = this.getCurrentlyEditedSelector();

		if (!selector instanceof SelectorTable) {
			//wrong selector triggered this event
			return false;
		}

		const currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
		const parentCSSSelector = sitemap.selectors.getCSSSelectorWithinOnePage(
			selector.id,
			currentStateParentSelectorIds
		);

		const result = await this.contentScript
			.selectSelector({
				parentCSSSelector,
				allowedElements: 'tr',
			})
			.promise();

		const tableHeaderRowSelector = result.CSSSelector;
		selector.tableHeaderRowSelector = tableHeaderRowSelector;

		let html = this.getSelectorHTML().promise();
		selector.getTableHeaderColumnsFromHTML(html);
		this.renderTableHeaderColumns(selector.headerColumns);

		// update validation for selector field
		const input = $(button).closest('.form-group').find('input.selector-value');
		$(input).val(tableHeaderRowSelector);
		const validator = this.getFormValidator();
		validator.revalidateField(input);
	}

	async selectTableDataRowSelector(button) {
		const sitemap = this.getCurrentlyEditedSelectorSitemap();
		const selector = this.getCurrentlyEditedSelector();
		const currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
		const parentCSSSelector = sitemap.selectors.getCSSSelectorWithinOnePage(
			selector.id,
			currentStateParentSelectorIds
		);

		const result = await this.contentScript
			.selectSelector({
				parentCSSSelector,
				allowedElements: 'tr',
			})
			.promise();

		// update validation for selector field
		const input = $(button).closest('.form-group').find('input.selector-value');
		$(input).val(result.CSSSelector);
		const validator = this.getFormValidator();
		validator.revalidateField(input);
	}

	/**
	 * update table selector column editing fields
	 */
	renderTableHeaderColumns(headerColumns) {
		// reset previous columns
		const $tbody = $('.feature-columns table tbody');
		$tbody.html('');
		headerColumns.forEach(function (column) {
			const $row = ich.SelectorEditTableColumn(column);
			$tbody.append($row);
		});
	}

	/**
	 * Returns HTML that the current selector would select
	 */
	getSelectorHTML() {
		const sitemap = this.getCurrentlyEditedSelectorSitemap();
		const selector = this.getCurrentlyEditedSelector();
		const currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
		const CSSSelector = sitemap.selectors.getCSSSelectorWithinOnePage(
			selector.id,
			currentStateParentSelectorIds
		);
		return this.contentScript.getHTML({ CSSSelector }).promise();
	}

	previewSelector(button) {
		if (!$(button).hasClass('preview')) {
			const sitemap = this.getCurrentlyEditedSelectorSitemap();
			const selector = this.getCurrentlyEditedSelector();
			const currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
			const parentCSSSelector = sitemap.selectors.getParentCSSSelectorWithinOnePage(
				currentStateParentSelectorIds
			);
			const deferredSelectorPreview = this.contentScript.previewSelector({
				parentCSSSelector,
				elementCSSSelector: selector.selector,
			});

			deferredSelectorPreview.done(function () {
				$(button).addClass('preview');
			});
		} else {
			this.contentScript.removeCurrentContentSelector();
			$(button).removeClass('preview');
		}
	}

	previewClickElementSelector(button) {
		if (!$(button).hasClass('preview')) {
			const sitemap = this.state.currentSitemap;
			const selector = this.getCurrentlyEditedSelector();
			const currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
			const parentCSSSelector = sitemap.selectors.getParentCSSSelectorWithinOnePage(
				currentStateParentSelectorIds
			);

			const deferredSelectorPreview = this.contentScript.previewSelector({
				parentCSSSelector,
				elementCSSSelector: selector.clickElementSelector,
			});

			deferredSelectorPreview.done(function () {
				$(button).addClass('preview');
			});
		} else {
			this.contentScript.removeCurrentContentSelector();
			$(button).removeClass('preview');
		}
	}

	previewTableRowSelector(button) {
		if (!$(button).hasClass('preview')) {
			const sitemap = this.getCurrentlyEditedSelectorSitemap();
			const selector = this.getCurrentlyEditedSelector();
			const currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
			const parentCSSSelector = sitemap.selectors.getCSSSelectorWithinOnePage(
				selector.id,
				currentStateParentSelectorIds
			);
			const rowSelector = $(button).closest('.form-group').find('input').val();

			const deferredSelectorPreview = this.contentScript.previewSelector({
				parentCSSSelector,
				elementCSSSelector: rowSelector,
			});

			deferredSelectorPreview.done(function () {
				$(button).addClass('preview');
			});
		} else {
			this.contentScript.removeCurrentContentSelector();
			$(button).removeClass('preview');
		}
	}

	previewSelectorFromSelectorTree(button) {
		if (!$(button).hasClass('preview')) {
			const sitemap = this.state.currentSitemap;
			const selector = $(button).closest('tr').data('selector');
			const currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
			const parentCSSSelector = sitemap.selectors.getParentCSSSelectorWithinOnePage(
				currentStateParentSelectorIds
			);
			const deferredSelectorPreview = this.contentScript.previewSelector({
				parentCSSSelector,
				elementCSSSelector: selector.selector,
			});

			deferredSelectorPreview.done(function () {
				$(button).addClass('preview');
			});
		} else {
			this.contentScript.removeCurrentContentSelector();
			$(button).removeClass('preview');
		}
	}

	previewSelectorDataFromSelectorTree(button) {
		const sitemap = this.state.currentSitemap;
		const selector = $(button).closest('tr').data('selector');
		this.previewSelectorData(sitemap, selector.id);
	}

	previewSelectorDataFromSelectorEditing() {
		const sitemap = this.state.currentSitemap.clone();
		const selector = sitemap.getSelectorById(this.state.currentSelector.id);
		const newSelector = this.getCurrentlyEditedSelector();
		sitemap.updateSelector(selector, newSelector);
		this.previewSelectorData(sitemap, newSelector.id);
	}

	/**
	 * Returns a list of selector ids that the user has opened
	 * @returns {Array}
	 */
	getStateParentSelectorIds() {
		const parentSelectorIds = [];
		this.state.editSitemapBreadcumbsSelectors.forEach(function (selector) {
			parentSelectorIds.push(selector.id);
		});
		return parentSelectorIds;
	}

	previewSelectorData(sitemap, selectorId) {
		// data preview will be base on how the selector tree is opened
		const parentSelectorIds = this.getStateParentSelectorIds();

		const request = {
			previewSelectorData: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
			parentSelectorIds,
			selectorId,
		};

		browser.runtime.sendMessage(request).then(response => {
			if (response.length === 0) {
				return;
			}

			let $dataPreviewPanel = ich.DataPreview();

			$('#viewport').append($dataPreviewPanel);
			$dataPreviewPanel.modal('show');
			// display data
			// Doing this the long way so there aren't xss vulnerubilites
			// while working with data or with the selector titles
			let $accordion = $('#data-preview', $dataPreviewPanel);
			for (let rowNum = 0; rowNum < response.length; rowNum++) {
				let $card = ich.ItemCard({
					id: rowNum,
					url: response[rowNum].url || 'Item' + rowNum,
				});
				$accordion.append($card);
			}

			const windowHeight = $(window).height();
			for (let rowNum = 0; rowNum < response.length; rowNum++) {
				$('#json-' + rowNum).html(this.jsonRenderer(response[rowNum]));
			}

			$('.collapse').collapse('show');
			$('.data-preview-modal .modal-body').height(windowHeight - 130);

			// remove modal from dom after it is closed
			$dataPreviewPanel.on('hidden.bs.modal', function () {
				$(this).remove();
			});
		});
	}
}
