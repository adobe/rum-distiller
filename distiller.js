/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable max-classes-per-file */
/*
 * @module distiller
 * This module is another service worker, which will handle the number crunching, i.e.
 * filtering, aggregating, and summarizing the data.
 */
import { urlProducer } from './utils.js';

// Static lookup tables for filter combiners and negators
// Hoisted to module level to avoid recreating on every bundle filter iteration
const COMBINERS = {
  // if some elements match, then return true (partial inclusion)
  some: 'some',
  // if some elements do not match, then return true (partial exclusion)
  none: 'some',
  // if every element matches, then return true (full inclusion)
  every: 'every',
  // if every element does not match, then return true (full exclusion)
  never: 'every',
};

const NEGATORS = {
  some: (value) => value,
  every: (value) => value,
  none: (value) => !value,
  never: (value) => !value,
};

/**
 * @typedef {Object} RawEvent - a raw RUM event
 * @property {string} checkpoint - the name of the event that happened
 * @property {string|number} target - the target of the event, typically an external URL
 * @property {string} source - the source of the event, typically a CSS selector
 * @property {number} value - the value of a CWV metric
 * @property {number} timeDelta – the difference in milliseconds between this event's
 * time and the containing bundle's timestamp
 */

/**
 * @typedef {Object} RawBundle - a raw bundle of events, all belonging to the same page view
 * @property {string} id - the unique identifier of the bundle. IDs can duplicate across bundles
 * @property {string} host - the hostname that the page view was made to
 * @property {string} time - exact time of the first event in the bundle, in ISO8601 format
 * @property {string} timeSlot - the hourly timesot that this bundle belongs to
 * @property {string} url - the URL of the request, without URL parameters
 * @property {string} userAgent - the user agent class, for instance desktop:windows or mobile:ios
 * @property {string} hostType - the type of host, for instance 'helix' or 'aemcs'
 * @property {number} weight - the weight, or sampling ratio 1:n of the bundle
 * @property {RawEvent} events - the list of events that make up the bundle
 */

/**
 * @typedef {Object} Bundle - a processed bundle of events, with extra properties
 * @extends RawBundle
 * @property {boolean} visit - does this bundle start a visit
 * @property {boolean} conversion - did a conversion happen in this visit
 * @property {number} cwvINP - interaction to next paint, for the entire bundle
 * @property {number} cwvLCP - largest contentful paint, for the entire bundle
 * @property {number} cwvCLS - cumulative layout shift, for the entire bundle
 * @property {number} ttfb - time to first byte, for the entire bundle
 */

/**
 * @typedef {Object} RawChunk - a list of raw, unprocessed bundles as delivered by the endpoint
 * @property {string} date - the base date of all bundles in the chunk
 * @property {RawBundle[]} rumBundles - the bundles, as retrieved from the server
 */

function aggregateFn(valueFn) {
  /**
   * @param {Aggregate} acc the current aggregate
   * @param {Bundle} bundle the bundle to add to the aggregate
   */
  return (acc, bundle) => {
    const value = valueFn(bundle);
    if (value === undefined) return acc;
    acc.count += 1;
    acc.sum += value;
    acc.weight += bundle.weight;
    acc.values.push(value);
    return acc;
  };
}

/**
 * Optimized grouping function using two-pass approach with pre-allocated arrays.
 * This eliminates the performance cost of dynamic array growth.
 * @param {Bundle[]} bundles - Array of bundles to group
 * @param {function(Bundle): (string|string[]|null)} groupByFn - Function to determine group key(s) for each bundle
 * @returns {Object<string, Bundle[]>} Grouped bundles
 */
