describe('Value Selector', function () {
	var $el;

	beforeEach(function () {});

	it('should place value in input element', function () {
		var selector = new Selector({
			id: 'a',
			type: 'SelectorValue',
			multiple: false,
			selector: '#selector-value-input',
			insertValue: 'test',
		});

		var dataDeferred = selector.getData($('#selector-value'));

		waitsFor(
			function () {
				return dataDeferred.state() === 'resolved';
			},
			'wait for data input',
			5000
		);

		runs(function () {
			dataDeferred.done(function (data) {
				var input = $('#selector-value-input').val();
				expect(data[0].a).toEqual(input);
			});
		});
	});
});
