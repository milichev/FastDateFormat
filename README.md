# FastDateFormat


_[Blazing fast](http://jsperf.com/levithan-vs-milichev-date-format/2) JavaScript Date formatting library supporting multiple cultures._

## Formatting

You can format Date values in two ways:

### 1. Specifying the format

`Date.format()` method accepts the formatting mask either by its one-char name or as mask string:

```javascript
var d = new Date();

// Date value formatting as short time by mask name
Date.format(d, 'shortTime');

// The same using mask code
Date.format(d, 't');

// Full date and time formatting as UTC value
Date.format(d, 'F', true);

// Short date and long time formatting according to Australian culture
Date.format(d, 'G', 'en-AU');

// Custom formatting as UTC value according to Australian culture
Date.format(d, 'dd, h:mm tt', true, 'en-AU');
```

### 2. Reusing formatter methods

The best performance in the iteration aggressive code can be achived by reusing the formatting method:

```javascript
// Short time formatting as UTC value in default culture
Date.format.shortTimeUtc(d);
	
// Long date formatting in Australian culture
Date.format.culture('en-AU').longDate(d);

// Getting the formatting method and calling it later
var fullDateShortTimeUtc = Date.format.culture('en-AU').fn('f', true);

fullDateShortTimeUtc(d);
```

## Multiple Cultures

The library works with various cultures. Moreover, different cultures can be used at once for different places in your page.
It detects presence of ASP.NET AJAX `__cultureInfo` global variable and, if any, accepts culture settings as default.
Also, cultures can be registered with `Date.format.culture()` method as follows:

```javascript
Date.format.culture({
	name: "en-AU",
	DayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
	AbbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
	MonthNames: ["January", "February", "March", "April", "May", "June", "July", "August",
	  "September", "October", "November", "December"],
	AbbreviatedMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",
	  "Oct", "Nov", "Dec"],
	masks: {
		shortDate: "M/d/yyyy",
		mediumDate: "MMM d, yyyy",
		longTime: "h:mm:ss tt",
		// ...
	},
	am: "AM",
	pm: "PM",
	// ...
});
```


## Performance Tests

1. [Levithan vs Milichev date format](http://jsperf.com/levithan-vs-milichev-date-format)
2. [The same + Kendo UI toString()](http://jsperf.com/levithan-vs-milichev-date-format/2)