function groupBundlesOptimized(bundles, groupByFn) {
  // Pass 1: Count bundles per group to determine array sizes
  const counts = {};

  for (let i = 0; i < bundles.length; i += 1) {
    const bundle = bundles[i];
    const key = groupByFn(bundle);
    if (!key) continue; // eslint-disable-line no-continue

    if (Array.isArray(key)) {
      for (let j = 0; j < key.length; j += 1) {
        const k = key[j];
        counts[k] = (counts[k] || 0) + 1;
      }
    } else {
      counts[key] = (counts[key] || 0) + 1;
    }
  }

  // Pass 2: Pre-allocate arrays and fill them
  const result = {};
  const indices = {};

  // Pre-allocate all arrays
  const keys = Object.keys(counts);
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    result[k] = new Array(counts[k]);
    indices[k] = 0;
  }

  // Fill arrays
  for (let i = 0; i < bundles.length; i += 1) {
    const bundle = bundles[i];
    const key = groupByFn(bundle);
    if (!key) continue; // eslint-disable-line no-continue

    if (Array.isArray(key)) {
      for (let j = 0; j < key.length; j += 1) {
        const k = key[j];
        result[k][indices[k]] = bundle;
        indices[k] += 1;
      }
    } else {
      result[key][indices[key]] = bundle;
      indices[key] += 1;
    }
  }

  return result;
}

/**
 * @typedef {Object} Aggregate - an object that contains aggregate metrics
 */
class Aggregate {
  constructor(parentProvider = () => null) {
    this.count = 0;
    this.sum = 0;
    this.weight = 0;
    this.values = [];
    this.parentProvider = parentProvider;
  }

  get parent() {
    return this.parentProvider();
  }

  get min() {
    return this.values.reduce((min, val) => Math.min(min, val), Infinity);
  }

  get max() {
    return this.values.reduce((max, val) => Math.max(max, val), -Infinity);
  }

  get share() {
    if (!this.parent) return null;
    return this.count / this.parent.count;
  }

  get percentage() {
    if (!this.parent) return null;
    return this.sum / this.parent.sum;
  }

  get mean() {
    return this.sum / this.count;
  }

  percentile(p) {
    const sorted = this.values.sort((left, right) => left - right);
    const index = Math.floor((p / 100) * sorted.length);
    return sorted[index];
  }
}

class InterpolatedAggregate {
  constructor(interpolationFn, sourceAggregates) {
    this.interpolationFn = interpolationFn;
    this.sourceAggregates = sourceAggregates;
  }

  get weight() {
    const value = this.interpolationFn(this.sourceAggregates);
    if (Number.isNaN(value)) return 0;
    return value;
  }
}

class Facet {
  constructor(parent, value, name) {
    this.parent = parent;
    this.value = value;
    this.name = name;
    this.count = 0;
    this.weight = 0;
    this.entries = [];
  }

  /**
   * Calculate the metrics for this facet. The metrics will be
   * calculated based on the series that have been added to the
   * parent object using `addSeries`.
   * The return value will be an object with one key for each
   * series, containing an object with the following properties:
   * - count
   * - sum
   * - min
   * - max
   * - mean
   * - percentile(p)
   * @returns {Aggregate} metrics
   */
  get metrics() {
    return this.getMetrics(Object.keys(this.parent.series));
  }

  getMetrics(series) {
    if (!series || series.length === 0) return {};
    const res = {};
    const needed = [];
    if (this.metricsIn) {
      series.forEach((s) => {
        if (this.metricsIn[s]) {
          res[s] = this.metricsIn[s];
        } else {
          needed.push(s);
        }
      });
    } else {
      this.metricsIn = {};
      needed.push(...series);
    }

    if (needed.length) {
      needed.forEach((s) => {
        const valueFn = this.parent.series[s];
        this.metricsIn[s] = this.entries.reduce(aggregateFn(valueFn), new Aggregate());
        res[s] = this.metricsIn[s];
      });
    }
    return res;
  }
}

/**
 * @class DataChunks
 * @description This class is used to filter, group, and aggregate data from RUM events.
 */

export class DataChunks {
  constructor() {
    this.data = [];
    this.filters = {};
    this.resetData();
    this.resetSeries();
    this.resetFacets();
  }

  resetSeries() {
    this.series = {};
    this.interpolations = {};
  }

