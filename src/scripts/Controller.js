import * as $ from 'jquery';
import * as ich from 'icanhaz/ICanHaz';
import * as browser from 'webextension-polyfill';
import * as renderjson from 'renderjson/renderjson';
import * as Papa from 'papaparse';
import 'sugar';
import 'jquery-highlight/jquery.highlight';
import 'jquery-searcher/dist/jquery.searcher.min';
import 'jquery-flexdatalist/jquery.flexdatalist';
import '../libs/jquery.bootstrapvalidator/bootstrapValidator';
import getContentScript from './ContentScript';
import Sitemap from './Sitemap';
import SelectorGraphv2 from './SelectorGraphv2';
import SelectorList from './SelectorList';
import SelectorTable from './Selector/SelectorTable';
import Model from './Model';
import Translator from './Translator';

export const SITEMAP_ID_REGEXP = /^[a-z][a-z0-9_\$\(\)\+\-]+$/;

export default class SitemapController {
	constructor(store, templateDir) {
		this.store = store;
		this.templateDir = templateDir;
		this.contentScript = getContentScript('DevTools');
		this.selectorTypes = [
			{
				type: 'SelectorText',
			},
			{
				type: 'ConstantValue',
			},
			{
				type: 'SelectorInputValue',
			},
			{
				type: 'SelectorLink',
			},
			{
				type: 'SelectorPopupLink',
			},
			{
				type: 'SelectorImage',
			},
			{
				type: 'SelectorDocument',
			},
			{
				type: 'SelectorTable',
			},
			{
				type: 'SelectorElementAttribute',
			},
			{
				type: 'SelectorElementStyle',
			},
			{
				type: 'SelectorPageURL',
			},
			{
				type: 'SelectorHTML',
			},
			{
				type: 'SelectorElement',
			},
			{
				type: 'SelectorElementScroll',
			},
			{
				type: 'SelectorElementClick',
			},
			{
				type: 'SelectorGroup',
			},
		];
		this.selectorTypes = this.selectorTypes.map(typeObj => {
			return { ...typeObj, title: Translator.getTranslationByKey(typeObj.type) };
		});

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
		// eslint-disable-next-line guard-for-in
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
			'ProjectList',
			'ProjectListItem',
			'SitemapList',
			'SitemapListItem',
			'SitemapCreate',
			'SitemapImport',
			'SitemapExport',
			'SitemapBrowseData',
			'SitemapScrapeConfig',
			'SitemapExportData',
			'SitemapEditMetadata',
			'SelectorList',
			'SelectorListItem',
			'SelectorEdit',
			'SelectorEditTableColumn',
			'SitemapSelectorGraph',
			'DataPreview',
			'ItemCard',
			'ActionConfirm',
			'ErrorDevToolsPage',
			'AuthorizationPage',
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
			'#copyTextButton': {
				click: this.copySitemapToClipboard,
			},
			'#sitemaps-nav-button': {
				click: this.showSitemaps,
			},
			'#projects-nav-button': {
				click: this.showProjects,
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
			'#sitemap-export-data-nav-button': {
				click: this.showSitemapExportDataPanel,
			},
			'.delete_selector_submit': {
				click: this.confirmDeleteSelector,
			},
			'.delete_sitemap_submit': {
				click: this.confirmDeleteSitemap,
			},
			'.copy_sitemap_submit': {
				click: this.confirmCopySitemap,
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
			'form [name=sitemapType]': {
				change: this.sitemapTypeChanged,
			},
			'#edit-sitemap-metadata-form': {
				submit: () => false,
			},
			'#sitemaps tr td:nth-of-type(1)': {
				click: this.editSitemap,
			},
			'#projects tr td': {
				click: this.editProject,
			},
			'#sitemaps button[action=delete-sitemap]': {
				click: this.deleteSitemap,
			},
			'#sitemaps button[action=create-copy-sitemap]': {
				click: this.copySitemap,
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
				'change:flexdatalist': this.updateCurrentlyEditedSelectorInParentsList,
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
			'#edit-selector button[action=preview-click-or-scroll-element-selector]': {
				click: this.previewClickOrScrollElementSelector,
			},
			'#edit-selector button[action=preview-table-row-selector]': {
				click: this.previewTableRowSelector,
			},
			'#edit-selector button[action=preview-selector-data]': {
				click: this.previewSelectorDataFromSelectorEditing,
			},
			'#data-export-form .data-export-control': {
				input: this.sitemapExportDataFormChanged,
			},
			'#data-export-generate-file': {
				click: this.sitemapExportData,
			},
			'#logout-nav-button': {
				click: this.logOutButtonInit,
			},
			'#auth_form': {
				submit: this.authorizationSubmitButtonInit,
			},
		});
		if (this.store.supportAuth) {
			browser.runtime.onMessage.addListener(request => {
				if (request.authError || request.authStatusChanged) {
					$('#confirm-action-modal').remove();
					$('.modal-backdrop').remove();
					return this.showAuthPage();
				}
				return false;
			});
			await this.showAuthPage();
		} else {
			$(`#projects-nav-button`).hide();
			await this.showSitemaps();
		}
	}

	clearState() {
		$('.open').removeClass('open');
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
		this.state.editSitemapBreadcumbsSelectors = [sitemap.rootSelector];
		this.state.currentParentSelectorId = sitemap.rootSelector;
	}

	setActiveNavigationButton(navigationId) {
		$('.nav .active').removeClass('active');
		$(`#${navigationId}-nav-button`).closest('li').addClass('active');

		if (navigationId.match(/^sitemap-/)) {
			const navButton = $('#sitemap-nav-button');
			navButton.removeClass('disabled');
			navButton.closest('li').addClass('active');
			$('#navbar-active-sitemap-id').text(`(${this.state.currentSitemap._id})`);
		} else if (navigationId.match(/^projects/)) {
			$('#sitemaps-nav-button span#navbar-active-project-id').text(``);
			$('#navbar-active-sitemap-id').text('');
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
	getFormValidator(selector = '#viewport form') {
		return $(selector).data('bootstrapValidator');
	}

	/**
	 * Returns whether current form in the viewport is valid
	 * @returns {Boolean}
	 */
	isValidForm(selector = '#viewport form') {
		const validator = this.getFormValidator(selector);
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
							message: Translator.getTranslationByKey('sitemapid_empty_message'),
						},
						stringLength: {
							min: 3,
							message: Translator.getTranslationByKey('sitemapid_short_message'),
						},
						regexp: {
							regexp: SITEMAP_ID_REGEXP,
							message: Translator.getTranslationByKey('sitemapid_invalid_char'),
						},
						// placeholder for sitemap id existance validation
						callback: {
							message: Translator.getTranslationByKey('sitemapid_repeated_id'),
							callback() {
								return true;
							},
						},
					},
				},
				startUrls: {
					validators: {
						notEmpty: {
							message: Translator.getTranslationByKey('sitemapurl_empty_message'),
						},
						callback: {
							message: Translator.getTranslationByKey('sitemapurl_invalid_message'),
							callback(value) {
								return Sitemap.validateStartUrls(value.split(','));
							},
						},
					},
				},
				urlPattern: {
					validators: {
						notEmpty: {
							message: Translator.getTranslationByKey(
								'sitemap_url_pattern_empty_message'
							),
						},
						callback: {
							message: Translator.getTranslationByKey(
								'sitemap_url_pattern_invalid_message'
							),
							callback: Sitemap.validateUrlPattern,
						},
					},
				},
				model: {
					validators: {
						callback: {
							callback(value) {
								if (!value) {
									return {
										message: Translator.getTranslationByKey(
											'sitemapmodel_empty_message'
										),
										valid: true,
									};
								}
								try {
									return Model.validateModel(JSON.parse(value));
								} catch (e) {
									return {
										valid: false,
										message: Translator.getTranslationByKey(
											'sitemapjson_invalid_message'
										),
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
		Translator.translatePage();
		this.sitemapTypeChanged();
		return true;
	}

	sitemapTypeChanged() {
		const $form = $('#viewport form');
		const validator = this.getFormValidator();
		const type = $form.find('[name=sitemapType]').val();
		if (type === 'full') {
			$form.find('.start-url-block').show();
			$form.find('.url-pattern-block').hide();
			validator.resetField('startUrls');
		} else {
			$form.find('.start-url-block').hide();
			$form.find('.url-pattern-block').show();
			validator.resetField('urlPattern');
		}
	}

	initCopySitemapValidation() {
		$('#confirm-action-modal').bootstrapValidator({
			fields: {
				modal_confirm_action_input_copy_sitemap: {
					validators: {
						notEmpty: {
							message: Translator.getTranslationByKey('sitemapid_empty_message'),
						},
						stringLength: {
							min: 3,
							message: Translator.getTranslationByKey('sitemapid_short_message'),
						},
						regexp: {
							regexp: SITEMAP_ID_REGEXP,
							message: Translator.getTranslationByKey('sitemapid_invalid_char'),
						},
						callback: {
							message: Translator.getTranslationByKey('sitemapid_repeated_id'),
							callback(value, validator) {
								return true;
							},
						},
					},
				},
			},
		});
	}

	initImportSitemapValidation() {
		$('#viewport form').bootstrapValidator({
			fields: {
				_id: {
					validators: {
						stringLength: {
							min: 3,
							message: Translator.getTranslationByKey('sitemapid_short_message'),
						},
						regexp: {
							regexp: SITEMAP_ID_REGEXP,
							message: Translator.getTranslationByKey('sitemapid_invalid_char'),
						},
						// placeholder for sitemap id existance validation
						callback: {
							message: Translator.getTranslationByKey('sitemapid_repeated_id'),
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
							message: Translator.getTranslationByKey('sitemapjson_empty_message'),
						},
						callback: {
							message: Translator.getTranslationByKey('sitemapjson_invalid_message'),
							callback(value, validator) {
								try {
									validator.updateStatus('_id', 'NOT_VALIDATED', 'callback');
									const sitemap = JSON.parse(value);

									const renameId = $('#viewport form [name="_id"]').val();
									if (!renameId) {
										if (!sitemap.hasOwnProperty('_id')) {
											return {
												valid: false,
												message:
													Translator.getTranslationByKey(
														'sitemapid_empty_message'
													),
											};
										}
										if (sitemap._id.length < 3) {
											return {
												valid: false,
												message:
													Translator.getTranslationByKey(
														'sitemapid_short_message'
													),
											};
										}
										if (!sitemap._id.match(SITEMAP_ID_REGEXP)) {
											return {
												valid: false,
												message:
													Translator.getTranslationByKey(
														'sitemapid_invalid_char'
													),
											};
										}
									}

									// check for start urls or url pattern
									if (
										Object.hasOwn(sitemap, 'startUrls') &&
										Object.hasOwn(sitemap, 'urlPattern')
									) {
										return {
											valid: false,
											message: Translator.getTranslationByKey(
												'sitemap_either_start_urls_and_pattern'
											),
										};
									}
									if (Object.hasOwn(sitemap, 'startUrls')) {
										if (!Sitemap.validateStartUrls(sitemap.startUrls)) {
											return {
												valid: false,
												message: Translator.getTranslationByKey(
													'sitemapurl_invalid_message'
												),
											};
										}
									} else if (Object.hasOwn(sitemap, 'urlPattern')) {
										if (!Sitemap.validateUrlPattern(sitemap.urlPattern)) {
											return {
												valid: false,
												message: Translator.getTranslationByKey(
													'sitemap_url_pattern_invalid_message'
												),
											};
										}
									} else {
										return {
											valid: false,
											message: Translator.getTranslationByKey(
												'sitemap_either_start_urls_and_pattern'
											),
										};
									}

									const result = Model.validateModel(sitemap.model);
									if (!result.valid) {
										return result;
									}
								} catch (e) {
									return {
										valid: false,
										message: Translator.getTranslationByKey(
											'sitemapjson_invalid_message'
										),
									};
								}
								return {
									message:
										Translator.getTranslationByKey('sitemap_valid_message'),
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
			alert(Translator.getTranslationByKey('selecting_file_error'));
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
		Translator.translatePage();
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
		Translator.translatePage();
		const downloadButton = $('#download-button');
		downloadButton.attr('href', window.URL.createObjectURL(blob));
		downloadButton.attr('download', `${sitemap._id}.json`);

		return true;
	}

	copySitemapToClipboard() {
		const copyText = document.getElementById('sitemap-area');
		const range = document.createRange();
		range.selectNode(copyText);
		window.getSelection().removeAllRanges();
		window.getSelection().addRange(range);
		document.execCommand('copy');
		window.getSelection().removeAllRanges();
	}

	async showAuthPage() {
		$('.nav').hide();
		const isAuthorized = await this.store.isAuthorized();
		if (isAuthorized) {
			$('#user-name').text(isAuthorized.data.name);
			Translator.translatePage();
			await this.showProjects();
		} else {
			this.storeStandName = await this.store.getStandName();
			const $authorizationPage = ich.AuthorizationPage({ standName: this.storeStandName });
			$('#viewport').html($authorizationPage);
			this.authorizationFormInit();
			Translator.translatePage();
		}
	}

	authorizationFormInit() {
		// Sync storage settings
		$('body').on('click', '#password-checkbox', function () {
			if ($(this).is(':checked')) {
				$('#userPassword').attr('type', 'text');
			} else {
				$('#userPassword').attr('type', 'password');
			}
		});
	}

	async authorizationSubmitButtonInit() {
		const credential = {
			username: $('#userLogin').val(),
			password: $('#userPassword').val(),
		};

		const authStatus = await this.store.authorize(credential);

		if (authStatus.authStatus.success) {
			const authData = await this.store.isAuthorized();
			$('#user-name').show().text(authData.data.name);
			$('#logout-nav-button').show();
			await this.showProjects();
		} else if (!authStatus.authStatus.success) {
			$('.alert')
				.attr('id', 'error')
				.text(
					Translator.getTranslationByKey('options_auth_error_updating') +
						authStatus.authStatus.message
				)
				.show();
			Translator.translatePage();
		}
	}

	async logOutButtonInit() {
		await this.store.logOut().finally(async () => await this.showAuthPage());
	}

	async showProjects() {
		this.clearState();
		this.setActiveNavigationButton('projects');

		$(`#sitemaps-nav-button`).prop('disabled', true);
		$('#create-sitemap-nav-button').prop('disabled', true);

		const projects = await this.store.getAllProjects();
		const $projectListPanel = ich.ProjectList();

		$('.nav').show();
		if (this.store.supportAuth) {
			$('#auth_nav').css('display', 'block');
		} else {
			$('#auth_nav').css('display', 'none');
		}
		projects.forEach(project => {
			const $project = ich.ProjectListItem(project);
			$project.data('project', project);
			$projectListPanel.find('tbody').append($project);
		});
		$('#viewport').html($projectListPanel);
		Translator.translatePage();

		this.initSearchbar('td.projTitle');
		document.querySelector('input.searchbar').placeholder =
			Translator.getTranslationByKey('projectName') + '...';
	}

	getCurrentProjectId() {
		return $(`#sitemaps-nav-button`).attr('projectid');
	}

	async showSitemaps(projectId, projectTitle) {
		this.clearState();

		if (typeof projectId === 'string') {
			$('#sitemaps-nav-button span#navbar-active-project-id').text(`(${projectTitle})`);
			$(`#sitemaps-nav-button`).attr('projectid', projectId);
		} else {
			projectId = this.getCurrentProjectId();
		}

		const sitemaps = await this.store.getAllSitemaps(projectId);

		const $sitemapListPanel = ich.SitemapList();

		this.setActiveNavigationButton('sitemaps');
		$(`#sitemaps-nav-button`).prop('disabled', false);

		if (!sitemaps) {
			$('#sitemaps').hide();
			$('#viewport').html(
				'<div class="container"><div data-i18n="get_sitemap_error"></div></div>'
			);
			Translator.translatePage();
		} else {
			$('.nav').show();
			if (this.store.supportAuth) {
				$('#auth_nav').css('display', 'block');
			} else {
				$('#auth_nav').css('display', 'none');
			}
			sitemaps.forEach(sitemap => {
				const $sitemap = ich.SitemapListItem(sitemap);
				$sitemap.data('sitemap', sitemap);
				$sitemapListPanel.find('tbody').append($sitemap);
			});
			$('#create-sitemap-nav-button').prop('disabled', false);
			$('#viewport').html($sitemapListPanel);
			Translator.translatePage();
		}
		this.initSearchbar('td.id');
		document.querySelector('input.searchbar').placeholder = Translator.getTranslationByKey(
			'searchbar_placeholder_message_for_sitemaps'
		);
	}

	initSearchbar(rowSelector) {
		document.querySelector('.searchbar').addEventListener('input', event => {
			let AllRows = [];
			const inputText = event.target.value.toLowerCase();
			AllRows = Array.from(document.querySelectorAll(rowSelector)).map(
				td => td.parentElement
			);
			AllRows.forEach(row => {
				const rowText = row.querySelector(rowSelector).innerText;
				if (rowText.toLowerCase().includes(inputText)) {
					row.style.display = 'table-row';
					let regex = RegExp(inputText, 'gi');
					if (!inputText) {
						regex = /$^/; // will never is valid and returns []
					}
					row.querySelector(rowSelector).innerHTML = rowText.replace(regex, match => {
						return `<mark class="highlight">${match}</mark>`;
					});
				} else {
					row.style.display = 'none';
				}
			});
		});
	}
	getSitemapFromMetadataForm() {
		const metadata = {};
		const $form = $('#viewport form');
		metadata.id = $form.find('input[name=_id]').val();
		const sitemapType = $form.find('[name=sitemapType]').val();
		if (sitemapType === 'full') {
			metadata.startUrls = $form
				.find('.input-start-url')
				.val()
				.split(',')
				.map(item => item.trim());
		} else {
			metadata.urlPattern = $form.find('.input-url-pattern').val();
		}
		const modelStr = $form.find('.input-model').val();
		if (modelStr) {
			metadata.model = JSON.parse(modelStr);
		}
		return metadata;
	}

	async createSitemap() {
		// cancel submit if invalid form

		if (!this.isValidForm()) {
			return false;
		}
		const sitemapData = this.getSitemapFromMetadataForm();
		// check whether sitemap with this id already exist
		const sitemapExists = await this.store.sitemapExists(
			sitemapData.id,
			this.getCurrentProjectId()
		);
		if (sitemapExists) {
			const validator = this.getFormValidator();
			validator.updateStatus('_id', 'INVALID', 'callback');
		} else {
			let sitemap = new Sitemap(
				sitemapData.id,
				sitemapData.startUrls,
				sitemapData.urlPattern,
				sitemapData.model,
				[]
			);
			sitemap = await this.store.createSitemap(sitemap, this.getCurrentProjectId());
			this._editSitemap(sitemap);
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

		const id = $('input[name=_id]').val() || sitemapObj._id;

		// check whether sitemap with this id already exist
		const sitemapExists = await this.store.sitemapExists(id, this.getCurrentProjectId());
		if (sitemapExists) {
			const validator = this.getFormValidator();
			validator.updateStatus('_id', 'INVALID', 'callback');
		} else {
			let sitemap = Sitemap.sitemapFromObj(sitemapObj);
			sitemap._id = id;
			sitemap = await this.store.createSitemap(sitemap, this.getCurrentProjectId());
			this._editSitemap(sitemap);
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
		Translator.translatePage();

		const $sitemapTypeGroup = $('#viewport form .sitemap-type');
		$sitemapTypeGroup.find('[name=sitemapType]').val(sitemap.urlPattern ? 'partial' : 'full');
		this.sitemapTypeChanged();
		if (this.store.storageType === 'StoreTalismanApi') {
			$sitemapTypeGroup.hide();
		}
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
		const sitemapExists = await this.store.sitemapExists(
			sitemapData.id,
			this.getCurrentProjectId()
		);

		if (sitemap._id !== sitemapData.id && sitemapExists) {
			const validator = this.getFormValidator();
			validator.updateStatus('_id', 'INVALID', 'callback');
			return false;
		}

		const previousSitemapId = sitemap._id;
		sitemap._id = sitemapData.id;
		sitemap.startUrls = sitemapData.startUrls;
		sitemap.urlPattern = sitemapData.urlPattern;
		sitemap.model = new Model(sitemapData.model);
		await this.store.saveSitemap(sitemap, previousSitemapId, this.getCurrentProjectId());
		this.showSitemapSelectorList();
	}

	async editProject(td) {
		const project = $(td).parent().data('project');
		return await this.showSitemaps(project.id, project.title);
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
		const parentSelectorId = this.state.currentParentSelectorId.uuid;

		const $selectorListPanel = ich.SelectorList({
			parentSelectors,
		});
		const selectors = sitemap.getDirectChildSelectors(parentSelectorId);
		selectors.forEach(selector => {
			const selectorType = this.selectorTypes.find(selType => selType.type === selector.type);
			const parentUuids = new Set(selector.parentSelectors);
			const parentIds = [sitemap.rootSelector, ...sitemap.selectors]
				.filter(({ uuid }) => parentUuids.has(uuid))
				.map(({ id }) => id);
			const $selector = ich.SelectorListItem({
				...selector,
				parentSelectors: parentIds,
				title: selectorType.title,
			});
			$selector.data('selector', selector);
			$selectorListPanel.find('tbody').append($selector);
		});
		$('#viewport').html($selectorListPanel);
		Translator.translatePage();
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
		this.state.currentParentSelectorId = { uuid: selector.uuid, id: selector.id };
		parentSelectors.push(selector);

		this.showSitemapSelectorList();
	}

	treeNavigationShowSitemapSelectorList(button) {
		const parentSelectors = this.state.editSitemapBreadcumbsSelectors;
		const controller = this;
		$('#selector-tree .breadcrumb li a').each(function (i, parentSelectorButton) {
			if (parentSelectorButton === button) {
				parentSelectors.splice(i + 1);
				controller.state.currentParentSelectorId = parentSelectors[i];
			}
		});
		this.showSitemapSelectorList();
	}

	initSelectorValidation() {
		const selectorsList = this.state.currentSitemap.selectors;
		return $('#viewport form').bootstrapValidator({
			fields: {
				id: {
					validators: {
						notEmpty: {
							message: Translator.getTranslationByKey('selectorid_empty_message'),
						},
						stringLength: {
							min: 3,
							message: Translator.getTranslationByKey('selectorid_short_message'),
						},
						regexp: {
							regexp: /^[^_].*$/,
							message: Translator.getTranslationByKey('selectorid_underscore'),
						},
					},
				},
				selector: {
					validators: {
						notEmpty: {
							message: Translator.getTranslationByKey('selector_empty_message'),
						},
					},
				},
				regex: {
					validators: {
						callback: {
							message: Translator.getTranslationByKey(
								'regex_regular_expressions_error_message'
							),
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
							message: Translator.getTranslationByKey(
								'regex_group_numeric_error_message'
							),
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
							message: Translator.getTranslationByKey('selector_click_empty_message'),
						},
					},
				},
				tableHeaderRowSelector: {
					validators: {
						notEmpty: {
							message: Translator.getTranslationByKey(
								'selector_header_empty_message'
							),
						},
					},
				},
				tableDataRowSelector: {
					validators: {
						notEmpty: {
							message: Translator.getTranslationByKey(
								'selector_data_row_empty_message'
							),
						},
					},
				},
				delay: {
					validators: {
						numeric: {
							message: Translator.getTranslationByKey('delay_numeric_message'),
						},
					},
				},
				paginationLimit: {
					validators: {
						numeric: {
							message: Translator.getTranslationByKey(
								'pagination_limit_numeric_message'
							),
						},
						callback: {
							message: Translator.getTranslationByKey(
								'pagination_limit_small_message'
							),
							callback(value, validator) {
								if (!value) {
									return true;
								}
								return value >= 1;
							},
						},
					},
				},
				mergeIntoList: {
					validators: {
						callback: {
							message: Translator.getTranslationByKey(
								'some_child_can_create_new_jobs_error_message'
							),
							callback: (value, validator) => {
								const sitemap = this.getCurrentlyEditedSelectorSitemap();
								const selector = this.getCurrentlyEditedSelector();
								return (
									!selector.mergeIntoList ||
									!sitemap
										.getAllSelectors(selector.uuid)
										.some(child => child.canCreateNewJobs())
								);
							},
						},
					},
				},
				parentSelectors: {
					validators: {
						notEmpty: {
							message: Translator.getTranslationByKey(
								'parent_selector_empty_message'
							),
						},
						callback: {
							message: 'parent_selector_callback_error',
							callback: function (value, validator) {
								const sitemap = this.getCurrentlyEditedSelectorSitemap();
								const newSelector = this.getCurrentlyEditedSelector();

								if (
									newSelector.parentSelectors.length === 1 &&
									newSelector.parentSelectors[0] === newSelector.uuid
								) {
									return {
										valid: false,
										message: Translator.getTranslationByKey(
											'parent_selector_self_citation'
										),
									};
								}
								if (sitemap.selectors.hasRecursiveElementSelectors()) {
									return {
										valid: false,
										message: Translator.getTranslationByKey(
											'handle_recursive_error_message'
										),
									};
								}
								if (newSelector.canCreateNewJobs()) {
									function someParentElementHasMergeIntoListEnabled(
										parentSelectorIds
									) {
										// this assumes there are no recursive element selectors
										for (const selectorId of parentSelectorIds) {
											if (selectorId === sitemap.rootSelector.uuid) {
												continue;
											}
											const selector = sitemap.getSelectorByUid(selectorId);
											if (selector.willReturnElements()) {
												if (selector.mergeIntoList) {
													return true;
												}
												if (
													someParentElementHasMergeIntoListEnabled(
														selector.parentSelectors
													)
												) {
													return true;
												}
											}
										}
										return false;
									}

									if (
										someParentElementHasMergeIntoListEnabled(
											newSelector.parentSelectors
										)
									) {
										return {
											valid: false,
											message: Translator.getTranslationByKey(
												'some_parent_has_merge_into_list_error_message'
											),
										};
									}
								}

								return true;
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

	updateCurrentlyEditedSelectorInParentsList() {
		const selector = this.getCurrentlyEditedSelector();
		const selectorId =
			selector.id ||
			Translator.getTranslationByKey('selector_edit_current_selector_placeholder');
		$('.currently-edited').val(selector.uuid).text(`${selectorId} - ${selector.uuid}`);
	}

	_editSelector(selector) {
		const sitemap = this.state.currentSitemap;
		const selectorIds = sitemap.getPossibleParentSelectorIds();

		const $editSelectorForm = ich.SelectorEdit({
			selector,
			selectorIds,
			uuid: selector.uuid,
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
			// Disable cache since our data is an array, and we don't make remote requests.
			// Note that when enabled, this might lead to errors creating new selectors when sitemap name
			//  contains 'global' or 'flex0', because Flexdatalist will try to parse localStorage keys set by PouchDB.
			cache: false,
		});

		// mark initially opened selector as currently edited
		$('#edit-selector #parentSelectors option').each((_, element) => {
			if ($(element).val() === selector.uuid) {
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
		Translator.translatePage();
	}

	selectorTypeChanged(changeTrigger) {
		// add this selector to possible parent selector
		const selector = this.getCurrentlyEditedSelector();
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
				$('#edit-selector #parentSelectors').append($option);
				this.updateCurrentlyEditedSelectorInParentsList();
			}
		}
		// remove if type doesn't allow to have child selectors
		else {
			$('#edit-selector #parentSelectors .currently-edited').remove();
		}
	}

	async saveSelector(button) {
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
		try {
			await this.contentScript.removeCurrentContentSelector().promise();
		} catch (err) {
			console.error(err);
		}
		try {
			sitemap.updateSelector(selector, newSelector);
			await this.store.saveSitemap(sitemap, undefined, this.getCurrentProjectId());
		} catch (err) {
			console.error(err);
		} finally {
			this.showSitemapSelectorList();
		}
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
		const scrollElementSelector = $('#edit-selector [name=scrollElementSelector]').val();
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
		const downloadFile = $('#edit-selector [name=downloadFile]').is(':checked');
		const clickPopup = $('#edit-selector [name=clickPopup]').is(':checked');
		const delay = $('#edit-selector [name=delay]').val();
		const outerHTML = $('#edit-selector [id=outerHTML]').is(':checked');
		const mergeIntoList = $('#edit-selector [name=mergeIntoList]').is(':checked');
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
		const uuid = $('#edit-selector [name=uuid]').val();

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

		const options = {
			id,
			selector: selectorsSelector,
			tableHeaderRowSelector,
			tableAddMissingColumns,
			verticalTable,
			tableDataRowSelector,
			scrollElementSelector,
			clickElementSelector,
			clickElementUniquenessType,
			clickType,
			paginationLimit,
			discardInitialElements,
			type,
			multiple,
			downloadFile,
			clickPopup,
			extractAttribute,
			extractStyle,
			value,
			parentSelectors,
			columns,
			delay,
			textmanipulation,
			stringReplacement,
			mergeIntoList,
			outerHTML,
			uuid,
		};

		return SelectorList.createSelector(options);
	}

	/**
	 * @returns {Sitemap|*} Cloned Sitemap with currently edited selector
	 */
	getCurrentlyEditedSelectorSitemap() {
		const sitemap = this.state.currentSitemap.clone();
		const selector = sitemap.getSelectorByUid(this.state.currentSelector.uuid);
		const newSelector = this.getCurrentlyEditedSelector();
		sitemap.updateSelector(selector, newSelector);
		return sitemap;
	}

	async cancelSelectorEditing() {
		// cancel possible element selection
		try {
			await this.contentScript.removeCurrentContentSelector().promise();
		} catch (err) {
			console.error(err);
		} finally {
			this.showSitemapSelectorList();
		}
	}

	addSelector() {
		const parentSelectorId = this.state.currentParentSelectorId.uuid;

		const selector = SelectorList.createSelector({
			parentSelectors: [parentSelectorId],
			type: 'SelectorText',
			multiple: false,
			uuid: String(
				Math.max(0, ...this.state.currentSitemap.selectors.map(({ uuid }) => uuid)) + 1
			),
		});
		this._editSelector(selector);
	}

	initConfirmActionPanel(action) {
		$('#confirm-action-modal').remove(); // remove old panel
		$('#viewport').after(ich.ActionConfirm(action));
		$('#confirm-action-modal').modal('show');
		Translator.translatePage();
	}

	async copySitemap(button) {
		const sitemap = $(button).closest('tr').data('sitemap');
		this.initConfirmActionPanel({ action: 'copy_sitemap' });
		this.initCopySitemapValidation();
		$('#modal-message').show();
		$('#modal-sitemap-id').text(sitemap._id);
		this.state.currentSitemap = sitemap;
		$('#modal_confirm_action_input_copy_sitemap').show();
	}

	async confirmCopySitemap(button) {
		const id = $('#modal_confirm_action_input_copy_sitemap').val();
		let sitemap = this.state.currentSitemap;
		if (!this.isValidForm('#confirm-action-modal')) {
			return false;
		}
		const sitemapExist = await this.store.sitemapExists(id, this.getCurrentProjectId());
		if (sitemapExist) {
			const validator = $('#confirm-action-modal').data('bootstrapValidator');
			validator.updateStatus(
				'modal_confirm_action_input_copy_sitemap',
				'INVALID',
				'callback'
			);
			return false;
		}
		sitemap = new Sitemap(
			id,
			sitemap.startUrls,
			sitemap.urlPattern,
			sitemap.model,
			sitemap.selectors
		);
		sitemap = await this.store.createSitemap(sitemap, this.getCurrentProjectId());
		this._editSitemap(sitemap);
		$('#confirm-action-modal').modal('hide');
	}

	async deleteSelector(button) {
		const selector = $(button).closest('tr').data('selector');
		const sitemap = this.state.currentSitemap;
		const clearSelectorList = sitemap.createRemainingSelectorsList(selector);
		const filteredChildren = sitemap.selectors
			.filter(selector => !clearSelectorList.includes(selector))
			.map(selector => {
				return { uuid: selector.uuid, id: selector.id };
			});
		const childCount = filteredChildren.length;
		this.initConfirmActionPanel({ action: 'delete_selector' });
		$('#modal-selector-id').text(selector.id);
		if (childCount) {
			$('#modal-child-count').text(childCount);
			$('#modal-message').after('<ul id="list-deleted-children"></ul>');
			filteredChildren.forEach(child => {
				const $child = $('<li></li>');
				$child.text(`#${child.uuid} ${child.id}`);
				$('#list-deleted-children').append($child);
			});
			$('#modal-message').show();
		}
		this.state.currentSelector = selector;
		this.state.currentSitemap = sitemap;
	}

	async confirmDeleteSelector(button) {
		const selector = this.state.currentSelector;
		const sitemap = this.state.currentSitemap;
		sitemap.deleteSelector(selector);
		await this.store.saveSitemap(sitemap, undefined, this.getCurrentProjectId());
		this.showSitemapSelectorList();
		$('#confirm-action-modal').modal('hide');
	}

	async deleteSitemap(button) {
		const sitemap = $(button).closest('tr').data('sitemap');
		this.initConfirmActionPanel({ action: 'delete_sitemap' });
		$('#modal-sitemap-id').text(sitemap._id);
		this.state.currentSitemap = sitemap;
	}

	async confirmDeleteSitemap(button) {
		await this.store.deleteSitemap(this.state.currentSitemap, this.getCurrentProjectId());
		await this.showSitemaps();
		$('#confirm-action-modal').modal('hide');
	}

	initScrapeSitemapConfigValidation() {
		const sitemap = this.state.currentSitemap;
		$('#viewport form').bootstrapValidator({
			fields: {
				startUrl: {
					validators: {
						notEmpty: {
							message: Translator.getTranslationByKey(
								'partial_sitemap_scrape_start_url_empty_message'
							),
						},
						regexp: {
							regexp: new RegExp(sitemap.urlPattern),
							message: `${Translator.getTranslationByKey(
								'partial_sitemap_scrape_start_url_mismatch_message'
							)} <i>${sitemap.urlPattern}</i>`,
						},
						callback: {
							callback: value => Sitemap.isUrlValid(value),
							message: Translator.getTranslationByKey(
								'partial_sitemap_scrape_start_url_invalid_message'
							),
						},
					},
				},
				requestInterval: {
					validators: {
						notEmpty: {
							message: Translator.getTranslationByKey(
								'request_interval_empty_message'
							),
						},
						numeric: {
							message: Translator.getTranslationByKey(
								'request_interval_numeric_message'
							),
						},
						callback: {
							message: Translator.getTranslationByKey(
								'request_interval_short_message'
							),
							callback(value, validator) {
								return value >= 2000;
							},
						},
					},
				},
				requestIntervalRandomness: {
					validators: {
						notEmpty: {
							message: Translator.getTranslationByKey(
								'request_interval_randomness_empty_message'
							),
						},
						numeric: {
							message: Translator.getTranslationByKey(
								'request_interval_randomness_numeric_message'
							),
						},
					},
				},
				pageLoadDelay: {
					validators: {
						notEmpty: {
							message: Translator.getTranslationByKey(
								'page_load_delay_empty_message'
							),
						},
						numeric: {
							message: Translator.getTranslationByKey(
								'page_load_delay_numeric_message'
							),
						},
						callback: {
							message: Translator.getTranslationByKey(
								'page_load_delay_short_message'
							),
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
		const sitemap = this.state.currentSitemap;
		browser.tabs.query({ active: true, lastFocusedWindow: true }).then(tabs => {
			const url = tabs.length ? tabs[0].url : undefined;
			const scrapeConfigPanel = ich.SitemapScrapeConfig({ sitemap, url });
			$('#viewport').html(scrapeConfigPanel);
			this.initScrapeSitemapConfigValidation();
			Translator.translatePage();
		});
		return true;
	}

	scrapeSitemap() {
		if (!this.isValidForm()) {
			return false;
		}

		const requestInterval = $('input[name=requestInterval]').val();
		const pageLoadDelay = $('input[name=pageLoadDelay]').val();
		const intervalRandomness = $('input[name=requestIntervalRandomness]').val();
		const startUrl = $('input[name=startUrl]').val();

		const sitemap = this.state.currentSitemap;
		const request = {
			scrapeSitemap: true,
			sitemap: JSON.parse(JSON.stringify(sitemap)),
			startUrl,
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
		const sitemap = this.state.currentSitemap;
		this.store.getSitemapData(sitemap).then(data => {
			const $dataPanel = ich.SitemapBrowseData();
			$('#viewport').html($dataPanel);
			Translator.translatePage();

			// display data
			// Doing this the long way so there aren't xss vulnerubilites
			// while working with data or with the selector titles

			const $accordion = $('#sitemap-data');
			for (let rowNum = 0; rowNum < data.length; rowNum++) {
				const $card = ich.ItemCard({
					id: rowNum,
					url: data[rowNum]._url || `Item${rowNum}`,
				});
				$accordion.append($card);
			}

			for (let rowNum = 0; rowNum < data.length; rowNum++) {
				const row = data[rowNum];
				if (row.hasOwnProperty('_id')) {
					delete row._id;
				}
				if (row.hasOwnProperty('_rev')) {
					delete row._rev;
				}
				$(`#json-${rowNum}`).html(this.jsonRenderer(row));
			}

			$accordion.searcher({
				itemSelector: '.panel', // jQuery selector for the data item element
				textSelector: '.panel-body', // jQuery selector for the element which contains the text
				inputSelector: '#search-input', // jQuery selector for the input element
				toggle: (item, containsText) => {
					$(item).unhighlight();
					$(item).toggle(containsText);
					$(item).highlight($('#search-input').val());
				},
			});

			$('.collapse').collapse('show');
		});

		return true;
	}

	initSitemapExportDataValidation() {
		$('#viewport form').bootstrapValidator({
			fields: {
				delimiter: {
					validators: {
						callback: {
							message: Translator.getTranslationByKey('data_export_empty_delimiter'),
							callback: value => $('#export-format').val() !== 'csv' || !!value,
						},
					},
				},
			},
		});
	}

	showSitemapExportDataPanel() {
		this.setActiveNavigationButton('sitemap-export-data');
		const sitemap = this.state.currentSitemap;
		const exportPanel = ich.SitemapExportData(sitemap);
		$('#viewport').html(exportPanel);
		this.initSitemapExportDataValidation();
		Translator.translatePage();
		return true;
	}

	sitemapExportDataFormChanged(element) {
		if (element.id === 'export-format') {
			if (element.value === 'csv') {
				$('#delimiter-option').show();
			} else {
				$('#delimiter-option').hide();
			}
		}
		$('#wait-message').hide();
		$('#data-export-download-file').hide();
		return true;
	}

	sitemapExportData() {
		if (!this.isValidForm()) {
			return false;
		}

		const downloadButton = $('#data-export-download-file');
		const waitMessage = $('#wait-message');
		downloadButton.hide();

		// displaying alert immediately looks annoying
		const waitMessageTimeout = setTimeout(() => waitMessage.show(), 100);

		const sitemap = this.state.currentSitemap;
		const format = $('#export-format').val();
		const options = {
			delimiter: $('#delimiter').val(),
			newline: $('#newline').prop('checked'),
			containBom: $('#utf-bom').prop('checked'),
		};

		const dataPromise =
			format === 'csv'
				? this.getDataExportCsvBlob(sitemap, options)
				: this.getDataExportJsonLinesBlob(sitemap, options);
		dataPromise.then(blob => {
			clearTimeout(waitMessageTimeout);
			waitMessage.hide();
			downloadButton.attr('href', window.URL.createObjectURL(blob));
			downloadButton.attr('download', `${sitemap._id}.${format}`);
			downloadButton.show();
		});

		return true;
	}

	async getDataExportCsvBlob(sitemap, options) {
		function mergeAttachments(obj, attachmentsSelectors) {
			const { _attachments, ...data } = obj;
			if (!_attachments) {
				return data;
			}
			const attachments = new Map(
				_attachments.map(attachment => {
					const { url, ...rest } = attachment;
					return [url, rest];
				})
			);
			const toAttachment = (selector, url) => {
				if (url && attachments.has(url)) {
					const attachment = { [selector.getUrlColumn()]: url };
					Object.entries(attachments.get(url)).forEach(([key, value]) => {
						attachment[`${selector.id}-${key}`] = value;
					});
					return attachment;
				}
				return url;
			};
			attachmentsSelectors.forEach(selector => {
				const urlKey = selector.getUrlColumn();
				if (urlKey in data) {
					const urlData = data[urlKey];
					if (Array.isArray(urlData)) {
						data[urlKey] = urlData.map(url => toAttachment(selector, url));
					} else {
						data[urlKey] = toAttachment(selector, urlData);
					}
				}
			});
			return data;
		}

		function splitProps(obj) {
			const commonProps = {};
			const listProps = {};
			Object.entries(obj).forEach(([key, value]) => {
				if (Array.isArray(value)) {
					listProps[key] = value;
				} else if (Object.isObject(value)) {
					const [valueCommonProps, valueListProps] = splitProps(value);
					Object.assign(commonProps, valueCommonProps);
					Object.assign(listProps, valueListProps);
				} else {
					commonProps[key] = value;
				}
			});
			return [commonProps, listProps];
		}

		function flatten(obj) {
			const [commonProps, listProps] = splitProps(obj);
			const results = Object.entries(listProps).flatMap(([key, values]) =>
				values.flatMap(value => flatten({ ...commonProps, [key]: value }))
			);
			return results.length ? results : commonProps;
		}

		function addMissingProps(obj, columns) {
			const objCopy = { ...obj };
			columns.forEach(column => {
				if (!(column in obj)) {
					objCopy[column] = '';
				}
			});
			return objCopy;
		}

		// default delimiter is comma
		const delimiter = options.delimiter || ',';
		// per default, utf8 BOM is included at the beginning
		const prepend = 'containBom' in options && !options.containBom ? '' : '\ufeff';
		// per default, new line is included at end of lines
		const append = 'newline' in options && !options.newline ? '' : '\r\n';

		const data = await this.store.getSitemapData(sitemap);
		const attachmentsSelectors = sitemap.selectors.filter(selector =>
			selector.downloadsAttachments()
		);
		const columns = sitemap.getDataColumns();
		const jsonData = data
			.map(dataObj => mergeAttachments(dataObj, attachmentsSelectors))
			.flatMap(flatten)
			.map(dataObj => addMissingProps(dataObj, columns));

		const csvConfig = {
			delimiter,
			quotes: false,
			quoteChar: '"',
			header: true,
			newline: '\r\n', // between value rows
		};
		const csvData = prepend + Papa.unparse(jsonData, csvConfig) + append;
		return new Blob([csvData], { type: 'text/csv' });
	}

	async getDataExportJsonLinesBlob(sitemap, options) {
		// per default, utf8 BOM is NOT included at the beginning
		const prepend = options.containBom ? '\ufeff' : '';
		// per default, new line is included at end of lines
		const append = 'newline' in options && !options.newline ? '' : '\r\n';

		const data = await this.store.getSitemapData(sitemap);
		const jsonlData = prepend + data.map(JSON.stringify).join('\r\n') + append;
		return new Blob([jsonlData], { type: 'application/x-jsonlines' });
	}

	async selectSelector(button) {
		const input = $(button).closest('.form-group').find('input.selector-value');
		const sitemap = this.getCurrentlyEditedSelectorSitemap();
		let selector = this.getCurrentlyEditedSelector();
		const currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
		const parentCSSSelector = sitemap.selectors.getParentCSSSelectorWithinOnePage(
			currentStateParentSelectorIds
		);

		const result = await this.contentScript.selectSelector({
			parentCSSSelector,
			allowedElements: selector.getItemCSSSelector(),
		});

		selector = this.getCurrentlyEditedSelector();
		await selector.afterSelect(result.CSSSelector, this, input.attr('id'));

		// update validation for selector field
		const validator = this.getFormValidator();
		validator.revalidateField(input);
	}

	getCurrentStateParentSelectorIds() {
		return this.state.editSitemapBreadcumbsSelectors.map(selector => selector.uuid);
	}

	async refreshTableColumns() {
		const selector = this.getCurrentlyEditedSelector();

		if (!(selector instanceof SelectorTable)) {
			// wrong selector triggered this event
			return false;
		}

		const html = await this.getSelectorHTML().promise();
		selector.getTableHeaderColumnsFromHTML(html);
		this.renderTableHeaderColumns(selector.headerColumns);
	}

	async selectTableHeaderRowSelector(button) {
		const sitemap = this.getCurrentlyEditedSelectorSitemap();
		const selector = this.getCurrentlyEditedSelector();

		if (!(selector instanceof SelectorTable)) {
			// wrong selector triggered this event
			return false;
		}

		const currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
		const parentCSSSelector = sitemap.selectors.getCSSSelectorWithinOnePage(
			selector.uuid,
			currentStateParentSelectorIds
		);

		const result = await this.contentScript.selectSelector({
			parentCSSSelector,
			allowedElements: 'tr',
		});

		const tableHeaderRowSelector = result.CSSSelector;
		selector.tableHeaderRowSelector = tableHeaderRowSelector;

		const html = await this.getSelectorHTML().promise();
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
			selector.uuid,
			currentStateParentSelectorIds
		);

		const result = await this.contentScript.selectSelector({
			parentCSSSelector,
			allowedElements: 'tr',
		});

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
			selector.uuid,
			currentStateParentSelectorIds
		);
		return this.contentScript.getHTML({ CSSSelector }).promise();
	}

	async previewSelector(button) {
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

			deferredSelectorPreview.then(function () {
				$(button).addClass('preview');
			});
		} else {
			try {
				await this.contentScript.removeCurrentContentSelector().promise();
			} catch (err) {
				console.error(err);
			} finally {
				$(button).removeClass('preview');
			}
		}
	}

	async previewClickOrScrollElementSelector(button) {
		if (!$(button).hasClass('preview')) {
			const sitemap = this.state.currentSitemap;
			const selector = this.getCurrentlyEditedSelector();
			const currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
			const parentCSSSelector = sitemap.selectors.getParentCSSSelectorWithinOnePage(
				currentStateParentSelectorIds
			);
			const inputName = $(button).closest('.input-group').find('input').attr('name');

			const deferredSelectorPreview = this.contentScript.previewSelector({
				parentCSSSelector,
				elementCSSSelector: selector[inputName],
			});

			deferredSelectorPreview.then(function () {
				$(button).addClass('preview');
			});
		} else {
			try {
				await this.contentScript.removeCurrentContentSelector().promise();
			} catch (err) {
				console.error(err);
			} finally {
				$(button).removeClass('preview');
			}
		}
	}

	async previewTableRowSelector(button) {
		if (!$(button).hasClass('preview')) {
			const sitemap = this.getCurrentlyEditedSelectorSitemap();
			const selector = this.getCurrentlyEditedSelector();
			const currentStateParentSelectorIds = this.getCurrentStateParentSelectorIds();
			const parentCSSSelector = sitemap.selectors.getCSSSelectorWithinOnePage(
				selector.uuid,
				currentStateParentSelectorIds
			);
			const rowSelector = $(button).closest('.form-group').find('input').val();

			const deferredSelectorPreview = this.contentScript.previewSelector({
				parentCSSSelector,
				elementCSSSelector: rowSelector,
			});

			deferredSelectorPreview.then(function () {
				$(button).addClass('preview');
			});
		} else {
			try {
				await this.contentScript.removeCurrentContentSelector().promise();
			} catch (err) {
				console.error(err);
			} finally {
				$(button).removeClass('preview');
			}
		}
	}

	async previewSelectorFromSelectorTree(button) {
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

			deferredSelectorPreview.then(function () {
				$(button).addClass('preview');
			});
		} else {
			try {
				await this.contentScript.removeCurrentContentSelector().promise();
			} catch (err) {
				console.error(err);
			} finally {
				$(button).removeClass('preview');
			}
		}
	}

	previewSelectorDataFromSelectorTree(button) {
		const sitemap = this.state.currentSitemap;
		const selector = $(button).closest('tr').data('selector');
		this.previewSelectorData(sitemap, selector.uuid);
	}

	previewSelectorDataFromSelectorEditing() {
		const sitemap = this.state.currentSitemap.clone();
		const selector = sitemap.getSelectorByUid(this.state.currentSelector.uuid);
		const newSelector = this.getCurrentlyEditedSelector();
		sitemap.updateSelector(selector, newSelector);
		this.previewSelectorData(sitemap, newSelector.uuid);
	}

	/**
	 * Returns a list of selector ids that the user has opened
	 * @returns {Array}
	 */

	previewSelectorData(sitemap, selectorId) {
		// data preview will be base on how the selector tree is opened

		const parentSelectorIds = this.state.editSitemapBreadcumbsSelectors.map(sel => sel.uuid);

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

			const $dataPreviewPanel = ich.DataPreview();

			$('#viewport').append($dataPreviewPanel);
			$dataPreviewPanel.modal('show');
			Translator.translatePage();
			// display data
			// Doing this the long way so there aren't xss vulnerubilites
			// while working with data or with the selector titles
			const $accordion = $('#data-preview', $dataPreviewPanel);
			for (let rowNum = 0; rowNum < response.length; rowNum++) {
				const $card = ich.ItemCard({
					id: rowNum,
					url: response[rowNum]._url || `Item${rowNum}`,
				});
				$accordion.append($card);
			}

			const windowHeight = $(window).height();
			for (let rowNum = 0; rowNum < response.length; rowNum++) {
				$(`#json-${rowNum}`).html(this.jsonRenderer(response[rowNum]));
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
