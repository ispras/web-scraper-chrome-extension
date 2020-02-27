import getBackgroundScript from './BackgroundScript';
import getContentScript from './ContentScript';
import Sitemap from './Sitemap';
import SelectorGraphv2 from './SelectorGraphv2';
import SelectorList from './SelectorList';
import SelectorTable from './Selector/SelectorTable';
import Model from './Model';
import * as ich from 'icanhaz/ICanHaz';
import 'jquery-flexdatalist/jquery.flexdatalist';
import '../libs/jquery.bootstrapvalidator/bootstrapValidator';
import * as browser from 'webextension-polyfill';

export default class SitemapController {
	constructor(store, templateDir) {
		this.store = store;
		this.templateDir = templateDir;
		this.backgroundScript = getBackgroundScript('DevTools');
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
		this.init();
	}

	control(controls) {
		let controller = this;

		for (let selector in controls) {
			for (let event in controls[selector]) {
				$(document).on(
					event,
					selector,
					(function(selector, event) {
						return function() {
							let continueBubbling = controls[selector][event].call(controller, this);
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
	loadTemplates(cbAllTemplatesLoaded) {
		let templateIds = [
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
		];
		let templatesLoaded = 0;
		let cbLoaded = function(templateId, template) {
			templatesLoaded++;
			ich.addTemplate(templateId, template);
			if (templatesLoaded === templateIds.length) {
				cbAllTemplatesLoaded();
			}
		};

		templateIds.forEach(
			function(templateId) {
				$.get(this.templateDir + templateId + '.html', cbLoaded.bind(this, templateId));
			}.bind(this)
		);
	}

	init() {
		this.loadTemplates(
			function() {
				// currently viewed objects
				this.clearState();

				// render main viewport
				ich.Viewport().appendTo('body');

				// cancel all form submits
				$('form').bind('submit', function() {
					return false;
				});

				this.control({
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
						submit: function() {
							return false;
						},
					},
					'#sitemaps tr': {
						click: this.editSitemap,
					},
					'#sitemaps button[action=delete-sitemap]': {
						click: this.deleteSitemap,
					},
					'#sitemap-scrape-nav-button': {
						click: this.showScrapeSitemapConfigPanel,
					},
					'#submit-scrape-sitemap-form': {
						submit: function() {
							return false;
						},
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
						click: this.treeNavigationshowSitemapSelectorList,
					},
					'#selector-tree tr button[action=edit-selector]': {
						click: this.editSelector,
					},
					'#edit-selector select[name=type]': {
						change: function() {
							this.selectorTypeChanged(true);
						}.bind(this),
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
						click: this.refreshTableHeaderRowSelector,
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
				this.showSitemaps();
			}.bind(this)
		);
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
		$('#' + navigationId + '-nav-button')
			.closest('li')
			.addClass('active');

		if (navigationId.match(/^sitemap-/)) {
			$('#sitemap-nav-button').removeClass('disabled');
			$('#sitemap-nav-button')
				.closest('li')
				.addClass('active');
			$('#navbar-active-sitemap-id').text('(' + this.state.currentSitemap._id + ')');
		} else {
			$('#sitemap-nav-button').addClass('disabled');
			$('#navbar-active-sitemap-id').text('');
		}

		if (navigationId.match(/^create-sitemap-/)) {
			$('#create-sitemap-nav-button')
				.closest('li')
				.addClass('active');
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
		let validator = this.getFormValidator();

		//validator.validate();
		// validate method calls submit which is not needed in this case.
		for (let field in validator.options.fields) {
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
							message: 'Only lowercase characters (a-z), digits (0-9), or any of the characters _, $, (, ), +, -, and / are allowed. Must begin with a letter.',
						},
						// placeholder for sitemap id existance validation
						callback: {
							message: 'Sitemap with this id already exists',
							callback: function() {
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
							callback: function(value) {
								return Sitemap.validateStartUrls(value.split(','));
							},
						},
					},
				},
				model: {
					validators: {
						callback: {
							callback: function(value) {
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
							}.bind(this),
						},
					},
				},
			},
		});
	}

	showCreateSitemap() {
		this.setActiveNavigationButton('create-sitemap-create');
		let sitemapForm = ich.SitemapCreate();
		$('#viewport').html(sitemapForm);
		this.initSitemapValidation();

		// //XXX quickFix for new sitemap creation bug
		let validator = this.getFormValidator();
		validator.updateStatus('model', 'VALID', 'callback');

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
							message: 'Only lowercase characters (a-z), digits (0-9), or any of the characters _, $, (, ), +, -, and / are allowed. Must begin with a letter.',
						},
						// placeholder for sitemap id existance validation
						callback: {
							message: 'Sitemap with this id already exists',
							callback: function(value, validator) {
								validator.revalidateField('sitemapJSON');
								return true;
							}.bind(this),
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
							callback: function(value, validator) {
								try {
									let sitemap = JSON.parse(value);

									let renameId = $('#viewport form [name="_id"]').val();
									if (!renameId) {
										if (!sitemap.hasOwnProperty('_id')) {
											return {
												valid: false,
												message: 'The sitemap id is required and cannot be empty',
											};
										}
										if (sitemap._id.length < 3) {
											return {
												valid: false,
												message: 'The sitemap id should be at least 3 characters long',
											};
										}
										if (!sitemap._id.match('^[a-z][a-z0-9_\\$\\(\\)\\+\\-/]+$')) {
											return {
												valid: false,
												message:
													'Only lowercase characters (a-z), digits (0-9), or any of the characters _, $, (, ), +, -, and / are allowed. Must begin with a letter.',
											};
										}
									}

									//check for start urls
									if (!sitemap.hasOwnProperty('startUrls')) {
										return {
											valid: false,
											message: 'The start URL is required and cannot be empty',
										};
									}
									if (!Sitemap.validateStartUrls(sitemap.startUrls)) {
										return {
											valid: false,
											message: 'The start URLs are not valid',
										};
									}

									let result = Model.validateModel(sitemap.model);
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
							}.bind(this),
						},
					},
				},
			},
		});
	}

	showImportSitemapPanel() {
		this.setActiveNavigationButton('create-sitemap-import');
		let sitemapForm = ich.SitemapImport();
		$('#viewport').html(sitemapForm);
		this.initImportSitemapValidation();
		return true;
	}

	showSitemapExportPanel() {
		this.setActiveNavigationButton('sitemap-export');
		let sitemap = this.state.currentSitemap;
		let sitemapJSON = sitemap.exportSitemap();
		let sitemapExportForm = ich.SitemapExport({
			sitemapJSON: sitemapJSON,
		});
		$('#viewport').html(sitemapExportForm);
		return true;
	}

	showSitemaps() {
		this.clearState();
		this.setActiveNavigationButton('sitemaps');

		this.store.getAllSitemaps().then(function(sitemaps) {
			var $sitemapListPanel = ich.SitemapList();
			sitemaps.forEach(function(sitemap) {
				var $sitemap = ich.SitemapListItem(sitemap);
				$sitemap.data('sitemap', sitemap);
				$sitemapListPanel.find('tbody').append($sitemap);
			});
			$('#viewport').html($sitemapListPanel);
		});
	}

	getSitemapFromMetadataForm() {
		let id = $('#viewport form input[name=_id]').val();
		let $startUrlInputs = $('#viewport form .input-start-url');
		let startUrls = $startUrlInputs
			.val()
			.split(',')
			.map(item => item.trim());
		let model = $('#viewport .input-model').val();
		if (model) {
			return {
				id: id,
				startUrls: startUrls,
				model: JSON.parse(model),
			};
		} else {
			return {
				id: id,
				startUrls: startUrls,
			};
		}
	}

	createSitemap() {
		// cancel submit if invalid form
		if (!this.isValidForm()) {
			return false;
		}

		let sitemapData = this.getSitemapFromMetadataForm();

		// check whether sitemap with this id already exist
		this.store.sitemapExists(sitemapData.id).then(
			function(sitemapExists) {
				if (sitemapExists) {
					let validator = this.getFormValidator();
					validator.updateStatus('_id', 'INVALID', 'callback');
				} else {
					let sitemap = new Sitemap({
						_id: sitemapData.id,
						startUrls: sitemapData.startUrls,
						model: sitemapData.model,
						selectors: [],
					});
					this.store.createSitemap(sitemap).then(
						function(sitemap) {
							this._editSitemap(sitemap, ['_root']);
						}.bind(this, sitemap)
					);
				}
			}.bind(this)
		);
	}

	importSitemap() {
		// cancel submit if invalid form
		if (!this.isValidForm()) {
			return false;
		}

		// load data from form
		let sitemapJSON = $('[name=sitemapJSON]').val();
		let id = $('input[name=_id]').val();
		let sitemap = new Sitemap();
		sitemap.importSitemap(sitemapJSON);
		if (id.length) {
			sitemap._id = id;
		}
		// check whether sitemap with this id already exist
		this.store.sitemapExists(sitemap._id).then(
			function(sitemapExists) {
				if (sitemapExists) {
					let validator = this.getFormValidator();
					validator.updateStatus('_id', 'INVALID', 'callback');
				} else {
					this.store.createSitemap(sitemap).then(
						function(sitemap) {
							this._editSitemap(sitemap, ['_root']);
						}.bind(this)
					);
				}
			}.bind(this)
		);
	}

	editSitemapMetadata(button) {
		this.setActiveNavigationButton('sitemap-edit-metadata');

		let sitemap = this.state.currentSitemap;
		if (sitemap.model) {
			sitemap.model = JSON.stringify(sitemap.model, null, 4);
		}
		let $sitemapMetadataForm = ich.SitemapEditMetadata(sitemap);
		$('#viewport').html($sitemapMetadataForm);
		this.initSitemapValidation();

		return true;
	}

	editSitemapMetadataSave(button) {
		let sitemap = this.state.currentSitemap;
		let sitemapData = this.getSitemapFromMetadataForm();

		// cancel submit if invalid form
		if (!this.isValidForm()) {
			return false;
		}

		// check whether sitemap with this id already exist
		this.store.sitemapExists(sitemapData.id).then(
			function(sitemapExists) {
				if (sitemap._id !== sitemapData.id && sitemapExists) {
					let validator = this.getFormValidator();
					validator.updateStatus('_id', 'INVALID', 'callback');
					return;
				}

				// change data
				sitemap.startUrls = sitemapData.startUrls;
				sitemap.model = sitemapData.model;

				// just change sitemaps url
				if (sitemapData.id === sitemap._id) {
					this.store.saveSitemap(sitemap).then(
						function(sitemap) {
							this.showSitemapSelectorList();
						}.bind(this)
					);
				}
				// id changed. we need to delete the old one and create a new one
				else {
					let newSitemap = new Sitemap(sitemap);
					let oldSitemap = sitemap;
					newSitemap._id = sitemapData.id;
					if (newSitemap._rev) {
						delete newSitemap._rev;
					}
					this.store.createSitemap(newSitemap).then(
						function(newSitemap) {
							this.store.deleteSitemap(oldSitemap).then(
								function() {
									this.state.currentSitemap = newSitemap;
									this.showSitemapSelectorList();
								}.bind(this)
							);
						}.bind(this)
					);
				}
			}.bind(this)
		);
	}

	/**
	 * Callback when sitemap edit button is clicked in sitemap grid
	 */
	editSitemap(tr) {
		let sitemap = $(tr).data('sitemap');
		this._editSitemap(sitemap);
	}

	_editSitemap(sitemap) {
		this.setStateEditSitemap(sitemap);
		this.setActiveNavigationButton('sitemap');

		this.showSitemapSelectorList();
	}

	showSitemapSelectorList() {
		this.setActiveNavigationButton('sitemap-selector-list');

		let sitemap = this.state.currentSitemap;
		let parentSelectors = this.state.editSitemapBreadcumbsSelectors;
		let parentSelectorId = this.state.currentParentSelectorId;

		let $selectorListPanel = ich.SelectorList({
			parentSelectors: parentSelectors,
		});
		let selectors = sitemap.getDirectChildSelectors(parentSelectorId);
		selectors.forEach(function(selector) {
			let $selector = ich.SelectorListItem(selector);
			$selector.data('selector', selector);
			$selectorListPanel.find('tbody').append($selector);
		});
		$('#viewport').html($selectorListPanel);

		return true;
	}

	showSitemapSelectorGraph() {
		this.setActiveNavigationButton('sitemap-selector-graph');
		let sitemap = this.state.currentSitemap;
		let $selectorGraphPanel = ich.SitemapSelectorGraph();
		$('#viewport').html($selectorGraphPanel);
		let graphDiv = $('#selector-graph')[0];
		let graph = new SelectorGraphv2(sitemap);
		graph.draw(graphDiv, $(document).width(), 200);
		return true;
	}

	showChildSelectors(tr) {
		let selector = $(tr).data('selector');
		let parentSelectors = this.state.editSitemapBreadcumbsSelectors;
		this.state.currentParentSelectorId = selector.id;
		parentSelectors.push(selector);

		this.showSitemapSelectorList();
	}

	treeNavigationshowSitemapSelectorList(button) {
		let parentSelectors = this.state.editSitemapBreadcumbsSelectors;
		let controller = this;
		$('#selector-tree .breadcrumb li a').each(function(i, parentSelectorButton) {
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
							message: 'Sitemap id required and cannot be empty',
						},
						stringLength: {
							min: 3,
							message: 'The sitemap id should be atleast 3 characters long',
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
							message: 'JavaScript does not support regular expressions that can match 0 characters.',
							callback: function(value, validator) {
								// allow no regex
								if (!value) {
									return true;
								}

								try {
									let matches = ''.match(new RegExp(value));
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
							callback: function(value, validator) {
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
							callback: function(value, validator) {
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
							callback: function(value, validator, $field) {
								let sitemap = this.getCurrentlyEditedSelectorSitemap();
								return !sitemap.selectors.hasRecursiveElementSelectors();
							}.bind(this),
						},
					},
				},
			},
		});
	}

	editSelector(button) {
		let selector = $(button)
			.closest('tr')
			.data('selector');
		this._editSelector(selector);
	}

	updateSelectorParentListOnIdChange() {
		let selector = this.getCurrentlyEditedSelector();
		$('.currently-edited')
			.val(selector.id)
			.text(selector.id);
	}

	_editSelector(selector) {
		let sitemap = this.state.currentSitemap;
		let selectorIds = sitemap.getPossibleParentSelectorIds();

		let $editSelectorForm = ich.SelectorEdit({
			selector: selector,
			selectorIds: selectorIds,
			selectorTypes: this.selectorTypes,
		});
		$('#viewport').html($editSelectorForm);

		//TODO move this check to Model class
		let data = [];
		let idInData = false;
		if (sitemap.model) {
			for (let field of sitemap.model) {
				data.push(field);
				if (field.field_name === selector.id) {
					idInData = true;
				}
			}
		}
		if (!idInData && selector.id) {
			data.push({ field: '', entity: '', field_name: selector.id });
		}

		$('#selectorId').flexdatalist({
			init: this.initSelectorValidation(),
			textProperty: '{field_name}',
			valueProperty: 'field_name',
			data: data,
			searchIn: ['entity', 'field'],
			visibleProperties: ['entity', 'field'],
			groupBy: 'entity',
			searchContain: true,
			noResultsText: '',
			minLength: 1,
		});

		// mark initially opened selector as currently edited
		$('#edit-selector #parentSelectors option').each(function(i, element) {
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
			$editSelectorForm.find('[name=clickElementUniquenessType]').val(selector.clickElementUniquenessType);
		}

		// handle selects seperately
		$editSelectorForm.find('[name=type]').val(selector.type);
		selector.parentSelectors.forEach(function(parentSelectorId) {
			$editSelectorForm.find("#parentSelectors [value='" + parentSelectorId + "']").attr('selected', 'selected');
		});

		this.state.currentSelector = selector;
		this.selectorTypeChanged(false);
	}

	selectorTypeChanged(changeTrigger) {
		// let type = $('#edit-selector select[name=type]').val();
		// add this selector to possible parent selector
		let selector = this.getCurrentlyEditedSelector();
		// this.state.currentSelector = selector;
		let features = selector.getFeatures();
		$('#edit-selector .feature').hide();
		features.forEach(function(feature) {
			$('#edit-selector .feature-' + feature).show();
		});

		if (changeTrigger && selector.type === 'SelectorLink') {
			$('#edit-selector [name=extractAttribute]').val('href');
		}

		if (selector.canHaveChildSelectors()) {
			if ($('#edit-selector #parentSelectors .currently-edited').length === 0) {
				let $option = $('<option class="currently-edited"></option>');
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
		let sitemap = this.state.currentSitemap;
		let selector = this.state.currentSelector;
		let newSelector = this.getCurrentlyEditedSelector();

		// cancel submit if invalid form
		if (!this.isValidForm()) {
			return false;
		}

		// cancel possible element selection
		this.contentScript.removeCurrentContentSelector().done(
			function() {
				sitemap.updateSelector(selector, newSelector);
				this.store.saveSitemap(sitemap).then(
					function() {
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
		let id = $('#edit-selector [name=id]').val();
		let selectorsSelector = $('#edit-selector [name=selector]').val();
		let tableDataRowSelector = $('#edit-selector [name=tableDataRowSelector]').val();
		let tableHeaderRowSelector = $('#edit-selector [name=tableHeaderRowSelector]').val();
		let tableAddMissingColumns = $('#edit-selector [name=tableAddMissingColumns]').is(':checked');
		let verticalTable = $('#edit-selector [name=verticalTable]').is(':checked');
		let clickElementSelector = $('#edit-selector [name=clickElementSelector]').val();
		let type = $('#edit-selector [name=type]').val();
		let clickElementUniquenessType = $('#edit-selector [name=clickElementUniquenessType]').val();
		let clickType = $('#edit-selector [name=clickType]').val();
		let paginationLimit = $('#edit-selector [name=paginationLimit]').val();
		let discardInitialElements = $('#edit-selector [name=discardInitialElements]').is(':checked');
		let multiple = $('#edit-selector [name=multiple]').is(':checked');
		let downloadImage = $('#edit-selector [name=downloadImage]').is(':checked');
		let downloadDocument = $('#edit-selector [name=downloadDocument]').is(':checked');
		let clickPopup = $('#edit-selector [name=clickPopup]').is(':checked');
		let delay = $('#edit-selector [name=delay]').val();
		let extractAttribute = $('#edit-selector [name=extractAttribute]').val();
		let extractStyle = $('#edit-selector [name=extractStyle]').val();
		let value = $('#edit-selector [name=value]').val();
		let parentSelectors = $('#edit-selector [name=parentSelectors]').val();
		let columns = [];
		let $columnHeaders = $('#edit-selector .column-header');
		let $columnNames = $('#edit-selector .column-name');
		let $columnExtracts = $('#edit-selector .column-extract');
		let stringReplacement = {
			replaceString: $('#edit-selector [name=replaceString]').val(),
			replacementString: $('#edit-selector [name=replacementString]').val(),
		};
		let textmanipulation = {
			removeHtml: $('#edit-selector [name=removeHtml]').is(':checked'),
			trimText: $('#edit-selector [name=trimText]').is(':checked'),
			replaceText: $('#edit-selector [name=replaceText]').val(),
			replacementText: $('#edit-selector [name=replacementText]').val(),
			textPrefix: $('#edit-selector [name=textPrefix]').val(),
			textSuffix: $('#edit-selector [name=textSuffix]').val(),
			regex: $('#edit-selector [name=regex]').val(),
			regexgroup: $('#edit-selector [name=regexgroup]').val(),
		};

		$columnHeaders.each(function(i) {
			let header = $($columnHeaders[i]).val();
			let name = $($columnNames[i]).val();
			let extract = $($columnExtracts[i]).is(':checked');
			columns.push({
				header: header,
				name: name,
				extract: extract,
			});
		});

		return SelectorList.createSelector({
			id: id,
			selector: selectorsSelector,
			tableHeaderRowSelector: tableHeaderRowSelector,
			tableAddMissingColumns: tableAddMissingColumns,
			verticalTable: verticalTable,
			tableDataRowSelector: tableDataRowSelector,
			clickElementSelector: clickElementSelector,
			clickElementUniquenessType: clickElementUniquenessType,
			clickType: clickType,
			paginationLimit: paginationLimit,
			discardInitialElements: discardInitialElements,
			type: type,
			multiple: multiple,
			downloadImage: downloadImage,
			downloadDocument: downloadDocument,
			clickPopup: clickPopup,
			extractAttribute: extractAttribute,
			extractStyle: extractStyle,
			value: value,
			parentSelectors: parentSelectors,
			columns: columns,
			delay: delay,
			textmanipulation: textmanipulation,
			stringReplacement: stringReplacement,
		});
	}

	/**
	 * @returns {Sitemap|*} Cloned Sitemap with currently edited selector
	 */
	getCurrentlyEditedSelectorSitemap() {
		let sitemap = this.state.currentSitemap.clone();
		let selector = sitemap.getSelectorById(this.state.currentSelector.id);
		let newSelector = this.getCurrentlyEditedSelector();
		sitemap.updateSelector(selector, newSelector);
		return sitemap;
	}

	cancelSelectorEditing(button) {
		// cancel possible element selection
		this.contentScript.removeCurrentContentSelector().done(
			function() {
				this.showSitemapSelectorList();
			}.bind(this)
		);
	}

	addSelector() {
		let parentSelectorId = this.state.currentParentSelectorId;
		let sitemap = this.state.currentSitemap;

		let selector = SelectorList.createSelector({
			parentSelectors: [parentSelectorId],
			type: 'SelectorText',
			multiple: false,
		});

		this._editSelector(selector, sitemap);
	}

	deleteSelector(button) {
		let sitemap = this.state.currentSitemap;
		let selector = $(button)
			.closest('tr')
			.data('selector');
		sitemap.deleteSelector(selector);

		this.store.saveSitemap(sitemap).then(
			function() {
				this.showSitemapSelectorList();
			}.bind(this)
		);
	}

	deleteSitemap(button) {
		let sitemap = $(button)
			.closest('tr')
			.data('sitemap');
		let controller = this;
		this.store.deleteSitemap(sitemap).then(function() {
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
							callback: function(value, validator) {
								return value >= 2000;
							},
						},
					},
				},
				requestIntervalRandomness: {
					validators: {
						notEmpty: {
							message: 'The request interval randomness is required and cannot be empty',
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
							callback: function(value, validator) {
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
		let scrapeConfigPanel = ich.SitemapScrapeConfig();
		$('#viewport').html(scrapeConfigPanel);
		this.initScrapeSitemapConfigValidation();
		return true;
	}

	scrapeSitemap() {
		if (!this.isValidForm()) {
			return false;
		}

		let requestInterval = $('input[name=requestInterval]').val();
		let pageLoadDelay = $('input[name=pageLoadDelay]').val();
		let intervalRandomness = $('input[name=requestIntervalRandomness]').val();

		let sitemap = this.state.currentSitemap;
		let request = {
			scrapeSitemap: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
			requestInterval: requestInterval,
			pageLoadDelay: pageLoadDelay,
			requestIntervalRandomness: intervalRandomness,
		};

		// show sitemap scraping panel
		this.getFormValidator().destroy();
		$('.scraping-in-progress').removeClass('hide');
		$('#submit-scrape-sitemap')
			.closest('.form-group')
			.hide();
		$('#scrape-sitemap-config input').prop('disabled', true);

		browser.runtime.sendMessage(request).then(
			function(selectors) {
				// table selector can dynamically add columns
				// replace current selector (columns) with the dynamicly created once
				sitemap.selectors = new SelectorList(selectors);
				this.browseSitemapData();
			}.bind(this)
		);
		return false;
	}

	sitemapListBrowseSitemapData(button) {
		let sitemap = $(button)
			.closest('tr')
			.data('sitemap');
		this.setStateEditSitemap(sitemap);
		this.browseSitemapData();
	}

	browseSitemapData() {
		this.setActiveNavigationButton('sitemap-browse');
		let sitemap = this.state.currentSitemap;
		this.store.getSitemapData(sitemap).then(
			function(data) {
				let dataColumns = sitemap.getDataColumns();

				let dataPanel = ich.SitemapBrowseData({
					columns: dataColumns,
				});
				$('#viewport').html(dataPanel);

				// display data
				// Doing this the long way so there aren't xss vulnerubilites
				// while working with data or with the selector titles
				let $tbody = $('#sitemap-data tbody');
				data.forEach(function(row) {
					let $tr = $('<tr></tr>');
					dataColumns.forEach(function(column) {
						let $td = $('<td></td>');
						let cellData = row[column];
						if (typeof cellData === 'object') {
							cellData = JSON.stringify(cellData);
						}
						$td.text(cellData);
						$tr.append($td);
					});
					$tbody.append($tr);
				});
			}.bind(this)
		);

		return true;
	}

	showSitemapExportDataCsvPanel() {
		this.setActiveNavigationButton('sitemap-export-data-csv');

		let sitemap = this.state.currentSitemap;
		let exportPanel = ich.SitemapExportDataCSV(sitemap);
		$('#viewport').html(exportPanel);

		$('.result').hide();
		$('.download-button').hide();

		// generate data
		$('#generate-csv').click(
			function() {
				$('.result').show();
				$('.download-button').hide();

				let options = {
					delimiter: $('#delimiter').val(),
					newline: $('#newline').prop('checked'),
					containBom: $('#utf-bom').prop('checked'),
				};

				this.store.getSitemapData(sitemap).then(
					function(data) {
						let blob = sitemap.getDataExportCsvBlob(data, options);
						let button_a = $('.download-button a');
						button_a.attr('href', window.URL.createObjectURL(blob));
						button_a.attr('download', sitemap._id + '.csv');
						$('.download-button').show();
						$('.result').hide();
					}.bind(this)
				);
			}.bind(this)
		);

		return true;
	}

	selectSelector(button) {
		let input = $(button)
			.closest('.form-group')
			.find('input.selector-value');
		let sitemap = this.getCurrentlyEditedSelectorSitemap();
		let selector = this.getCurrentlyEditedSelector();
		let currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
		let parentCSSSelector = sitemap.selectors.getParentCSSSelectorWithinOnePage(currentStateParentSelectorIds);

		let deferredSelector = this.contentScript.selectSelector({
			parentCSSSelector: parentCSSSelector,
			allowedElements: selector.getItemCSSSelector(),
		});

		deferredSelector.done(
			function(result) {
				$(input).val(result.CSSSelector);

				// update validation for selector field
				let validator = this.getFormValidator();
				validator.revalidateField(input);

				// @TODO how could this be encapsulated?
				// update header row, data row selectors after selecting the table. selectors are updated based on tables
				// inner html
				if (selector.type === 'SelectorTable') {
					this.getSelectorHTML().done(
						function(html) {
							let verticalTable = this.getCurrentlyEditedSelector().verticalTable;
							let tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html, verticalTable);
							let tableDataRowSelector = SelectorTable.getTableDataRowSelectorFromTableHTML(html, verticalTable);
							$('input[name=tableHeaderRowSelector]').val(tableHeaderRowSelector);
							$('input[name=tableDataRowSelector]').val(tableDataRowSelector);

							let headerColumns = SelectorTable.getTableHeaderColumnsFromHTML(tableHeaderRowSelector, html, verticalTable);
							this.renderTableHeaderColumns(headerColumns);
						}.bind(this)
					);
				}
			}.bind(this)
		);
	}

	getCurrentStateParentSelectorIds() {
		let parentSelectorIds = this.state.editSitemapBreadcumbsSelectors.map(function(selector) {
			return selector.id;
		});

		return parentSelectorIds;
	}

	refreshTableHeaderRowSelector(button) {
		let input = $(button)
			.closest('.form-group')
			.find('input.selector-value');
		let value = input.val();

		this.getSelectorHTML().done(
			function(html) {
				// let verticalTable = this.getCurrentlyEditedSelector().verticalTable;
				// let tableHeaderRowSelector = SelectorTable.getTableHeaderRowSelectorFromTableHTML(html, verticalTable);
				// let tableDataRowSelector = SelectorTable.getTableDataRowSelectorFromTableHTML(html, verticalTable);
				// $('input[name=tableHeaderRowSelector]').val(tableHeaderRowSelector);
				// $('input[name=tableDataRowSelector]').val(tableDataRowSelector);
				let headerColumns = SelectorTable.getTableHeaderColumnsFromHTML(value, html);
				this.renderTableHeaderColumns(headerColumns);
			}.bind(this)
		);

		let validator = this.getFormValidator();
		validator.revalidateField(input);
	}

	selectTableHeaderRowSelector(button) {
		let input = $(button)
			.closest('.form-group')
			.find('input.selector-value');
		let sitemap = this.getCurrentlyEditedSelectorSitemap();
		let selector = this.getCurrentlyEditedSelector();
		let currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
		let parentCSSSelector = sitemap.selectors.getCSSSelectorWithinOnePage(selector.id, currentStateParentSelectorIds);

		let deferredSelector = this.contentScript.selectSelector({
			parentCSSSelector: parentCSSSelector,
			allowedElements: 'tr',
		});

		deferredSelector.done(
			function(result) {
				let tableHeaderRowSelector = result.CSSSelector;
				$(input).val(tableHeaderRowSelector);

				this.getSelectorHTML().done(
					function(html) {
						let headerColumns = SelectorTable.getTableHeaderColumnsFromHTML(tableHeaderRowSelector, html);
						this.renderTableHeaderColumns(headerColumns);
					}.bind(this)
				);

				// update validation for selector field
				let validator = this.getFormValidator();
				validator.revalidateField(input);
			}.bind(this)
		);
	}

	selectTableDataRowSelector(button) {
		let input = $(button)
			.closest('.form-group')
			.find('input.selector-value');
		let sitemap = this.getCurrentlyEditedSelectorSitemap();
		let selector = this.getCurrentlyEditedSelector();
		let currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
		let parentCSSSelector = sitemap.selectors.getCSSSelectorWithinOnePage(selector.id, currentStateParentSelectorIds);

		let deferredSelector = this.contentScript.selectSelector({
			parentCSSSelector: parentCSSSelector,
			allowedElements: 'tr',
		});

		deferredSelector.done(
			function(result) {
				$(input).val(result.CSSSelector);

				// update validation for selector field
				let validator = this.getFormValidator();
				validator.revalidateField(input);
			}.bind(this)
		);
	}

	/**
	 * update table selector column editing fields
	 */
	renderTableHeaderColumns(headerColumns) {
		// reset previous columns
		let $tbody = $('.feature-columns table tbody');
		$tbody.html('');
		headerColumns.forEach(function(column) {
			let $row = ich.SelectorEditTableColumn(column);
			$tbody.append($row);
		});
	}

	/**
	 * Returns HTML that the current selector would select
	 */
	getSelectorHTML() {
		let sitemap = this.getCurrentlyEditedSelectorSitemap();
		let selector = this.getCurrentlyEditedSelector();
		let currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
		let CSSSelector = sitemap.selectors.getCSSSelectorWithinOnePage(selector.id, currentStateParentSelectorIds);
		let deferredHTML = this.contentScript.getHTML({ CSSSelector: CSSSelector });

		return deferredHTML;
	}

	previewSelector(button) {
		if (!$(button).hasClass('preview')) {
			let sitemap = this.getCurrentlyEditedSelectorSitemap();
			let selector = this.getCurrentlyEditedSelector();
			let currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
			let parentCSSSelector = sitemap.selectors.getParentCSSSelectorWithinOnePage(currentStateParentSelectorIds);
			let deferredSelectorPreview = this.contentScript.previewSelector({
				parentCSSSelector: parentCSSSelector,
				elementCSSSelector: selector.selector,
			});

			deferredSelectorPreview.done(function() {
				$(button).addClass('preview');
			});
		} else {
			this.contentScript.removeCurrentContentSelector();
			$(button).removeClass('preview');
		}
	}

	previewClickElementSelector(button) {
		if (!$(button).hasClass('preview')) {
			let sitemap = this.state.currentSitemap;
			let selector = this.getCurrentlyEditedSelector();
			let currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
			let parentCSSSelector = sitemap.selectors.getParentCSSSelectorWithinOnePage(currentStateParentSelectorIds);

			let deferredSelectorPreview = this.contentScript.previewSelector({
				parentCSSSelector: parentCSSSelector,
				elementCSSSelector: selector.clickElementSelector,
			});

			deferredSelectorPreview.done(function() {
				$(button).addClass('preview');
			});
		} else {
			this.contentScript.removeCurrentContentSelector();
			$(button).removeClass('preview');
		}
	}

	previewTableRowSelector(button) {
		if (!$(button).hasClass('preview')) {
			let sitemap = this.getCurrentlyEditedSelectorSitemap();
			let selector = this.getCurrentlyEditedSelector();
			let currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
			let parentCSSSelector = sitemap.selectors.getCSSSelectorWithinOnePage(selector.id, currentStateParentSelectorIds);
			let rowSelector = $(button)
				.closest('.form-group')
				.find('input')
				.val();

			let deferredSelectorPreview = this.contentScript.previewSelector({
				parentCSSSelector: parentCSSSelector,
				elementCSSSelector: rowSelector,
			});

			deferredSelectorPreview.done(function() {
				$(button).addClass('preview');
			});
		} else {
			this.contentScript.removeCurrentContentSelector();
			$(button).removeClass('preview');
		}
	}

	previewSelectorFromSelectorTree(button) {
		if (!$(button).hasClass('preview')) {
			let sitemap = this.state.currentSitemap;
			let selector = $(button)
				.closest('tr')
				.data('selector');
			let currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
			let parentCSSSelector = sitemap.selectors.getParentCSSSelectorWithinOnePage(currentStateParentSelectorIds);
			let deferredSelectorPreview = this.contentScript.previewSelector({
				parentCSSSelector: parentCSSSelector,
				elementCSSSelector: selector.selector,
			});

			deferredSelectorPreview.done(function() {
				$(button).addClass('preview');
			});
		} else {
			this.contentScript.removeCurrentContentSelector();
			$(button).removeClass('preview');
		}
	}

	previewSelectorDataFromSelectorTree(button) {
		let sitemap = this.state.currentSitemap;
		let selector = $(button)
			.closest('tr')
			.data('selector');
		this.previewSelectorData(sitemap, selector.id);
	}

	previewSelectorDataFromSelectorEditing() {
		let sitemap = this.state.currentSitemap.clone();
		let selector = sitemap.getSelectorById(this.state.currentSelector.id);
		let newSelector = this.getCurrentlyEditedSelector();
		sitemap.updateSelector(selector, newSelector);
		this.previewSelectorData(sitemap, newSelector.id);
	}

	/**
	 * Returns a list of selector ids that the user has opened
	 * @returns {Array}
	 */
	getStateParentSelectorIds() {
		let parentSelectorIds = [];
		this.state.editSitemapBreadcumbsSelectors.forEach(function(selector) {
			parentSelectorIds.push(selector.id);
		});
		return parentSelectorIds;
	}

	previewSelectorData(sitemap, selectorId) {
		// data preview will be base on how the selector tree is opened
		let parentSelectorIds = this.getStateParentSelectorIds();

		let request = {
			previewSelectorData: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
			parentSelectorIds: parentSelectorIds,
			selectorId: selectorId,
		};
		browser.runtime.sendMessage(request).then(function(response) {
			if (response.length === 0) {
				return;
			}
			let dataColumns = Object.keys(response[0]);

			console.log(dataColumns);

			let $dataPreviewPanel = ich.DataPreview({
				columns: dataColumns,
			});
			$('#viewport').append($dataPreviewPanel);
			$dataPreviewPanel.modal('show');
			// display data
			// Doing this the long way so there aren't xss vulnerubilites
			// while working with data or with the selector titles
			let $tbody = $('tbody', $dataPreviewPanel);
			response.forEach(function(row) {
				let $tr = $('<tr></tr>');
				dataColumns.forEach(function(column) {
					let $td = $('<td></td>');
					let cellData = row[column];
					if (typeof cellData === 'object') {
						cellData = JSON.stringify(cellData);
					}
					$td.text(cellData);
					$tr.append($td);
				});
				$tbody.append($tr);
			});

			let windowHeight = $(window).height();

			$('.data-preview-modal .modal-body').height(windowHeight - 130);

			// remove modal from dom after it is closed
			$dataPreviewPanel.on('hidden.bs.modal', function() {
				$(this).remove();
			});
		});
	}
}