  /**
   * A series value function calculates the series value of a bundle.
   * If no value is returned, then the bundle will not be considered
   * for the series.
   * @function seriesValueFn
   * @param {Bundle} bundle the bundle to calculate the series value for
   * @returns {number|undefined} the series value or undefined
   */
  /**
   * A series is a named list of values, which are calculated
   * for each bundle in the data set.
   * @param {string} seriesName name of the series
   * @param {seriesValueFn} seriesValueFn function that returns the series value
   * for each bundle
   */
  addSeries(seriesName, seriesValueFn) {
    this.series[seriesName] = seriesValueFn;
  }

  /**
   * An interpolation is a series that is calulated based on the aggrega
   * values of other series. The interpolation function will receive the
   * list of source series and an interpolation function that will return
   * the interpolated value.
   * The interpolation function will have as many arguments as there are
   * source series.
   * @param {string} seriesName name of the (interpolated) series
   * @param {string[]} sourceSeries list of source series to interpolate from
   * @param {function(Object<string, Aggregate>)} interpolationFn
   */
  addInterpolation(seriesName, sourceSeries, interpolationFn) {
    this.interpolations[seriesName] = { sourceSeries, interpolationFn };
  }

  resetFacets() {
    this.filters = {};
    this.facetFns = {};
    this.facetCombiners = {};
  }

  /**
   * A facet function works on the entire data set.
   * @param {string} facetName name of the facet
   * @param {groupByFn} facetValueFn function that returns the facet value –
   * can return multiple values
   * @param {string} facetCombiner how to combine multiple values, default is 'some', can be 'every'
   * @param {string} negativeCombiner how to combine multiple values for the negative facet,
   * possible values are 'none' and 'never'. Only when this parameter is set, a negative facet
   * will be created.
   */
  addFacet(facetName, facetValueFn, facetCombiner = 'some', negativeCombiner = undefined) {
    this.facetFns[facetName] = facetValueFn;
    this.facetCombiners[facetName] = facetCombiner;
    if (negativeCombiner) {
      this.facetFns[`${facetName}!`] = facetValueFn;
      this.facetCombiners[`${facetName}!`] = negativeCombiner;
    }
    this.resetData();
  }

