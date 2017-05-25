describe("Group Selector", function () {

	beforeEach(function () {

	});

	it("should extract text data", function () {

		var selector = new Selector({
			id: 'a',
			type: 'SelectorGroup',
			multiple: false,
            selector: "div",
            textmanipulation: {}
		});

		var dataDeferred = selector.getData($("#selector-group-text"));

		waitsFor(function() {
			return dataDeferred.state() === 'resolved';
		}, "wait for data extraction", 5000);

        // extract as JSON.stringify since we allow to use regex to modify the content in the GUI
		runs(function () {
			dataDeferred.done(function(data) {
				expect(data).toEqual([
					{
                        a: '[{"a":"a"},{"a":"b"}]'
					}
				]);
			});
		});
	});

	it("should extract link urls", function () {

		var selector = new Selector({
			id: 'a',
			type: 'SelectorGroup',
			multiple: false,
			selector: "a",
            extractAttribute: 'href',
            textmanipulation: {}
		});

		var dataDeferred = selector.getData($("#selector-group-url"));

		waitsFor(function() {
			return dataDeferred.state() === 'resolved';
		}, "wait for data extraction", 5000);

        // extract as JSON.stringify since we allow to use regex to modify the content in the GUI
		runs(function () {
			dataDeferred.done(function(data) {
				expect(data).toEqual([
					{
                        a: '[{"a":"a","a-href":"http://aa/"},{"a":"b","a-href":"http://bb/"}]'
					}
				]);
			});
		});
	});

	it("should return only one data column", function () {
		var selector = new Selector({
			id: 'id',
			type: 'SelectorGroup',
			multiple: true,
			selector: "div"
		});

		var columns = selector.getDataColumns();
		expect(columns).toEqual(['id']);
	});
});