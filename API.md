## Modules

<dl>
<dt><a href="#module_series">series</a></dt>
<dd><p>This module provides a list of standardized series for use in analyzing web
experiences.
each series can be registered with a name using <code>DataChunks.addSeries(name, series)</code>.</p>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#DataChunks">DataChunks</a></dt>
<dd></dd>
</dl>

## Constants

<dl>
<dt><a href="#facets">facets</a></dt>
<dd></dd>
<dt><a href="#facetFns">facetFns</a></dt>
<dd><p>A collection of facet factory functions. Each function takes one or more
parameters and returns a facet function according to the parameters.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#seriesValueFn">seriesValueFn(bundle)</a> ⇒ <code>number</code> | <code>undefined</code></dt>
<dd><p>A series value function calculates the series value of a bundle.
If no value is returned, then the bundle will not be considered
for the series.</p>
</dd>
<dt><a href="#eventFilterFn">eventFilterFn(event)</a> ⇒ <code>boolean</code></dt>
<dd></dd>
<dt><a href="#bundleFilter">bundleFilter(bundle)</a> ⇒ <code>boolean</code></dt>
<dd><p>A filter function that will return true for matching
bundles and false for non-matching bundles.</p>
</dd>
<dt><a href="#skipFilterFn">skipFilterFn(attributeName)</a> ⇒ <code>boolean</code></dt>
<dd><p>Function used for skipping certain filtering attributes. The logic of the function
depends on the context, for instance when filtering bundles, this function is chained
as a filter function in order to skip certain attributes.</p>
</dd>
<dt><a href="#existenceFilterFn">existenceFilterFn(attributeName)</a> ⇒ <code>boolean</code></dt>
<dd><p>Function used for whitelist filtering attributes. The logic of the function
depends on the context, for instance when filtering bundles, this function is chained
as a filter function in order to ditch attributes.</p>
</dd>
<dt><a href="#valuesExtractorFn">valuesExtractorFn(attributeName, bundle, parent)</a> ⇒ <code>boolean</code></dt>
<dd><p>Function used for extracting the values for a certain attribute out of a dataset
specific to the context.</p>
</dd>
<dt><a href="#combinerExtractorFn">combinerExtractorFn(attributeName, parent)</a> ⇒ <code>string</code></dt>
<dd><p>Function used for inferring the combiner that&#39;s going to be used when
filtering attributes.</p>
</dd>
<dt><a href="#groupByFn">groupByFn(bundle)</a> ⇒ <code>Array.&lt;string&gt;</code> | <code>string</code> | <code>undefined</code></dt>
<dd><p>A grouping function returns a group name or undefined
for each bundle, according to the group that the bundle
belongs to.</p>
</dd>
<dt><a href="#linearRegression">linearRegression(data)</a> ⇒ <code><a href="#Line">Line</a></code></dt>
<dd><p>Peform a linear ordinary squares regression against an array.
This regression takes the array index as the independent variable
and the data in the array as the dependent variable.</p>
</dd>
<dt><a href="#zTestTwoProportions">zTestTwoProportions(sample1, conversions1, sample2, conversions2)</a> ⇒ <code>number</code></dt>
<dd><p>Performs a Z Test between two proportions. This test assumes that the data
is normally distributed and will calculate the p-value for the difference
between the two proportions.</p>
</dd>
<dt><a href="#erf">erf(x)</a></dt>
<dd><p>The error function, also known as the Gauss error function.</p>
</dd>
<dt><a href="#calcMeanVariance">calcMeanVariance(data)</a> ⇒ <code><a href="#MeanVariance">MeanVariance</a></code></dt>
<dd><p>Calculate mean and variance of a dataset.</p>
</dd>
<dt><a href="#samplingError">samplingError(total, samples)</a></dt>
<dd><p>Determines the sampling error based on a binomial distribution.
Each sample is a Bernoulli trial, where the probability of success is the
proportion of the total population that has the attribute of interest.
The sampling error is calculated as the standard error of the proportion.</p>
</dd>
<dt><a href="#tTest">tTest(left, right)</a> ⇒ <code>number</code></dt>
<dd><p>Performs a significance test on the data. The test assumes
that the data is normally distributed and will calculate
the p-value for the difference between the two data sets.</p>
</dd>
<dt><a href="#toHumanReadable">toHumanReadable(num, precision)</a> ⇒ <code>String</code></dt>
<dd><p>Returns a human readable number</p>
</dd>
<dt><a href="#computeConversionRate">computeConversionRate(conversions, visits)</a> ⇒ <code>number</code></dt>
<dd><p>Conversion rates are computed as the ratio of conversions to visits. The conversion rate is
capped at 100%.</p>
</dd>
<dt><a href="#addCalculatedProps">addCalculatedProps(bundle)</a> ⇒ <code><a href="#Bundle">Bundle</a></code></dt>
<dd><p>Calculates properties on the bundle, so that bundle-level filtering can be performed</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#RawEvent">RawEvent</a> : <code>Object</code></dt>
<dd><p>a raw RUM event</p>
</dd>
<dt><a href="#RawBundle">RawBundle</a> : <code>Object</code></dt>
<dd><p>a raw bundle of events, all belonging to the same page view</p>
</dd>
<dt><a href="#Bundle">Bundle</a> : <code>Object</code></dt>
<dd><p>a processed bundle of events, with extra properties</p>
</dd>
<dt><a href="#RawChunk">RawChunk</a> : <code>Object</code></dt>
<dd><p>a list of raw, unprocessed bundles as delivered by the endpoint</p>
</dd>
<dt><a href="#Aggregate">Aggregate</a> : <code>Object</code></dt>
<dd><p>an object that contains aggregate metrics</p>
</dd>
<dt><a href="#Totals">Totals</a> ⇐ <code>Object&lt;string,</code></dt>
<dd><p>A total is an object that contains {Metric} objects
for each defined series.</p>
</dd>
<dt><a href="#FacetFn">FacetFn</a> ⇒ <code>Array.&lt;string&gt;</code></dt>
<dd><p>A facet function takes a bundle and returns an array of facet values.</p>
</dd>
<dt><a href="#Line">Line</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#MeanVariance">MeanVariance</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="module_series"></a>