  /**
   * Adds a histogram facet, derived from an existing facet. This facet
   * will group the data into buckets, based on the values of the base
   * facet.
   * You can specify the bucket size, limits and the type of bucketing.
   * @param {string} facetName name of your new facet
   * @param {string} baseFacet name of the base facet, from which to derive the histogram
   * @param {object} bucketOptions
   * @param {number} bucketOptions.count number of buckets
   * @param {number} bucketOptions.min minimum value of the histogram
   * @param {number} bucketOptions.max maximum value of the histogram
   * @param {('linear'|'logarithmic'|'quantiles')} bucketOptions.steps type of bucketing, can be
   * 'linear' (each bucket has the same value range), 'logarithmic' (same value range on
   * logarithmic scale), or 'quantiles' (buckets are roughly equal in size based on the current
   * facet values, but the bucket min/max values are less predictable)
   * @param {function} formatter a number formatter
   */
  addHistogramFacet(facetName, baseFacet, {
    count: bucketcount = 10,
    min: absmin = -Infinity,
    max: absmax = Infinity,
    steps = 'linear',
  }, formatter = Intl.NumberFormat(undefined, { maximumSignificantDigits: 2 })) {
    const facetvalues = this.facets[baseFacet];

    const createBundleFacetMap = (facetValues) => facetValues.reduce((acc, facet) => {
      facet.entries.forEach((aBundle) => {
        acc[aBundle.id] = acc[aBundle.id] ? [...acc[aBundle.id], facet] : [facet];
      });
      return acc;
    }, {});

    // inside a facet there are entries
    // a entry is a array of bundles
    // a bundle is a object with a id
    // need to create a map of bundles as a key and as values the facets where it belongs to
    // because then we need to use it in the facets value function
    // this is mainly to avoid looping through all the facets for each bundle
    const bundleFacetMap = createBundleFacetMap(facetvalues);

    let quantilesteps;
    const stepfns = {
      // split the range into equal parts
      linear: (min, max, total, step) => (((max - min) / total) * step) + min,
      // split the range into exponential parts, so that the full range
      // is covered
      logarithmic: (min, max, total, step) => {
        const range = max - min;
        const logrange = Math.log(range);
        const logstep = logrange / total;
        return Math.exp(logstep * step) + min;
      },
      // split the range into roughly equal size buckets
      // based on the current facet values (inefficient, needs
      // memoization)
      quantiles: (min, max, total, step) => {
        if (quantilesteps === undefined) {
          const allvalues = facetvalues
            .filter(({ value }) => value !== undefined)
            .map(({ value, weight }) => ({ value: Number.parseInt(value, 10), weight }))
            .filter(({ value }) => value >= min)
            .filter(({ value }) => value <= max)
            .sort((a, b) => a.value - b.value);
          const totalWeight = allvalues.reduce((acc, { weight }) => acc + weight, 0);
          const stepWeight = totalWeight
            / (total + (1 / total)); // add a little extra to make sure we have enough steps
          let currentWeight = 0;
          quantilesteps = allvalues.reduce((acc, { value, weight }) => {
            currentWeight += weight;
            if (currentWeight > stepWeight) {
              acc.push(value);
              currentWeight = 0;
            }
            return acc;
          }, []);
        }
        return quantilesteps[step] || max;
      },
    };
    const min = Math.max(absmin, facetvalues
      .map(({ value }) => Number.parseInt(value, 10))
      .reduce((acc, val) => Math.min(acc, val), absmax));
    const max = Math.min(absmax, facetvalues
      .map(({ value }) => Number.parseInt(value, 10))
      .reduce((acc, val) => Math.max(acc, val), absmin));
    const buckets = Array
      .from({ length: bucketcount }, (_, i) => stepfns[steps](min, max, bucketcount, i));
    this.addFacet(facetName, (bundle) => {
      // find the facetvalue that has the current bundle
      const facetmatch = bundleFacetMap[bundle.id];
      // const facetmatch = facetvalues.find((f) => f.entries.some((e) => e.id === bundle.id));
      if (!facetmatch) {
        return [];
      }
      // pick the first element from the array
      const facetvalue = Number.parseInt(facetmatch[0].value, 10);
      // const facetvalue = Number.parseInt(facetmatch.value, 10);
      const bucket = buckets.findIndex((b) => facetvalue < b);
      return bucket !== -1
        ? `<${formatter.format(buckets[bucket])}`
        : `>=${formatter.format(buckets[bucketcount - 1])}`;
    });
  }

  /**
   * Adds a cluster facet, derived from an existing facet. This facet
   * will group the data into clusters based on the URL paths.
   * You can specify the number of clusters and a producer function to
   * generate the clusters.
   * @param {string} facetName name of your new facet
   * @param {string} baseFacet name of the base facet, from which to derive the clusters
   * @param {object} clusterOptions options
   * @param {number} clusterOptions.count number of clusters, The default value is log10(nValues)
   * @param {function} clusterOptions.producer function that takes the cluster value and returns
   * all possible cluster values
   */
  addClusterFacet(facetName, baseFacet, {
    count: clustercount = Math.floor(Math.log10(this.facets[baseFacet].length)),
    producer = urlProducer,
  }, facetCombiner = 'some', negativeCombiner = undefined) {
    const facetValues = this.facets[baseFacet];

    const createClusterMap = () => {
      const clusterMap = facetValues.reduce((map, facet) => {
        const clusters = producer(facet.value);
        clusters.forEach((cluster) => {
          if (!map.has(cluster)) {
            map.set(cluster, 0);
          }
          map.set(cluster, map.get(cluster) + 1);
        });
        return map;
      }, new Map());

      // Find the most occurring cluster
      const [mostOccurringCluster] = [...clusterMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([cluster]) => cluster);

      // Calculate the total number of items in the superset cluster
      const totalItemsInSupersetCluster = Math.floor(facetValues.length + clustercount);

      return { clusterMap, mostOccurringCluster, totalItemsInSupersetCluster };
    };

    const { clusterMap } = createClusterMap();
    const sortedClusters = [...clusterMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, clustercount)
      .map(([cluster]) => cluster);

    this.addFacet(facetName, (bundle) => {
      const facetMatch = facetValues.find((f) => f.entries.some((e) => e.id === bundle.id));
      const clusters = (facetMatch && producer(facetMatch.value)) || [];
      return [facetMatch.value, ...clusters.filter((cluster) => sortedClusters.includes(cluster))];
    }, facetCombiner, negativeCombiner);
  }

