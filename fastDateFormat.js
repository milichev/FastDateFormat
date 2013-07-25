/*
 * fastDateFormat.js
 * 2013, Vadym Milichev, https://github.com/milichev/FastDateFormat
 * Licensed under the MIT license.
 */

(function(global, dateC, theNull, undefined) {
	"use strict";

	var dateProto = dateC.prototype,
	    slice = Array.prototype.slice,
	    token = /d{3,4}|M{3,4}|yy(?:yy)?|([MdHhmsTt])(\1)?|K|zzz|"[^"]*"|'[^']*'/g,
	    // immutable
	    defaultMasks = {
		    "default": "ddd MMM dd yyyy HH:MM:ss",
		    isoDate: "yyyy-MM-dd",
		    isoTime: "HH:mm:ss",
		    isoDateTime: "yyyy-MM-dd'T'HH:mm:ssK",
		    isoShortTime: "HH:mm",
		    longDate: "dddd, MMMM dd, yyyy",
		    shortDate: "M/d/yyyy",
		    mediumDate: "MMM d, yyyy",
		    longTime: "h:mm:ss tt",
		    shortTime: "h:mm tt",
		    monthDay: "MMMM dd",
		    yearMonth: "MMMM, yyyy"
	    },
	    defaultInfo = {
		    name: 'en-US',
		    masks: defaultMasks
	    },
	    defaultArrays = {
		    DayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
		    AbbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
		    MonthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
		    AbbreviatedMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
	    },
	    // names of patterns that consist of two (or more) simple patterns
	    composableMasks = {
		    shortDateTime: ['shortDate', 'shortTime'],
		    shortDateLongTime: ['shortDate', 'longTime'],
		    fullDateTime: ['longDate', 'longTime'],
		    fullDateShortTime: ['longDate', 'shortTime']
	    },
	    // mask names by standard date format strings (http://msdn.microsoft.com/en-us/library/az4se3k1.aspx)
	    maskCodes = {
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
	    },
	    msAjaxPropMap = {
		    "FullDateTimePattern": "fullDateTime",
		    "LongDatePattern": "longDate",
		    "LongTimePattern": "longTime",
		    "MonthDayPattern": "monthDay",
		    "ShortDatePattern": "shortDate",
		    "ShortTimePattern": "shortTime",
		    "YearMonthPattern": "yearMonth"
	    },
	    escchars = /["'\x00-\x1f\x7f-\x9f]/g,
	    expressions = {
		    d: ['d.get', 'Date()'],
		    ddd: ['c.AbbreviatedDayNames[d.get', 'Day()]'],
		    dddd: ['c.DayNames[d.get', 'Day()]'],
		    M: ['(d.get', 'Month()+1)'],
		    MMM: ['c.AbbreviatedMonthNames[d.get', 'Month()]'],
		    MMMM: ['c.MonthNames[d.get', 'Month()]'],
		    yy: ['d.get', 'FullYear().toString().slice(2)'],
		    yyyy: ['d.get', 'FullYear()'],
		    h: ['(d.get', 'Hours()%12||12)'],
		    H: ['d.get', 'Hours()'],
		    m: ['d.get', 'Minutes()'],
		    s: ['d.get', 'Seconds()'],
		    t: ['(d.get', 'Hours()<12?"A":"P")'],
		    tt: ['(d.get', 'Hours()<12?"AM":"PM")'],
		    K: '"Z"',
		    zzz: '(z=d.getTimezoneOffset(),v=Math.abs(z),v=Math.floor(v/60)*100+v%60,' +
			    '(z>0?"-":"+")+(v<10?"000":v<100?"00":v<1000?"0":"")+v)'
	    };

	// pattern flag aliases
	expressions.T = expressions.t;
	expressions.TT = expressions.tt;

	dateFormat.culture = culture;
	dateC.format = dateFormat;
	resetMeths();

	// For convenience...
	dateProto.format = function(mask, utc, formatInfo) {
		return dateFormat(this, mask, utc, formatInfo);
	};

	dateProto.formatUtc = function(mask, formatInfo) {
		return dateFormat(this, mask, true, formatInfo);
	};

	function dateFormat(date, mask, utc, cultureName) {
		/// <summary>Returns the `date` string formatted according to `mask`, `utc` and culture.</summary>
		/// <param name="date" type="Date">Date value to format.</param>
		/// <param name="mask" type="String">Format mask aka pattern OR mask name OR mask code (standard date format name)</param>
		/// <param name="utc" type="Boolean">Specifies if the date should be formatted as a UTC value.</param>
		/// <param name="cultureName">Culture name to format the date according to.</param>
		/// <returns type="String">Formatted date string.</returns>

		if (arguments.length === 3 && typeof utc == "string") {
			cultureName = utc;
			// if `utc` is skipped, it cannot override 'UTC:' mask prefix
			utc = undefined;
		}

		return culture(cultureName).fn(mask, utc)(date);
	}

	function culture(formatInfo, name, isDef) {
		/// <summary>Gets or sets date format info for the specified culture</summary>
		/// <param name="formatInfo">Culture name for the date format info to get,
		///		OR date format info to set.</param>
		/// <param name="name">Culture name for the date format info to set.</param>
		/// <param name="isDef">When setting date format info, specifies if the culture is registered as default one.</param>
		/// <returns type="Object">Date format info</returns>

		// check for default culture
		// when registering explicitely, the MS AJAX ambient CultureInfo, if any, should be processed first as the default one
		var nm = typeof formatInfo;
		if (/* prevent stack overflow */nm != "object" && formatInfo !== theNull && !culture["default"]) {
			// use the current MS AJAX CultureInfo, if any
			culture(global.__cultureInfo || defaultInfo, true);
		}

		if (nm == "string" || formatInfo === undefined || formatInfo === theNull) {
			return formatInfo && culture[formatInfo] || culture["default"];
		}

		if (typeof name === "boolean") {
			isDef = name;
			name = undefined;
		}

		// initialize culture format info
		name || (name = formatInfo.name);
		if (typeof name != "string") {
			throw new Error('No culture name');
		}

		formatInfo.dateTimeFormat && (formatInfo = formatInfo.dateTimeFormat);

		var info = {
			name: name,
			fn: fn,
			masks: {}
		};
		var k, mask;
		var masks = info.masks;

		// fill info arrays (DayNames etc.)
		for (k in defaultArrays) {
			nm = formatInfo[k];
			info[k] = slice.call(nm || defaultArrays[k]);
		}

		// ensure day name in the long date pattern
		if ((mask = formatInfo.LongDatePattern) && !mask.match(/d{3,4}/)) {
			formatInfo.LongDatePattern = 'dddd, ' + mask;
		}

		// first, try to copy from source by MS AJAX CultureInfo naming
		for (k in msAjaxPropMap) {
			mask = formatInfo[k];
			if (mask) {
				masks[msAjaxPropMap[k]] = mask;
			}
		}

		// copy from source by mask names
		for (k in defaultMasks) {
			mask = formatInfo.masks && formatInfo.masks[k] || formatInfo[k];
			if (mask) {
				// get the mask if present in the source
				masks[k] = mask;
			} else if (!(k in masks)) {
				// otherwise, if not Utc mask, compose or copy from the default en-US
				masks[k] = defaultMasks[k];
			}
		}

		// compose complex patterns
		for (k in composableMasks) {
			if (!masks[k]) {
				masks[k] = masks[composableMasks[k][0]] + ' ' + masks[composableMasks[k][1]];
			}
		}

		// ensure Utc masks		
		for (k in masks) {
			k.slice(-3) !== 'Utc' && (masks[k + 'Utc'] = 'UTC:' + masks[k]);
		}

		culture[name] = info;

		// ensure the default culture
		if (isDef) {
			culture["default"] = info;
			dateFormat.masks = masks;
			resetMeths();
		}

		return info;
	}

	function fn(mask, utc) {
		/// <summary>Gets a date formatter function for the culture</summary>
		/// <param name="mask" type="String">Format mask aka pattern OR mask name OR mask code (standard date format name)</param>
		/// <param name="utc" type="Boolean">Specifies if the date should be formatted as a UTC value.</param>
		/// <returns type="Function">Formatter function.</returns>

		var formatInfo = this;
		// resolve mask
		mask = mask in maskCodes ? formatInfo.masks[maskCodes[mask]] : formatInfo.masks[mask] || mask;
		if (typeof mask !== "string") {
			throw new Error("Invalid mask: " + arguments[0]);
		}
		if (mask.slice(0, 4) === 'UTC:') {
			// `utc` parameter overrides the 'UTC:' prefix in the pattern
			typeof utc != "boolean" && (utc = true);
			mask = mask.slice(4);
		}
		var key = (utc ? 'UTC:' : '') + mask;
		return formatInfo.fn[key] || (formatInfo.fn[key] = build(mask, utc, formatInfo));
	}

	function resetMeths() {
		/// <summary>Creates accessor format methods, f.x.: Date.format.shortDate(date, utc). See `maskCodes`</summary>

		var k;
		var names = ['isoDate', 'isoTime', 'isoDateTime', 'isoShortTime'];

		for (k in maskCodes) {
			names.push(maskCodes[k]);
		}

		for (var i = 0, l = names.length; i < l; i++) {
			(function(maskName) {
				var localFormatter, utcFormatter;

				dateFormat[maskName] = function(date, utc) {
					var formatter = utc ? utcFormatter : localFormatter;
					if (!formatter) {
						var info = culture();
						formatter = info.fn(info.masks[maskName], utc);
						utc ? utcFormatter = formatter : localFormatter = formatter;
					}
					return formatter(date);
				};

				dateFormat[maskName + 'Utc'] = function(date) {
					if (!utcFormatter) {
						var info = culture();
						utcFormatter = info.fn(info.masks[maskName], true);
					}
					return utcFormatter(date);
				};
			})(names[i]);
		}
	}

	function build(mask, utc, formatInfo) {
		var body = 'var _=Date,v,z,c=_.format.culture["' + formatInfo.name + '"];' +
			'd=d?(d.constructor===_?d:new _(d)):new _;' +
			'if(isNaN(d))throw Error("invalid date");' +
			'return ""+';

		var last = token.lastIndex = 0;
		var match;

		while (match = token.exec(mask)) {
			var pad = (pad = match[2]) && pad != 't' && pad != 'T';
			var str = pad ? match[1] : match[0];
			match = match[0];
			// append not quoted (hence hot catched) literals, if any
			if (last < token.lastIndex - match.length) {
				body += '"' + esc(mask.slice(last, token.lastIndex - match.length)) + '"+';
			}
			var expInfo = expressions[str];
			if (expInfo) {
				// build date part
				var tp = typeof expInfo;
				var exp;
				body += (tp === "function" ?
					expInfo(utc)
					: tp === "string"
						? str == 'K' && !utc ? expressions.zzz : expInfo
						: (exp = expInfo[0] + (utc ? 'UTC' : '') + expInfo[1], pad ? '(v=' + exp + ',(v<10?"0":"")+v)' : exp)
				) + '+';
			} else {
				// append quoted literal
				match = match.slice(1, match.length - 1);
				body += '"' + esc(match) + '"+';
			}
			last = token.lastIndex;
		}
		// check for trailing not quoted literal
		if (last < mask.length) {
			body += '"' + esc(mask.slice(last)) + '"';
		} else {
			// otherwise trim trailing '+'
			body = body.slice(0, -1);
		}
		body += ';';
		try {
			return new Function('d', body);
		} catch(e) {
			global.console !== undefined && console.log('Cannot create a function, mask=' + mask + ', body=' + body, formatInfo);
			throw e;
		}
	}

	function esc(str) {
		/// <summary>Escapes chars in `str` to use it as js literal in the formatter function.</summary>
		return str.replace(escchars, escrepl);
	}

	function escrepl(c) {
		var code = c.charCodeAt(0);
		return '\\x' + (code < 16 ? '0' : '') + code.toString(16);
	}
})(this || (0, eval)('this'), Date, null);