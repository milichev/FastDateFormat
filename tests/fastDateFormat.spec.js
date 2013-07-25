/// <reference path="../js/jasmine/jasmine.js" />
/// <reference path="../js/libs/fastDateFormat.js" />

describe("Date.format", function() {
	"use strict";

	var d, results;
	var patterns = {
		d: 'M/dd/yyyy',
		D: 'dddd, MMMM d, yyyy',
		t: 'h:mm tt',
		T: 'h:mm:ss tt',
		f: 'dddd, MMMM d, yyyy h:mm tt',
		F: 'dddd, MMMM d, yyyy h:mm:ss tt',
		g: 'M/dd/yyyy h:mm tt',
		G: 'M/dd/yyyy h:mm:ss tt',
		M: 'MMMM d',
		Y: 'MMMM, yyyy',
		O: "yyyy-MM-dd'T'HH:mm:ssK"
	};
	var maskCodes = {
		d: "shortDate",
		D: "longDate",
		t: "shortTime",
		T: "longTime",
		f: "fullDateShortTime",
		F: "fullDateTime",
		g: "shortDateTime",
		G: "shortDateLongTime",
		M: "monthDay",
		Y: "yearMonth",
		O: "isoDateTime"
	};

	beforeEach(function() {
		clearCulture();

		var utc = this.suite.isUtc;

		results = {
			d: '9/24/2012',
			D: 'Monday, September 24, 2012',
			t: '2:48 PM',
			T: '2:48:12 PM',
			f: 'Monday, September 24, 2012 2:48 PM',
			F: 'Monday, September 24, 2012 2:48:12 PM',
			g: '9/24/2012 2:48 PM',
			G: '9/24/2012 2:48:12 PM',
			M: 'September 24',
			Y: 'September, 2012',
			O: '2012-09-24T14:48:12'
		};

		d = new Date(2012, 08, 24, 14, 48, 12);
		if (utc) {
			d = new Date(+d - d.getTimezoneOffset() * 60 * 1000);
			results.O += 'Z';
		} else {
			var off = d.getTimezoneOffset();
			off = Math.floor(Math.abs(off) / 60) * 100 + Math.abs(off) % 60;
			results.O += (off < 0 ? "-" : "+") + (off < 10 ? "000" : off < 100 ? "00" : off < 1000 ? "0" : "") + off;
		}
	});

	function clearCulture() {
		for (var k in Date.format.culture) {
			if (Date.format.culture.hasOwnProperty(k)) {
				delete Date.format.culture[k];
			}
		}
	}

	function desc(utc, title, jit) {
		var suite = describe(title + ", utc=" + utc, function() {
			for (var key in patterns) {
				jit(key);
			}
		});
		suite.isUtc = utc;
	}

	function descFormatByPattern(utc) {
		desc(utc, "when formatting using pattern", function(key) {
			it("should return formatted date for " + patterns[key], function() {
				expect(Date.format(d, patterns[key], utc)).toBe(results[key]);
			});
		});
	}

	function descFormatByKey(utc) {
		desc(utc, "when formatting using mask name", function(key) {
			it("should return formatted date for " + patterns[key], function() {
				expect(Date.format(d, key, utc)).toBe(results[key]);
			});
		});
	}

	function descFormatMeth(utc) {
		desc(utc, "when formatting using pattern-method", function(key) {
			var methodName = maskCodes[key] + (utc ? 'Utc' : '');

			it("should define pattern-method " + methodName + "(date)", function() {
				expect(typeof Date.format[methodName]).toBe('function');
				expect(Date.format[methodName].length).toBe(utc ? 1 : 2);
			});

			it("should return formatted date for pattern-method " + methodName + ", key=" + key, function() {
				expect(Date.format[methodName](d)).toBe(results[key]);
			});
		});
	}

	function descGetFunc(cultureName, utc) {
		desc(utc, "when getting formatter function for culture " + cultureName, function(key) {
			it("should return formatter function for key " + key, function() {
				var func = Date.format.culture(cultureName).fn(key, utc);
				expect(typeof func).toBe('function');
				expect(func(d)).toBe(results[key]);
			});
		});
	}

	descFormatByPattern(false);
	descFormatByPattern(true);
	descFormatByKey(false);
	descFormatByKey(true);
	descFormatMeth(false);
	descFormatMeth(true);
	descGetFunc('en-US', false);
	descGetFunc('en-US', true);

	describe("when rendering literals in the pattern", function() {
		it("should render trailing quoted literal", function() {
			expect(Date.format(d, 'HH" hours"')).toBe('14 hours');
			expect(Date.format(d, "HH' hours'")).toBe('14 hours');
		});

		it("should render leading quoted literal", function() {
			expect(Date.format(d, '"now is "HH:mm')).toBe('now is 14:48');
			expect(Date.format(d, "'now is 'HH:mm")).toBe('now is 14:48');
		});

		it("should render trailing not quoted literal", function() {
			expect(Date.format(d, 'HH...')).toBe('14...');
		});

		it("should render leading not quoted literal", function() {
			expect(Date.format(d, '>HH:mm')).toBe('>14:48');
		});

		it("should render quoted literal with quote char in it", function() {
			expect(Date.format(d, '"it\'s" h "o\'clock"')).toBe("it's 2 o'clock");
			expect(Date.format(d, "h'\"'m")).toBe('2"48');
		});
	});

	it("should throw on invalid date", function() {
		expect(function() {
			Date.format("invalid", 'HH:mm');
		}).toThrow('invalid date');
	});

	// FIXME
	xit("should ensure day name in the Long Date format", function() {
		expect(Date.format.masks.longDate).toBe('dddd, MMMM dd, yyyy');
		clearCulture();

		var info = window.__cultureInfo;
		var bak = info.dateTimeFormat.LongDatePattern;
		info.dateTimeFormat.LongDatePattern = 'dd of MMMM, yyyy';
		Date.format.culture(info.dateTimeFormat, info.name);
		expect(Date.format.masks.longDate).toBe('dddd, dd of MMMM, yyyy');
		info.dateTimeFormat.LongDatePattern = bak;
	});
});