  /**
   * @function eventFilterFn
   * @param {Event} event the event to check
   * @returns {boolean} true if the event should be included
   */

  resetData() {
    // data that has been filtered
    this.filteredIn = null;
    // filtered data that has been grouped
    this.groupedIn = {};
    // grouped data that has been aggregated
    this.seriesIn = {};
    // totals for the entire dataset
    this.totalsIn = {};
    // facets[series]
    this.facetsIn = {};
    // memoziaton
    this.memo = {};
    // cache for facet function results: WeakMap<bundle, Map<attributeName, cachedValue>>
    this.facetValueCache = new WeakMap();
  }

  /**
   * Load raw chunks. This will replace data that has been loaded before
   * @param {RawChunk[]} chunks the raw data to load, an array of chunks
   */
  load(chunks) {
    this.data = chunks;
    this.resetData();
  }

  /**
   * Load more data. This will amend the data that has been loaded before
   * @param {RawChunk} chunks the raw data to load, an array of chunks
   */
  addData(chunks) {
    this.data.push(...chunks);
    this.resetData();
  }

  /**
   * @returns {Bundle[]} all bundles, regardless of the chunk they belong to
   */
  get bundles() {
    if (!this.memo.bundles) {
      // Calculate total length of all rumBundles
      let totalLength = 0;
      for (let i = 0; i < this.data.length; i += 1) {
        totalLength += this.data[i].rumBundles.length;
      }

      // Preallocate the array
      this.memo.bundles = new Array(totalLength);

      // Fill the preallocated array
      let index = 0;
      for (let i = 0; i < this.data.length; i += 1) {
        // eslint-disable-next-line prefer-destructuring
        const rumBundles = this.data[i].rumBundles;
        for (let j = 0; j < rumBundles.length; j += 1) {
          this.memo.bundles[index] = rumBundles[j];
          index += 1;
        }
      }
    }
    return this.memo.bundles;
  }

  /**
   * A filter function that will return true for matching
   * bundles and false for non-matching bundles.
   * @function bundleFilter
   * @param {Bundle} bundle the bundle to check
   * @returns {boolean} true if the bundle matches the filter
   */

  /**
   * Defines what filter to apply to the data. The filter
   * is an object that specifies the valid values for each
   * defined facet.
   * Filter values are the same values that can get returned
   * by the `valueFn` that has been added with `addFacet`.
   * @param {Object<string, string[]>} filterSpec the filter specification
   */
  set filter(filterSpec) {
    this.filters = filterSpec;
    // reset caches that depend on the filter
    this.resetData();
  }

  /**
   * Function used for skipping certain filtering attributes. The logic of the function
   * depends on the context, for instance when filtering bundles, this function is chained
   * as a filter function in order to skip certain attributes.
   * @function skipFilterFn
   * @param {string} attributeName the name of the attribute to skip.
   * @returns {boolean} true if the attribute should be included or not.
   */

  /**
   * Function used for whitelist filtering attributes. The logic of the function
   * depends on the context, for instance when filtering bundles, this function is chained
   * as a filter function in order to ditch attributes.
   * @function existenceFilterFn
   * @param {string} attributeName the name of the whitelisted attribute.
   * @returns {boolean} true if the attribute should be included or not.
   */

  /**
   * Function used for extracting the values for a certain attribute out of a dataset
   * specific to the context.
   * @function valuesExtractorFn
   * @param {string} attributeName the name of the attribute to extract.
   * @param {Bundle} bundle the dataset to extract the attribute from.
   * @param {DataChunks} parent the parent object that contains the bundles.
   * @returns {boolean} true if the attribute should be included or not.
   */

  /**
   * Function used for inferring the combiner that's going to be used when
   * filtering attributes.
   * @function combinerExtractorFn
   * @param {string} attributeName the name of the attribute to extract.
   * @param {DataChunks} parent the parent object that contains the bundles.
   * @returns {string} 'some' or 'every'.
   */

