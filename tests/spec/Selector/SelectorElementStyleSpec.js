describe('Element Style Selector', function () {
	var $el;

	beforeEach(function () {
		this.addMatchers(selectorMatchers);

		$el = jQuery('#tests').html('');
		if ($el.length === 0) {
			$el = $(
				"<div id='tests' style='display:none; background-image: url(\"test\"); width: 20px;'></div>"
			).appendTo('body');
		}
	});

	it('should extract width style', function () {
		var selector = new Selector({
			id: 'pixel',
			type: 'SelectorElementStyle',
			multiple: false,
			extractStyle: 'width',
			selector: 'div.productShotThumbnail',
		});

		var dataDeferred = selector.getData($('#style-extraction-test'));

		waitsFor(
			function () {
				return dataDeferred.state() === 'resolved';
			},
			'wait for data extraction',
			5000
		);

		runs(function () {
			dataDeferred.done(function (data) {
				expect(data).toEqual([
					{
						pixel: '20px',
					},
				]);
			});
		});
	});

	it('should extract multiple widths', function () {
		var selector = new Selector({
			id: 'pixel',
			type: 'SelectorElementStyle',
			multiple: true,
			extractStyle: 'width',
			selector: 'div.productShotThumbnail',
		});

		var dataDeferred = selector.getData($('#style-extraction-test'));

		waitsFor(
			function () {
				return dataDeferred.state() === 'resolved';
			},
			'wait for data extraction',
			5000
		);

		runs(function () {
			dataDeferred.done(function (data) {
				expect(data).toEqual([
					{
						pixel: '20px',
					},
					{
						pixel: '20px',
					},
					{
						pixel: '20px',
					},
				]);
			});
		});
	});

	it('should return only one data column', function () {
		var selector = new Selector({
			id: 'pixel',
			type: 'SelectorElementStyle',
			multiple: true,
			selector: 'div.productShotThumbnail',
		});

		var columns = selector.getDataColumns();
		expect(columns).toEqual(['pixel']);
	});

	it('should return empty array when no width is found', function () {
		var selector = new Selector({
			id: 'pixel',
			type: 'SelectorElementStyle',
			multiple: true,
			selector: 'img.not-exist',
			extractStyle: 'width',
		});

		var dataDeferred = selector.getData($('#not-exist'));

		waitsFor(
			function () {
				return dataDeferred.state() === 'resolved';
			},
			'wait for data extraction',
			5000
		);

		runs(function () {
			dataDeferred.done(function (data) {
				expect(data).toEqual([]);
			});
		});
	});

	it('should be able to extract color green', function () {
		var html = '<ul><li style="color: green;"></li></ul>';
		$el.append(html);

		var selector = new Selector({
			id: 'color',
			type: 'SelectorElementStyle',
			multiple: true,
			selector: 'li',
			extractStyle: 'color',
		});

		var dataDeferred = selector.getData($el);

		expect(dataDeferred).deferredToEqual([
			{
				color: 'rgb(0, 128, 0)',
			},
		]);
	});
});
