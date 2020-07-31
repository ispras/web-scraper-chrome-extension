describe('DateUtils', function () {
	beforeEach(function () {
		this.addMatchers(selectorMatchers);
	});

	it("'SimpleDateFormatter.format' pattern 'yyyy/MM/dd'", function () {
		var pattern = 'yyyy/MM/dd';
		var date = new Date('1979-02-01T00:00:00.000Z');
		var expected = '1979/02/01';
		var df = new SimpleDateFormatter(pattern);
		expect(df.format(date)).toEqual(expected);
	});

	it("'SimpleDateFormatter.format' pattern 'dd/MM/yy'", function () {
		var pattern = 'dd/MM/yy';
		var date = new Date('1979-02-01T00:00:00.000Z');
		var expected = '01/02/79';
		var df = new SimpleDateFormatter(pattern);
		expect(df.format(date)).toEqual(expected);
	});

	it("'SimpleDateFormatter.format' pattern 'dd MMM yy'", function () {
		var pattern = 'dd MMM yy';
		var date = new Date('1979-02-01T00:00:00.000Z');
		var expected = '01 Feb 79';
		var df = new SimpleDateFormatter(pattern);
		expect(df.format(date)).toEqual(expected);
	});

	it("'SimpleDateFormatter.format' pattern 'dd MMM yyyy'", function () {
		var pattern = 'dd MMM yyyy';
		var date = new Date('1979-02-01T00:00:00.000Z');
		var expected = '01 Feb 1979';
		var df = new SimpleDateFormatter(pattern);
		expect(df.format(date)).toEqual(expected);
	});

	it("'SimpleDateFormatter.parse' pattern 'dd.MMM.yy'", function () {
		var pattern = 'dd.MMM.yy',
			date = '15.Aug.16',
			expected = new Date('2016-08-15T00:00:00.000Z'),
			df = new SimpleDateFormatter(pattern),
			parsed = df.parse(date);

		if (parsed.getTime() !== expected.getTime()) {
			console.log(
				'%c Your system triggered a workaround, please visit https://github.com/martinsbalodis/web-scraper-chrome-extension/pull/194 for more information.',
				'background: orange; color: white'
			);
			parsed.setHours(0);
			expected.setHours(0);
		}

		expect(parsed.toUTCString()).toEqual(expected.toUTCString());
	});

	it("'SimpleDateFormatter.parse' pattern 'MM/dd/yyyy'", function () {
		var pattern = 'MM/dd/yyyy';
		var date = '02.29.2016';
		var expected = new Date('2016-02-29T00:00:00.000Z');
		var df = new SimpleDateFormatter(pattern);
		expect(df.parse(date)).toEqual(expected);
	});

	it("'SimpleDateFormatter.parse' pattern 'dd.MM.yyyy'", function () {
		var pattern = 'dd.MM.yyyy',
			date = '16.06.2016',
			expected = new Date('2016-06-16T00:00:00.000Z'),
			df = new SimpleDateFormatter(pattern),
			parsed = df.parse(date);

		if (parsed.getTime() !== expected.getTime()) {
			console.log(
				'%c Your system triggered a workaround, please visit https://github.com/martinsbalodis/web-scraper-chrome-extension/pull/194 for more information.',
				'background: orange; color: white'
			);
			parsed.setHours(0);
			expected.setHours(0);
		}

		expect(parsed.toUTCString()).toEqual(expected.toUTCString());
	});

	it("'DateRoller.days' should return one day", function () {
		var from = new Date('1979-02-01T00:00:00.000Z');
		var to = new Date('1979-02-01T00:00:00.000Z');
		var roller = DateRoller.days(from, to);
		var expectedDays = 1;
		expect(roller.length).toEqual(expectedDays);
	});

	it("'DateRoller.days' should return 366 days", function () {
		var from = new Date('2016-12-31T00:00:00.000Z');
		var to = new Date('2016-01-01T00:00:00.000Z');
		var roller = DateRoller.days(from, to);
		var expectedDays = 366;
		expect(roller.length).toEqual(expectedDays);
	});

	it("'DateRoller.days' should return multiple days increasing", function () {
		var from = new Date('1979-02-01T00:00:00.000Z');
		var to = new Date('1979-02-03T00:00:00.000Z');
		var roller = DateRoller.days(from, to);
		var expectedDays = [
			new Date('1979-02-01T00:00:00.000Z'),
			new Date('1979-02-02T00:00:00.000Z'),
			new Date('1979-02-03T00:00:00.000Z'),
		];
		expect(roller).toEqual(expectedDays);
	});

	it("'DateRoller.days' should return multiple days decreasing", function () {
		var from = new Date('2017-05-02T00:00:00.000Z');
		var to = new Date('2017-04-30T00:00:00.000Z');
		var roller = DateRoller.days(from, to);
		var expectedDays = [
			new Date('2017-05-02T00:00:00.000Z'),
			new Date('2017-05-01T00:00:00.000Z'),
			new Date('2017-04-30T00:00:00.000Z'),
		];
		expect(roller).toEqual(expectedDays);
	});

	it("'DatePatternSupport.expandUrl' should return one url", function () {
		var url = 'http://example.com/[date<dd/MM/yyyy><24/05/2017><24/05/2017>]/index.html';
		var expandedUrls = DatePatternSupport.expandUrl(url);
		var expectedDays = ['http://example.com/24/05/2017/index.html'];
		expect(expandedUrls).toEqual(expectedDays);
	});

	it("'DatePatternSupport.expandUrl' should return three urls from 'yesterday' to 'tomorrow'", function () {
		var url = 'http://example.com/[date<dd/MM/yyyy><tomorrow><yesterday>]/index.html';
		var expandedUrls = DatePatternSupport.expandUrl(url);
		var expectedDays = 3;
		expect(expandedUrls.length).toEqual(expectedDays);
	});
});