  /**
   * @private
   * @param {Bundle[]} bundles
   * @param {Object<string, string[]>} filterSpec
   * @param {string[]} skipped facets to skip
   */
  filterBundles(bundles, filterSpec, skipped = []) {
    const existenceFilterFn = ([facetName]) => {
      if (!this.facetFns[facetName]) {
        throw new Error(`Unknown "${facetName}" facet in filter`);
      }
      return this.facetFns[facetName];
    };
    const skipFilterFn = ([facetName]) => !skipped.includes(facetName);
    const valuesExtractorFn = (attributeName, bundle, parent) => {
      // Check cache first
      let bundleCache = parent.facetValueCache.get(bundle);
      if (!bundleCache) {
        bundleCache = new Map();
        parent.facetValueCache.set(bundle, bundleCache);
      }

      if (bundleCache.has(attributeName)) {
        return bundleCache.get(attributeName);
      }

      // Compute and cache the result
      const facetValue = parent.facetFns[attributeName](bundle);
      const result = Array.isArray(facetValue) ? facetValue : [facetValue];
      bundleCache.set(attributeName, result);
      return result;
    };
    const combinerExtractorFn = (attributeName, parent) => parent.facetCombiners[attributeName] || 'some';
    // eslint-disable-next-line max-len
    return this.applyFilter(bundles, filterSpec, skipFilterFn, existenceFilterFn, valuesExtractorFn, combinerExtractorFn);
  }