## series
This module provides a list of standardized series for use in analyzing web
experiences.
each series can be registered with a name using `DataChunks.addSeries(name, series)`.


* [series](#module_series)
    * [.pageViews](#module_series.pageViews) ⇒ <code>number</code>
    * [.visits](#module_series.visits) ⇒ <code>number</code>
    * [.bounces](#module_series.bounces) ⇒ <code>number</code>
    * [.lcp](#module_series.lcp) ⇒ <code>number</code>
    * [.cls](#module_series.cls) ⇒ <code>number</code>
    * [.inp](#module_series.inp) ⇒ <code>number</code>
    * [.ttfb](#module_series.ttfb)
    * [.engagement](#module_series.engagement) ⇒ <code>number</code>
    * [.earned](#module_series.earned) ⇒ <code>number</code>
    * [.organic](#module_series.organic) ⇒ <code>number</code>

<a name="module_series.pageViews"></a>

### series.pageViews ⇒ <code>number</code>
A page view is an impression of a page. At this moment, pre-rendering is also
considered a page view.

**Kind**: static constant of [<code>series</code>](#module_series)  
**Returns**: <code>number</code> - the number of page views  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | a series of events that belong to the same page view |

<a name="module_series.visits"></a>

### series.visits ⇒ <code>number</code>
A visit is a page view that does not follow an internal link. This means a visit starts
when users follow an external link or enter the URL in the browser.

**Kind**: static constant of [<code>series</code>](#module_series)  
**Returns**: <code>number</code> - the number of visits  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | a series of events that belong to the same page view |

<a name="module_series.bounces"></a>

### series.bounces ⇒ <code>number</code>
A bounce is a visit that does not have any click events.

**Kind**: static constant of [<code>series</code>](#module_series)  
**Returns**: <code>number</code> - the number of bounces  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | a series of events that belong to the same page view |

<a name="module_series.lcp"></a>

### series.lcp ⇒ <code>number</code>
The largest contentful paint is the time it takes for the largest contentful element to load.

**Kind**: static constant of [<code>series</code>](#module_series)  
**Returns**: <code>number</code> - the largest contentful paint  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | a series of events that belong to the same page view |

<a name="module_series.cls"></a>

### series.cls ⇒ <code>number</code>
The cumulative layout shift is the sum of all layout shifts in a page view.

**Kind**: static constant of [<code>series</code>](#module_series)  
**Returns**: <code>number</code> - the cumulative layout shift  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | a series of events that belong to the same page view |

<a name="module_series.inp"></a>

### series.inp ⇒ <code>number</code>
The interaction to next paint is the time it takes for the next paint after an interaction.

**Kind**: static constant of [<code>series</code>](#module_series)  
**Returns**: <code>number</code> - the interaction to next paint  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | a series of events that belong to the same page view |

<a name="module_series.ttfb"></a>

### series.ttfb
The time to first byte is the time it takes for the first byte to arrive.

**Kind**: static constant of [<code>series</code>](#module_series)  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | a series of events that belong to the same page view |

<a name="module_series.engagement"></a>

### series.engagement ⇒ <code>number</code>
A page view is considered engaged if there has been at least some user interaction
or significant content has been viewed, i.e. 4 or more viewmedia or viewblock events.

**Kind**: static constant of [<code>series</code>](#module_series)  
**Returns**: <code>number</code> - the number of engaged page views  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | a series of events that belong to the same page view |

<a name="module_series.earned"></a>

### series.earned ⇒ <code>number</code>
The number of earned visits is the number of visits that are not paid or owned.

**Kind**: static constant of [<code>series</code>](#module_series)  
**Returns**: <code>number</code> - the number of earned conversions  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | a series of events that belong to the same page view |

<a name="module_series.organic"></a>

### series.organic ⇒ <code>number</code>
The number of organic visits is the number of visits that are not paid.

**Kind**: static constant of [<code>series</code>](#module_series)  
**Returns**: <code>number</code> - the number of earned conversions  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | a series of events that belong to the same page view |

<a name="DataChunks"></a>

## DataChunks
**Kind**: global class  

* [DataChunks](#DataChunks)
    * [new DataChunks()](#new_DataChunks_new)
    * [.bundles](#DataChunks+bundles) ⇒ [<code>Array.&lt;Bundle&gt;</code>](#Bundle)
    * [.filter](#DataChunks+filter)
    * [.aggregates](#DataChunks+aggregates) ⇒ <code>Object.&lt;string, Totals&gt;</code>
    * [.totals](#DataChunks+totals) ⇒ [<code>Totals</code>](#Totals)
    * [.facets](#DataChunks+facets) ⇒ <code>Object.&lt;string, Array.&lt;Facet&gt;&gt;</code>
    * [.addSeries(seriesName, seriesValueFn)](#DataChunks+addSeries)
    * [.addInterpolation(seriesName, sourceSeries, interpolationFn)](#DataChunks+addInterpolation)
    * [.addFacet(facetName, facetValueFn, facetCombiner, negativeCombiner)](#DataChunks+addFacet)
    * [.addHistogramFacet(facetName, baseFacet, bucketOptions, formatter)](#DataChunks+addHistogramFacet)
    * [.load(chunks)](#DataChunks+load)
    * [.addData(chunks)](#DataChunks+addData)
    * [.hasConversion(aBundle, filterSpec, combiner)](#DataChunks+hasConversion) ⇒ <code>boolean</code>
    * [.group(groupByFn)](#DataChunks+group) ⇒ <code>Object.&lt;string, Array.&lt;Bundle&gt;&gt;</code>

<a name="new_DataChunks_new"></a>

### new DataChunks()
This class is used to filter, group, and aggregate data from RUM events.

<a name="DataChunks+bundles"></a>

### dataChunks.bundles ⇒ [<code>Array.&lt;Bundle&gt;</code>](#Bundle)
**Kind**: instance property of [<code>DataChunks</code>](#DataChunks)  
**Returns**: [<code>Array.&lt;Bundle&gt;</code>](#Bundle) - all bundles, regardless of the chunk they belong to  
<a name="DataChunks+filter"></a>

### dataChunks.filter
Defines what filter to apply to the data. The filter
is an object that specifies the valid values for each
defined facet.
Filter values are the same values that can get returned
by the `valueFn` that has been added with `addFacet`.

**Kind**: instance property of [<code>DataChunks</code>](#DataChunks)  

| Param | Type | Description |
| --- | --- | --- |
| filterSpec | <code>Object.&lt;string, Array.&lt;string&gt;&gt;</code> | the filter specification |

<a name="DataChunks+aggregates"></a>

### dataChunks.aggregates ⇒ <code>Object.&lt;string, Totals&gt;</code>
Aggregates the grouped data into series data. Each series
has been provided by `addSeries` and will be used to
calculate the value of each bundle in the group. The
aggregated data will be stored in the seriesIn[groupName][seriesName]
object.
Each result will be an object with the following properties:
- count
- sum
- min
- max
- mean
- stddev
- stderr
- median
- percentile(p)

**Kind**: instance property of [<code>DataChunks</code>](#DataChunks)  
**Returns**: <code>Object.&lt;string, Totals&gt;</code> - series data  
<a name="DataChunks+totals"></a>

### dataChunks.totals ⇒ [<code>Totals</code>](#Totals)
Aggregates the filtered data into totals. The totals will
be stored in the totalIn object. The result will be an object
with one key for each series that has been added with `addSeries`.
Each value will be an object with the following properties:
- count
- sum
- min
- max
- mean
- percentile(p)

**Kind**: instance property of [<code>DataChunks</code>](#DataChunks)  
**Returns**: [<code>Totals</code>](#Totals) - total data  
<a name="DataChunks+facets"></a>

### dataChunks.facets ⇒ <code>Object.&lt;string, Array.&lt;Facet&gt;&gt;</code>
Calculates facets for all data. For each function
added through `addFacet`, it will determine the most common
values, their frequency and their weight. The result will
be an object with one key for each facet, containining an array
of facet objects.

**Kind**: instance property of [<code>DataChunks</code>](#DataChunks)  
**Returns**: <code>Object.&lt;string, Array.&lt;Facet&gt;&gt;</code> - facets data  
<a name="DataChunks+addSeries"></a>

### dataChunks.addSeries(seriesName, seriesValueFn)
A series is a named list of values, which are calculated
for each bundle in the data set.

**Kind**: instance method of [<code>DataChunks</code>](#DataChunks)  

| Param | Type | Description |
| --- | --- | --- |
| seriesName | <code>string</code> | name of the series |
| seriesValueFn | [<code>seriesValueFn</code>](#seriesValueFn) | function that returns the series value for each bundle |

<a name="DataChunks+addInterpolation"></a>

### dataChunks.addInterpolation(seriesName, sourceSeries, interpolationFn)
An interpolation is a series that is calulated based on the aggrega
values of other series. The interpolation function will receive the
list of source series and an interpolation function that will return
the interpolated value.
The interpolation function will have as many arguments as there are
source series.

**Kind**: instance method of [<code>DataChunks</code>](#DataChunks)  

| Param | Type | Description |
| --- | --- | --- |
| seriesName | <code>string</code> | name of the (interpolated) series |
| sourceSeries | <code>Array.&lt;string&gt;</code> | list of source series to interpolate from |
| interpolationFn | <code>function</code> |  |

<a name="DataChunks+addFacet"></a>

### dataChunks.addFacet(facetName, facetValueFn, facetCombiner, negativeCombiner)
A facet function works on the entire data set.

**Kind**: instance method of [<code>DataChunks</code>](#DataChunks)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| facetName | <code>string</code> |  | name of the facet |
| facetValueFn | [<code>groupByFn</code>](#groupByFn) |  | function that returns the facet value – can return multiple values |
| facetCombiner | <code>string</code> | <code>&quot;some&quot;</code> | how to combine multiple values, default is 'some', can be 'every' |
| negativeCombiner | <code>string</code> |  | how to combine multiple values for the negative facet, possible values are 'none' and 'never'. Only when this parameter is set, a negative facet will be created. |

<a name="DataChunks+addHistogramFacet"></a>

### dataChunks.addHistogramFacet(facetName, baseFacet, bucketOptions, formatter)
Adds a histogram facet, derived from an existing facet. This facet
will group the data into buckets, based on the values of the base
facet.
You can specify the bucket size, limits and the type of bucketing.

**Kind**: instance method of [<code>DataChunks</code>](#DataChunks)  

| Param | Type | Description |
| --- | --- | --- |
| facetName | <code>string</code> | name of your new facet |
| baseFacet | <code>string</code> | name of the base facet, from which to derive the histogram |
| bucketOptions | <code>object</code> |  |
| bucketOptions.count | <code>number</code> | number of buckets |
| bucketOptions.min | <code>number</code> | minimum value of the histogram |
| bucketOptions.max | <code>number</code> | maximum value of the histogram |
| bucketOptions.steps | <code>&#x27;linear&#x27;</code> \| <code>&#x27;logarithmic&#x27;</code> \| <code>&#x27;quantiles&#x27;</code> | type of bucketing, can be 'linear' (each bucket has the same value range), 'logarithmic' (same value range on logarithmic scale), or 'quantiles' (buckets are roughly equal in size based on the current facet values, but the bucket min/max values are less predictable) |
| formatter | <code>function</code> | a number formatter |

<a name="DataChunks+load"></a>

### dataChunks.load(chunks)
Load raw chunks. This will replace data that has been loaded before

**Kind**: instance method of [<code>DataChunks</code>](#DataChunks)  

| Param | Type | Description |
| --- | --- | --- |
| chunks | [<code>Array.&lt;RawChunk&gt;</code>](#RawChunk) | the raw data to load, an array of chunks |

<a name="DataChunks+addData"></a>

### dataChunks.addData(chunks)
Load more data. This will amend the data that has been loaded before

**Kind**: instance method of [<code>DataChunks</code>](#DataChunks)  

| Param | Type | Description |
| --- | --- | --- |
| chunks | [<code>RawChunk</code>](#RawChunk) | the raw data to load, an array of chunks |

<a name="DataChunks+hasConversion"></a>

### dataChunks.hasConversion(aBundle, filterSpec, combiner) ⇒ <code>boolean</code>
Checks if a conversion has happened in the bundle. A conversion means a business metric
that has been achieved, for instance a click on a certain link.

**Kind**: instance method of [<code>DataChunks</code>](#DataChunks)  
**Returns**: <code>boolean</code> - the result of the check.  

| Param | Type | Description |
| --- | --- | --- |
| aBundle | [<code>Bundle</code>](#Bundle) | the bundle to check. |
| filterSpec | <code>Object.&lt;string, Array.&lt;string&gt;&gt;</code> | uses the same format as the filter specification. For instance { checkpoint: ['click'] } means that inside a bundle an event that has the checkpoint attribute set to 'click' must exist. |
| combiner | <code>string</code> | used to determine if all or some filters must match. By default, 'every' is used. |

<a name="DataChunks+group"></a>

### dataChunks.group(groupByFn) ⇒ <code>Object.&lt;string, Array.&lt;Bundle&gt;&gt;</code>
Groups the filteredIn data by the groupFn. The groupFn
should return a string that will be used as the key for
the group. If the groupFn returns a falsy value, the
bundle will be skipped.

**Kind**: instance method of [<code>DataChunks</code>](#DataChunks)  
**Returns**: <code>Object.&lt;string, Array.&lt;Bundle&gt;&gt;</code> - grouped data, each key is a group
and each vaule is an array of bundles  

| Param | Type | Description |
| --- | --- | --- |
| groupByFn | [<code>groupByFn</code>](#groupByFn) | for each object, determine the group key |

<a name="facets"></a>

## facets
**Kind**: global constant  
**Import**: [<code>Bundle</code>](#Bundle) from './distiller.js'  

* [facets](#facets)
    * [.userAgent(bundle)](#facets.userAgent) ⇒ <code>Array.&lt;string&gt;</code>
    * [.url(bundle)](#facets.url) ⇒ <code>string</code>
    * [.checkpoint(bundle)](#facets.checkpoint) ⇒ <code>Array.&lt;string&gt;</code>
    * [.vitals(bundle)](#facets.vitals) ⇒ <code>Array.&lt;string&gt;</code>
    * [.lcpTarget(bundle)](#facets.lcpTarget) ⇒ <code>Array.&lt;string&gt;</code>
    * [.lcpSource(bundle)](#facets.lcpSource) ⇒ <code>Array.&lt;string&gt;</code>
    * [.acquisitionSource(bundle)](#facets.acquisitionSource) ⇒ <code>Array.&lt;string&gt;</code>
    * [.enterSource(bundle)](#facets.enterSource) ⇒ <code>Array.&lt;string&gt;</code>
    * [.mediaTarget(bundle)](#facets.mediaTarget) ⇒ <code>Array.&lt;string&gt;</code>

<a name="facets.userAgent"></a>

### facets.userAgent(bundle) ⇒ <code>Array.&lt;string&gt;</code>
Extracts each of device type and operating system from
the simplified user agent string.

**Kind**: static method of [<code>facets</code>](#facets)  
**Returns**: <code>Array.&lt;string&gt;</code> - a list of device types and operating systems  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | the bundle of sampled rum events |

<a name="facets.url"></a>

### facets.url(bundle) ⇒ <code>string</code>
Extracts the path from the URL and removes potential PII such as
ids, hashes, and other encoded data.

**Kind**: static method of [<code>facets</code>](#facets)  
**Returns**: <code>string</code> - the path of the URL  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | the bundle of sampled rum events |

<a name="facets.checkpoint"></a>

### facets.checkpoint(bundle) ⇒ <code>Array.&lt;string&gt;</code>
Extracts the checkpoints from the bundle. Each checkpoint
that occurs at least once in the bundle is returned as a facet
value.

**Kind**: static method of [<code>facets</code>](#facets)  
**Returns**: <code>Array.&lt;string&gt;</code> - a list of checkpoints  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | the bundle of sampled rum events |

<a name="facets.vitals"></a>

### facets.vitals(bundle) ⇒ <code>Array.&lt;string&gt;</code>
Classifies the bundle according to the Core Web Vitals metrics.
For each metric in `LCP`, `CLS`, and `INP`, the score is calculated
as `good`, `needs improvement`, or `poor`.
The result is a list of the form `[goodLCP, niCLS, poorINP]`

**Kind**: static method of [<code>facets</code>](#facets)  
**Returns**: <code>Array.&lt;string&gt;</code> - a list of CWV metrics  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | the bundle of sampled rum events |

<a name="facets.lcpTarget"></a>

### facets.lcpTarget(bundle) ⇒ <code>Array.&lt;string&gt;</code>
Extracts the target of the Largest Contentful Paint (LCP) event from the bundle.

**Kind**: static method of [<code>facets</code>](#facets)  
**Returns**: <code>Array.&lt;string&gt;</code> - a list of LCP targets  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | the bundle of sampled rum events |

<a name="facets.lcpSource"></a>

### facets.lcpSource(bundle) ⇒ <code>Array.&lt;string&gt;</code>
Extracts the source of the Largest Contentful Paint (LCP) event from the bundle.

**Kind**: static method of [<code>facets</code>](#facets)  
**Returns**: <code>Array.&lt;string&gt;</code> - a list of LCP sources  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | the bundle of sampled rum events |

<a name="facets.acquisitionSource"></a>

### facets.acquisitionSource(bundle) ⇒ <code>Array.&lt;string&gt;</code>
Extracts the acquisition source from the bundle. As acquisition sources
can be strings like `paid:video:youtube`, each of `paid`, `paid:video`,
and `paid:video:youtube` are returned as separate values.

**Kind**: static method of [<code>facets</code>](#facets)  
**Returns**: <code>Array.&lt;string&gt;</code> - a list of acquisition sources  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | the bundle of sampled rum events |

<a name="facets.enterSource"></a>

### facets.enterSource(bundle) ⇒ <code>Array.&lt;string&gt;</code>
Classifies the referrer page of the enter event.

**Kind**: static method of [<code>facets</code>](#facets)  
**Returns**: <code>Array.&lt;string&gt;</code> - a list of referrer classifications, following the pattern:
- the original source URL
- the type and vendor of the referrer, e.g. `search:google`
- the type of the referrer, e.g. `search`
- the vendor of the referrer, regardless of type, e.g. `*:google`  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | the bundle of sampled rum events |

<a name="facets.mediaTarget"></a>

### facets.mediaTarget(bundle) ⇒ <code>Array.&lt;string&gt;</code>
Extracts the target of the media view event from the bundle. This
is typically the URL of an image or video, and the URL is stripped
of query parameters, hash, user, and password.

**Kind**: static method of [<code>facets</code>](#facets)  
**Returns**: <code>Array.&lt;string&gt;</code> - a list of media targets  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | the bundle of sampled rum events |

<a name="facetFns"></a>

## facetFns
A collection of facet factory functions. Each function takes one or more
parameters and returns a facet function according to the parameters.

**Kind**: global constant  

* [facetFns](#facetFns)
    * [.checkpointSource(cp)](#facetFns.checkpointSource) ⇒ [<code>FacetFn</code>](#FacetFn)
    * [.checkpointTarget(cp)](#facetFns.checkpointTarget) ⇒ [<code>FacetFn</code>](#FacetFn)

<a name="facetFns.checkpointSource"></a>

### facetFns.checkpointSource(cp) ⇒ [<code>FacetFn</code>](#FacetFn)
Returns a function that creates a facet function for the source of the given
checkpoint.

**Kind**: static method of [<code>facetFns</code>](#facetFns)  
**Returns**: [<code>FacetFn</code>](#FacetFn) - - a facet function  

| Param | Type | Description |
| --- | --- | --- |
| cp | <code>string</code> | the checkpoint |

<a name="facetFns.checkpointTarget"></a>

### facetFns.checkpointTarget(cp) ⇒ [<code>FacetFn</code>](#FacetFn)
Returns a function that creates a facet function for the target of the given
checkpoint.

**Kind**: static method of [<code>facetFns</code>](#facetFns)  
**Returns**: [<code>FacetFn</code>](#FacetFn) - a facet function  

| Param | Type | Description |
| --- | --- | --- |
| cp | <code>string</code> | the checkpoint |

<a name="seriesValueFn"></a>

## seriesValueFn(bundle) ⇒ <code>number</code> \| <code>undefined</code>
A series value function calculates the series value of a bundle.
If no value is returned, then the bundle will not be considered
for the series.

**Kind**: global function  
**Returns**: <code>number</code> \| <code>undefined</code> - the series value or undefined  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | the bundle to calculate the series value for |

<a name="eventFilterFn"></a>

## eventFilterFn(event) ⇒ <code>boolean</code>
**Kind**: global function  
**Returns**: <code>boolean</code> - true if the event should be included  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | the event to check |

<a name="bundleFilter"></a>

## bundleFilter(bundle) ⇒ <code>boolean</code>
A filter function that will return true for matching
bundles and false for non-matching bundles.

**Kind**: global function  
**Returns**: <code>boolean</code> - true if the bundle matches the filter  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | the bundle to check |

<a name="skipFilterFn"></a>

## skipFilterFn(attributeName) ⇒ <code>boolean</code>
Function used for skipping certain filtering attributes. The logic of the function
depends on the context, for instance when filtering bundles, this function is chained
as a filter function in order to skip certain attributes.

**Kind**: global function  
**Returns**: <code>boolean</code> - true if the attribute should be included or not.  

| Param | Type | Description |
| --- | --- | --- |
| attributeName | <code>string</code> | the name of the attribute to skip. |

<a name="existenceFilterFn"></a>

## existenceFilterFn(attributeName) ⇒ <code>boolean</code>
Function used for whitelist filtering attributes. The logic of the function
depends on the context, for instance when filtering bundles, this function is chained
as a filter function in order to ditch attributes.

**Kind**: global function  
**Returns**: <code>boolean</code> - true if the attribute should be included or not.  

| Param | Type | Description |
| --- | --- | --- |
| attributeName | <code>string</code> | the name of the whitelisted attribute. |

<a name="valuesExtractorFn"></a>

## valuesExtractorFn(attributeName, bundle, parent) ⇒ <code>boolean</code>
Function used for extracting the values for a certain attribute out of a dataset
specific to the context.

**Kind**: global function  
**Returns**: <code>boolean</code> - true if the attribute should be included or not.  

| Param | Type | Description |
| --- | --- | --- |
| attributeName | <code>string</code> | the name of the attribute to extract. |
| bundle | [<code>Bundle</code>](#Bundle) | the dataset to extract the attribute from. |
| parent | [<code>DataChunks</code>](#DataChunks) | the parent object that contains the bundles. |

<a name="combinerExtractorFn"></a>

## combinerExtractorFn(attributeName, parent) ⇒ <code>string</code>
Function used for inferring the combiner that's going to be used when
filtering attributes.

**Kind**: global function  
**Returns**: <code>string</code> - 'some' or 'every'.  

| Param | Type | Description |
| --- | --- | --- |
| attributeName | <code>string</code> | the name of the attribute to extract. |
| parent | [<code>DataChunks</code>](#DataChunks) | the parent object that contains the bundles. |

<a name="groupByFn"></a>

## groupByFn(bundle) ⇒ <code>Array.&lt;string&gt;</code> \| <code>string</code> \| <code>undefined</code>
A grouping function returns a group name or undefined
for each bundle, according to the group that the bundle
belongs to.

**Kind**: global function  
**Returns**: <code>Array.&lt;string&gt;</code> \| <code>string</code> \| <code>undefined</code> - the group name(s) or undefined  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | the bundle to check |

<a name="linearRegression"></a>

## linearRegression(data) ⇒ [<code>Line</code>](#Line)
Peform a linear ordinary squares regression against an array.
This regression takes the array index as the independent variable
and the data in the array as the dependent variable.

**Kind**: global function  
**Returns**: [<code>Line</code>](#Line) - the slope and intercept of the regression function  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array.&lt;number&gt;</code> | an array of input data |

<a name="zTestTwoProportions"></a>

## zTestTwoProportions(sample1, conversions1, sample2, conversions2) ⇒ <code>number</code>
Performs a Z Test between two proportions. This test assumes that the data
is normally distributed and will calculate the p-value for the difference
between the two proportions.

**Kind**: global function  
**Returns**: <code>number</code> - the p-value, a value between 0 and 1  

| Param | Type | Description |
| --- | --- | --- |
| sample1 | <code>number</code> | the sample size of the first group (e.g. total number of visitors) |
| conversions1 | <code>number</code> | the number of conversions in the first group |
| sample2 | <code>number</code> | the sample size of the second group |
| conversions2 | <code>number</code> | the number of conversions in the second group |

<a name="erf"></a>

## erf(x)
The error function, also known as the Gauss error function.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| x | <code>number</code> | the value to calculate the error function for |

<a name="calcMeanVariance"></a>

## calcMeanVariance(data) ⇒ [<code>MeanVariance</code>](#MeanVariance)
Calculate mean and variance of a dataset.

**Kind**: global function  
**Returns**: [<code>MeanVariance</code>](#MeanVariance) - mean and variance of the input dataset  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array.&lt;number&gt;</code> | the input data |

<a name="samplingError"></a>

## samplingError(total, samples)
Determines the sampling error based on a binomial distribution.
Each sample is a Bernoulli trial, where the probability of success is the
proportion of the total population that has the attribute of interest.
The sampling error is calculated as the standard error of the proportion.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| total | <code>number</code> | the expectation value of the total population |
| samples | <code>number</code> | the number of successful trials (i.e. samples) |

<a name="tTest"></a>

## tTest(left, right) ⇒ <code>number</code>
Performs a significance test on the data. The test assumes
that the data is normally distributed and will calculate
the p-value for the difference between the two data sets.

**Kind**: global function  
**Returns**: <code>number</code> - the p-value, a value between 0 and 1  

| Param | Type | Description |
| --- | --- | --- |
| left | <code>Array.&lt;number&gt;</code> | the first data set |
| right | <code>Array.&lt;number&gt;</code> | the second data set |

<a name="toHumanReadable"></a>

## toHumanReadable(num, precision) ⇒ <code>String</code>
Returns a human readable number

**Kind**: global function  
**Returns**: <code>String</code> - a human readable number  

| Param | Type | Description |
| --- | --- | --- |
| num | <code>Number</code> | a number |
| precision | <code>Number</code> | the number of significant digits |

<a name="computeConversionRate"></a>

## computeConversionRate(conversions, visits) ⇒ <code>number</code>
Conversion rates are computed as the ratio of conversions to visits. The conversion rate is
capped at 100%.

**Kind**: global function  
**Returns**: <code>number</code> - the conversion rate as a percentage  

| Param | Description |
| --- | --- |
| conversions | the number of conversions |
| visits | the number of visits |

<a name="addCalculatedProps"></a>

## addCalculatedProps(bundle) ⇒ [<code>Bundle</code>](#Bundle)
Calculates properties on the bundle, so that bundle-level filtering can be performed

**Kind**: global function  
**Returns**: [<code>Bundle</code>](#Bundle) - a bundle with additional properties  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>RawBundle</code>](#RawBundle) | the raw input bundle, without calculated properties |

<a name="RawEvent"></a>

## RawEvent : <code>Object</code>
a raw RUM event

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| checkpoint | <code>string</code> | the name of the event that happened |
| target | <code>string</code> \| <code>number</code> | the target of the event, typically an external URL |
| source | <code>string</code> | the source of the event, typically a CSS selector |
| value | <code>number</code> | the value of a CWV metric |
| timeDelta | <code>number</code> | – the difference in milliseconds between this event's time and the containing bundle's timestamp |

<a name="RawBundle"></a>

## RawBundle : <code>Object</code>
a raw bundle of events, all belonging to the same page view

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | the unique identifier of the bundle. IDs can duplicate across bundles |
| host | <code>string</code> | the hostname that the page view was made to |
| time | <code>string</code> | exact time of the first event in the bundle, in ISO8601 format |
| timeSlot | <code>string</code> | the hourly timesot that this bundle belongs to |
| url | <code>string</code> | the URL of the request, without URL parameters |
| userAgent | <code>string</code> | the user agent class, for instance desktop:windows or mobile:ios |
| hostType | <code>string</code> | the type of host, for instance 'helix' or 'aemcs' |
| weight | <code>number</code> | the weight, or sampling ratio 1:n of the bundle |
| events | [<code>RawEvent</code>](#RawEvent) | the list of events that make up the bundle |

<a name="Bundle"></a>

## Bundle : <code>Object</code>
a processed bundle of events, with extra properties

**Kind**: global typedef  
**Extends**: [<code>RawBundle</code>](#RawBundle)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| visit | <code>boolean</code> | does this bundle start a visit |
| conversion | <code>boolean</code> | did a conversion happen in this visit |
| cwvINP | <code>number</code> | interaction to next paint, for the entire bundle |
| cwvLCP | <code>number</code> | largest contentful paint, for the entire bundle |
| cwvCLS | <code>number</code> | cumulative layout shift, for the entire bundle |
| ttfb | <code>number</code> | time to first byte, for the entire bundle |

<a name="RawChunk"></a>

## RawChunk : <code>Object</code>
a list of raw, unprocessed bundles as delivered by the endpoint

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| date | <code>string</code> | the base date of all bundles in the chunk |
| rumBundles | [<code>Array.&lt;RawBundle&gt;</code>](#RawBundle) | the bundles, as retrieved from the server |

<a name="Aggregate"></a>

## Aggregate : <code>Object</code>
an object that contains aggregate metrics

**Kind**: global typedef  
<a name="Totals"></a>

## Totals ⇐ <code>Object&lt;string,</code>
A total is an object that contains {Metric} objects
for each defined series.

**Kind**: global typedef  
**Extends**: <code>Object&lt;string,</code>  
<a name="FacetFn"></a>

## FacetFn ⇒ <code>Array.&lt;string&gt;</code>
A facet function takes a bundle and returns an array of facet values.

**Kind**: global typedef  
**Returns**: <code>Array.&lt;string&gt;</code> - Array of facet values  

| Param | Type | Description |
| --- | --- | --- |
| bundle | [<code>Bundle</code>](#Bundle) | The bundle to process |

<a name="Line"></a>

## Line : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| slope | <code>number</code> | the slope of the linear function, i.e. increase of y for every increase of x |
| intercept | <code>number</code> | the intercept of the linear function, i.e. the value of y for x equals zero |

<a name="MeanVariance"></a>

## MeanVariance : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| mean | <code>number</code> | the mean of a dataset |
| variance | <code>number</code> | the variance of a dataset |

