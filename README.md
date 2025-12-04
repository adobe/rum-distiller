# RUM Distiller

RUM Distiller is a JavaScript library for data exploration of Adobe RUM data. It allows you to define the shape of the data first, in
the form of "series", "groups", and "facets". You can then filter the data based on the defined facets, and will automatically get data
aggregations for the series.

### Estimating “Dark Matter” URLs (Chao1)

When sampling hides low‑traffic pages, you can estimate the total number of URLs that received ≥1 visit using a classical unseen‑species estimator (Chao1), plus a 95% CI.

- Inline API:
  - `dc.estimators('plainURL', 'pageViews').chao1` returns `{ sObs, sHat, sUnseen, f1, f2, ci, darkCI }` for the current filters/window.
  - Works with any facet/series pair you’ve registered.

- Direct functions (for raw rows or custom flows):
  - `import { chao1, chao1CI, inferSamplesFromCI, estimateDarkMatterFromCI, estimateDarkMatterFromCIWithCI } from './src/estimators/chao1.js'`

See algorithm details in [src/estimators/README.md](src/estimators/README.md).

References
- Chao, A. (1984). Nonparametric estimation of the number of classes in a population. Scandinavian Journal of Statistics, 11, 265–270. https://doi.org/10.2307/4615964
- Chao, A. (1987). Estimating the population size for capture–recapture data with unequal catchability. Biometrics, 43(4), 783–791. https://doi.org/10.2307/2531532

## Concepts


### Bundle
The basic building block of RUM Distiller is the [`Bundle`](API.md#Bundle). A bundle is a collection of events that belong to the same page view. Each bundle has a `weight`, which is the number of page views that are represented by the bundle.

Due to sampling and subsampling, the weight of a bundle is typically 100 or more.

The next three concepts are the building blocks that describe the shape of the data: Series, Groups, and Facets.

### Series

A series is a way to extract a metric from a bundle. Values of a series are
always numeric, and allow for simple calculations, like counting, averaging,
summing, percentiles, and so on.

At its core, a series is a function that takes a bundle and returns a number. In
a graph, you would plot the values of a series on the y-axis.

There are many [built-in series](API.md#module_series) included in RUM Distiller, but you can also implement your own custom series.

Once you have a series defined, you can add it to a [`DataChunks`](API.md#DataChunks) object using the [`addSeries`](API.md#DataChunks+addSeries) method.

### Groups

A group is a way to group data into a set of buckets. The most common type of
grouping is to group by time, but you can also group by other dimensions, if needed.

In a graph, you would plot the values of a group on the y-axis. In practice,
many charts such as pie charts, or most bar charts do not require a group.

Programmatically, [a group is a function](API.md#groupByFn) that takes a bundle and returns a string.

### Facets

A facet is a way to filter data. For each facet type, there can be multiple facet values and each bundle can satisfy multiple facets values for a given
facet type. Most applications define up to a dozen or so facet types.

When filtering, different facets are combined using logical AND, meaning that
all facets must be satisfied for a bundle to be included in the result set.

When there are multiple filter values given for one facet type, the facet's
combiner decides if it is sufficent if a bundle matches `some` or `every` value.

Facets are defined using the [`addFacet`](API.md#DataChunks+addFacet) method and
a facet value function takes a bundle and returns either a string or an array of strings.

Normally, all facet values are treated as discrete values, but it is possible to
turn discrete values into ranges by creating a histogram facet.

#### Histogram Facets

A histogram facet is a facet that groups data into buckets, based on the values of a base facet.

You can create a histogram facet using the [`addHistogramFacet`](API.md#DataChunks+addHistogramFacet) method.

A histogram facet is based on an existing facet that returns numeric values. It
will then group the data into buckets, each bucket having a lower and upper limit. Each bucket will contain roughly the same number of values, so that the
histogram is evenly distributed, and appying a filter on the histogram facet
will take good slice of the data.

### Filtering

Once the shape of the data is defined, we can query the data using the `filter`, `totals`, and `facets` views. The most fundamental method is to
`filter`.

A filter definition is entirely declarative, so that you do not need to write
any imperative code anymore, as this has been handled by the creation of your facets before.

A filter declaration is an object that maps from facet names to either a single value or an array of values. The filter will return all bundles that
satisfy each of the facet's value filters, using the combiner to deal with multiple values.

You can apply a filter to a `DataChunks` object using the [`filter`](API.md#DataChunks+filter) setter.

```javascript
// set up the dataChunks
const data = new DataChunks();

// add some data
data.addData(bundles);

// filter the data
data.filter = {
  "device.type": ["desktop", "mobile"],
  "page.path": ["/home", "/about"],
};
// all subsequent calls to data will use this filter
```

### Totals

Remember the metrics that we defined before? The `totals` view will calculate
the metrics for the current filter. The type of these totals is an [`Aggregate`](API.md#Aggregate) object.

```javascript
// calculate the totals
const totalPageViews = data.totals.pageViews.sum;
```
If we have set up a `pageViews` series, this will be the total number of page views. In addition to getting the sum, we can also get the `mean` (average), `min`, `max`, `median`, `stddev` (standard deviation), and `percentiles` (any arbitrary percentile, e.g. 50th, 90th, 99th percentiles).