  /**
   * @private
   * @param {Bundle[]} bundles that will be filtered based on a filter specification.
   * @param {Object<string, string[]>} filterSpec the filter specification.
   * @param {skipFilterFn} skipFilterFn function to skip filters. Useful for skipping
   * unwanted facets, in general skipping attributes.
   * @param {existenceFilterFn} existenceFilterFn function to filter out non-existing attributes.
   * This is used to skip facets that have not been added. In general,
   * this can be used to whitelist attributes names.
   * @param {valuesExtractorFn} valuesExtractorFn function to extract the probed values.
   * @param {combinerExtractorFn} combinerExtractorFn function to extract the combiner.
   * @returns {Bundle[]} the filtered bundles.
   */
  // eslint-disable-next-line max-len
  applyFilter(bundles, filterSpec, skipFilterFn, existenceFilterFn, valuesExtractorFn, combinerExtractorFn) {
    try {
      // Pre-compute combiner/negator pairs for each filter attribute
      // This avoids recreating the lookup tables for every bundle in the hot loop
      const filterBy = Object.entries(filterSpec)
        .filter(skipFilterFn)
        .filter(([, desiredValues]) => desiredValues.length)
        .filter(existenceFilterFn)
        .map(([attributeName, desiredValues]) => {
          const combinerPreference = combinerExtractorFn(attributeName, this);
          return [
            attributeName,
            desiredValues,
            COMBINERS[combinerPreference],
            NEGATORS[combinerPreference],
          ];
        });
      return bundles.filter((bundle) => filterBy.every(([attributeName, desiredValues, combiner, negator]) => {
        const actualValues = valuesExtractorFn(attributeName, bundle, this);

        // Optimize lookup: use Set for O(1) lookup when actualValues is large (>= 5 items)
        // For small arrays, .includes() is faster due to Set construction overhead
        if (actualValues.length >= 5) {
          const actualValuesSet = new Set(actualValues);
          return desiredValues[combiner]((value) => negator(actualValuesSet.has(value)));
        }
        return desiredValues[combiner]((value) => negator(actualValues.includes(value)));
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Error while applying filter: ${error.message}`);
      return [];
    }
  }

  /**
   * Checks if a conversion has happened in the bundle. A conversion means a business metric
   * that has been achieved, for instance a click on a certain link.
   * @param {Bundle} aBundle the bundle to check.
   * @param {Object<string, string[]>} filterSpec uses the same format as the filter specification.
   * For instance { checkpoint: ['click'] } means that inside a bundle an event that has the
   * checkpoint attribute set to 'click' must exist.
   * @param {string} combiner used to determine if all or some filters must match.
   * By default, 'every' is used.
   * @returns {boolean} the result of the check.
   */
  hasConversion(aBundle, filterSpec, combiner) {
    const existenceFilterFn = ([facetName]) => {
      if (!this.facetFns[facetName]) {
        throw new Error(`Unknown "${facetName}" facet in filter`);
      }
      return this.facetFns[facetName];
    };
    const skipFilterFn = () => true;
    const valuesExtractorFn = (attributeName, bundle, parent) => {
      // Check cache first
      let bundleCache = parent.facetValueCache.get(bundle);
      if (!bundleCache) {
        bundleCache = new Map();
        parent.facetValueCache.set(bundle, bundleCache);
      }

      if (bundleCache.has(attributeName)) {
        return bundleCache.get(attributeName);
      }

      // Compute and cache the result
      const facetValue = parent.facetFns[attributeName](bundle);
      const result = Array.isArray(facetValue) ? facetValue : [facetValue];
      bundleCache.set(attributeName, result);
      return result;
    };
    const combinerExtractorFn = () => combiner || 'every';

    return this.applyFilter(
      [aBundle],
      filterSpec,
      skipFilterFn,
      existenceFilterFn,
      valuesExtractorFn,
      combinerExtractorFn,
    ).length > 0;
  }

  filterBy(filterSpec) {
    this.filter = filterSpec;
    return this.filtered;
  }

  get filtered() {
    if (this.filteredIn) return this.filteredIn;
    if (Object.keys(this.filters).length === 0) return this.bundles; // no filter, return all
    if (Object.keys(this.facetFns).length === 0) return this.bundles; // no facets, return all
    this.filteredIn = this.filterBundles(this.bundles, this.filters);
    return this.filteredIn;
  }

  /**
   * A grouping function returns a group name or undefined
   * for each bundle, according to the group that the bundle
   * belongs to.
   * @function groupByFn
   * @param {Bundle} bundle the bundle to check
   * @returns {string[]|string|undefined} the group name(s) or undefined
   */

  /**
   * Groups the filteredIn data by the groupFn. The groupFn
   * should return a string that will be used as the key for
   * the group. If the groupFn returns a falsy value, the
   * bundle will be skipped.
   * @param {groupByFn} groupByFn for each object, determine the group key
   * @returns {Object<string, Bundle[]>} grouped data, each key is a group
   * and each value is an array of bundles
   */
  group(groupByFn) {
    this.groupedIn = groupBundlesOptimized(this.filtered, groupByFn);
    if (groupByFn.fillerFn) {
      // fill in the gaps, as sometimes there is no data for a group
      // so we need to add an empty array for that group
      const allGroups = groupByFn.fillerFn(Object.keys(this.groupedIn));
      this.groupedIn = allGroups.reduce((acc, group) => {
        acc[group] = this.groupedIn[group] || [];
        return acc;
      }, {});
    }
    return this.groupedIn;
  }

  /**
   * Aggregates the grouped data into series data. Each series
   * has been provided by `addSeries` and will be used to
   * calculate the value of each bundle in the group. The
   * aggregated data will be stored in the seriesIn[groupName][seriesName]
   * object.
   * Each result will be an object with the following properties:
   * - count
   * - sum
   * - min
   * - max
   * - mean
   * - percentile(p)
   * @returns {Object<string, Totals>} series data
   */
  get aggregates() {
    if (Object.keys(this.seriesIn).length) return this.seriesIn;
    this.seriesIn = Object.entries(this.groupedIn)
      .reduce((accOuter, [groupName, bundles]) => {
        // eslint-disable-next-line no-param-reassign
        accOuter[groupName] = Object.entries(this.series)
          .reduce((accInner, [seriesName, valueFn]) => {
            // eslint-disable-next-line no-param-reassign
            accInner[seriesName] = bundles.reduce(
              aggregateFn(valueFn),
              // we reference the totals object here, so that we can
              // calculate the share and percentage metrics
              new Aggregate(() => this.totals[seriesName]),
            );
            return accInner;
          }, {});
        // repeat, for interpolations
        // eslint-disable-next-line no-param-reassign
        accOuter[groupName] = Object.entries(this.interpolations)
          .reduce(
            (accInner, [seriesName, { sourceSeries, interpolationFn }]) => {
              const sourceAggregates = sourceSeries
                .reduce((acc, sourceSeriesName) => {
                  acc[sourceSeriesName] = accOuter[groupName][sourceSeriesName];
                  return acc;
                }, {});
              // eslint-disable-next-line no-param-reassign
              accInner[seriesName] = new InterpolatedAggregate(interpolationFn, sourceAggregates);
              return accInner;
            },
            accOuter[groupName],
          );
        return accOuter;
      }, {});
    return this.seriesIn;
  }

  /**
   * A total is an object that contains {Metric} objects
   * for each defined series.
   * @typedef Totals
   * @extends Object<string, Aggregate>
   */
  /**
   * Aggregates the filtered data into totals. The totals will
   * be stored in the totalIn object. The result will be an object
   * with one key for each series that has been added with `addSeries`.
   * Each value will be an object with the following properties:
   * - count
   * - sum
   * - min
   * - max
   * - mean
   * - percentile(p)
   * @returns {Totals} total data
   */
  get totals() {
    // go over each function in this.series and each value in filteredIn
    // and appy the function to the value
    if (Object.keys(this.totalsIn).length) return this.totalsIn;
    this.totalsIn = Object.entries(this.series)
      .reduce((acc, [seriesName, valueFn]) => {
        const parent = this.filtered.reduce(
          aggregateFn(valueFn),
          new Aggregate(),
        );
        // we need to clone the aggregate object, so that we can use it as its own parent
        // this is necessary for calculating the share and percentage metrics
        // the alternative would be to calculate the totals for each group twice (which is slower)
        acc[seriesName] = Object.assign(Object.create(Object.getPrototypeOf(parent)), parent);
        acc[seriesName].parentProvider = () => parent;
        return acc;
      }, {});
    return this.totalsIn;
  }

  /**
   * Calculates facets for all data. For each function
   * added through `addFacet`, it will determine the most common
   * values, their frequency and their weight. The result will
   * be an object with one key for each facet, containining an array
   * of facet objects.
   * @returns {Object<string, Facet[]>} facets data
   */
  get facets() {
    if (Object.keys(this.facetsIn).length) return this.facetsIn;

    const f = (facet, bundle) => {
      // add the bundle to the entries
      // so that we can calculate metrics
      // later on
      facet.entries.push(bundle);
      // eslint-disable-next-line no-param-reassign
      facet.count += 1;
      // eslint-disable-next-line no-param-reassign
      facet.weight += bundle.weight;
      return facet;
    };

    this.facetsIn = Object.entries(this.facetFns)
      .reduce((accOuter, [facetName, facetValueFn]) => {
        // build a list of skipped facets
        const skipped = [];

        if (this.facetCombiners[facetName] === 'some' || this.facetCombiners[facetName] === 'none') {
          // if we are using a combiner that requires not all values to match, then we skip the
          // current facet, so that all possible values are shown, not just the ones that match
          // in combination with the ones already selected
          skipped.push(facetName);
        }
        if (this.facetCombiners[`${facetName}!`] && ['none', 'never'].includes(this.facetCombiners[`${facetName}!`])) {
          // if we have a negated facet, then we skip the negated facet
          // so that we can show all values, not just the ones that do not match
          skipped.push(`${facetName}!`);
        }
        const groupedByFacetIn = groupBundlesOptimized(
          // we filter the bundles by all active filters,
          // except for the current facet (we want to see)
          // all values here.
          this.filterBundles(
            this.bundles,
            this.filters,
            skipped,
          ),
          facetValueFn,
        );

        // eslint-disable-next-line no-param-reassign
        accOuter[facetName] = Object.entries(groupedByFacetIn)
          .reduce((accInner, [facetValue, bundles]) => {
            accInner.push(bundles
              .reduce(f, new Facet(this, facetValue, facetName)));
            // sort the entries by weight, descending
            accInner.sort((left, right) => right.weight - left.weight);
            return accInner;
          }, []);
        return accOuter;
      }, {});
    return this.facetsIn;
  }
}
