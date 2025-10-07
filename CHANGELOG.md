## [1.19.1-prerelease.3](https://github.com/adobe/rum-distiller/compare/v1.19.1-prerelease.2...v1.19.1-prerelease.3) (2025-10-07)


### Performance Improvements

* hoist static objects out of applyFilter hot loop ([0aacb2e](https://github.com/adobe/rum-distiller/commit/0aacb2e8c4f9448f97b420666522978f68b5fcd5)), closes [#3](https://github.com/adobe/rum-distiller/issues/3)

## [1.19.1-prerelease.2](https://github.com/adobe/rum-distiller/compare/v1.19.1-prerelease.1...v1.19.1-prerelease.2) (2025-10-07)


### Bug Fixes

* cache facet values in valuesExtractorFn to eliminate redundant calls ([7057860](https://github.com/adobe/rum-distiller/commit/7057860e1e219fa2fde4c3fd0e30b17c73206187)), closes [#1](https://github.com/adobe/rum-distiller/issues/1)

## [1.19.1-prerelease.1](https://github.com/adobe/rum-distiller/compare/v1.19.0...v1.19.1-prerelease.1) (2025-10-06)


### Bug Fixes

* **docs:** better jsdocs ([958a513](https://github.com/adobe/rum-distiller/commit/958a5136f493b8f67c5bead1aa0de89e140837a0))
* **docs:** typo ([9123c61](https://github.com/adobe/rum-distiller/commit/9123c6188311815465c68a783f303c207a7d41e8))


### Performance Improvements

* optimize grouping with pre-allocated arrays ([32d58e6](https://github.com/adobe/rum-distiller/commit/32d58e6af7b1b93d3ba7987a9ca3ec599d4d8f1a)), closes [#4](https://github.com/adobe/rum-distiller/issues/4)

# [1.19.0](https://github.com/adobe/rum-distiller/compare/v1.18.0...v1.19.0) (2025-09-12)


### Features

* **utils:** add memoization to pathProducer and hostProducer functions ([3d7a70c](https://github.com/adobe/rum-distiller/commit/3d7a70ce7385e151ed88c324c684b480eaf88ba2))

# [1.18.0](https://github.com/adobe/rum-distiller/compare/v1.17.0...v1.18.0) (2025-09-12)


### Bug Fixes

* refactor urlProducer to use functional point-free style ([bbc8d07](https://github.com/adobe/rum-distiller/commit/bbc8d079ad94f8cd07cda2765561b55a83efc1ed))


### Features

* **utils:** url producer should create path sequences from full URLs and subdomain sequences from hostnames ([744f96a](https://github.com/adobe/rum-distiller/commit/744f96afb2fb33f658cafb74ddf44b776516d12b))

# [1.17.0](https://github.com/adobe/rum-distiller/compare/v1.16.3...v1.17.0) (2025-07-12)


### Bug Fixes

* treat AI acquisition as earned ([61b9355](https://github.com/adobe/rum-distiller/commit/61b9355590376e86b1b33f1e5ed8b2bebc75e790))


### Features

* adding a failing test case for classification of chatgpt.com and perplexity utm ([3f51db5](https://github.com/adobe/rum-distiller/commit/3f51db5b4a150b69b03c391be8751714714dab82))
* adding classification for chatgpt and perplexity in traffic acquisition ([597d0c1](https://github.com/adobe/rum-distiller/commit/597d0c13b0866cf0f53d7a6744a55b3ce4b06599))

## [1.16.3](https://github.com/adobe/rum-distiller/compare/v1.16.2...v1.16.3) (2025-03-05)


### Bug Fixes

* reset filters during facet reset ([f7cb147](https://github.com/adobe/rum-distiller/commit/f7cb147362075d68c18b37ae7055935a4a25f9ff))

## [1.16.2](https://github.com/adobe/rum-distiller/compare/v1.16.1...v1.16.2) (2025-01-31)


### Bug Fixes

* trigger release ([c336a48](https://github.com/adobe/rum-distiller/commit/c336a48df5375eccc9e88224b10c3fa35ce3c5da))

## [1.16.1](https://github.com/adobe/rum-distiller/compare/v1.16.0...v1.16.1) (2025-01-20)


### Bug Fixes

* **distiller:** return unclustered facet value in addition to clustered facet value ([fcaab3a](https://github.com/adobe/rum-distiller/commit/fcaab3adffd701c10dc71e4ddb69829161180686))

# [1.16.0](https://github.com/adobe/rum-distiller/compare/v1.15.0...v1.16.0) (2025-01-16)


### Features

* **consent:** support tealium consent manager ([de1dd42](https://github.com/adobe/rum-distiller/commit/de1dd428c9d7e3869cada4ab3ab309ae5cb5c9a7)), closes [#39](https://github.com/adobe/rum-distiller/issues/39)

# [1.15.0](https://github.com/adobe/rum-distiller/compare/v1.14.0...v1.15.0) (2025-01-10)


### Features

* optimized way to normalize # in URLs for referrer classification ([b250bc4](https://github.com/adobe/rum-distiller/commit/b250bc433128ccd9d2ed6dee0da1c89dd2dd4d7e))

# [1.14.0](https://github.com/adobe/rum-distiller/compare/v1.13.1...v1.14.0) (2024-12-20)


### Features

* add cassie consent widget to the list ([29279e1](https://github.com/adobe/rum-distiller/commit/29279e117e57ad5fb2460a12fa00709f3235cc65))

## [1.13.1](https://github.com/adobe/rum-distiller/compare/v1.13.0...v1.13.1) (2024-12-16)


### Bug Fixes

* **distiller:** harden aggregates against call stack size overflow ([978ef12](https://github.com/adobe/rum-distiller/commit/978ef1297c364ede71b1ff89c23def3c790b936d))
* **stats:** avoid overflow in confidence interval calculation ([0f73c9a](https://github.com/adobe/rum-distiller/commit/0f73c9aa683cbf3a25eab943b5bd2b51ffa9930f))

# [1.13.0](https://github.com/adobe/rum-distiller/compare/v1.12.0...v1.13.0) (2024-12-06)


### Features

* normalise # in URLs for referrer classification ([db94b22](https://github.com/adobe/rum-distiller/commit/db94b2253bf6fd246ac21850b0dcc3ffa533e71b))
* normalise # in URLs for referrer classification ([63fee98](https://github.com/adobe/rum-distiller/commit/63fee9897614f4753bce164863b5e4b6577c23b7))

# [1.12.0](https://github.com/adobe/rum-distiller/compare/v1.11.1...v1.12.0) (2024-12-04)


### Bug Fixes

* drop the url count from mostOccurringCluster ([c617025](https://github.com/adobe/rum-distiller/commit/c617025ff6fc72a3f58c18c7a2cc90a98b4e872d))


### Features

* addClusterFacet ([1302861](https://github.com/adobe/rum-distiller/commit/1302861b0de747bb4192af8094582d22f6ca2ec5))
* test coverage for addClusterFacet ([f09ff07](https://github.com/adobe/rum-distiller/commit/f09ff07c3cea6e6c0efeb281fcba50b802f9155c))

## [1.11.1](https://github.com/adobe/rum-distiller/compare/v1.11.0...v1.11.1) (2024-11-27)


### Bug Fixes

* for release ([b75c0a7](https://github.com/adobe/rum-distiller/commit/b75c0a7fb04fd04b2d101906e352ea70dfc5c345))
* for release ([a2aaa67](https://github.com/adobe/rum-distiller/commit/a2aaa67e5177923b4001023db13ee72a41010e97))

# [1.11.0](https://github.com/adobe/rum-distiller/compare/v1.10.0...v1.11.0) (2024-11-27)


### Features

* test coverage for consent.js ([87d46ca](https://github.com/adobe/rum-distiller/commit/87d46cae8997ef0b71c0826c95b77a8b230c36d1))
* test coverage for stats.js ([cb93c52](https://github.com/adobe/rum-distiller/commit/cb93c525ef1b4c191fc0b2caf28899759246aa31))
* test coverage for utils.js ([31ccdcd](https://github.com/adobe/rum-distiller/commit/31ccdcdc9873c8f30ebadefbf84fd55aa7a4cd08))

# [1.10.0](https://github.com/adobe/rum-distiller/compare/v1.9.1...v1.10.0) (2024-11-26)


### Features

* add export for acquisition ([a33de40](https://github.com/adobe/rum-distiller/commit/a33de40df53a601bdcdc11c711ac499d639ec735))

## [1.9.1](https://github.com/adobe/rum-distiller/compare/v1.9.0...v1.9.1) (2024-11-25)


### Bug Fixes

* stack size exceeds for get bundles in nodejs ([b731eb1](https://github.com/adobe/rum-distiller/commit/b731eb1bce32c46e0acfa5e5704d59e95d86d921))
* stack size exceeds for get bundles in nodejs ([cd0b0f8](https://github.com/adobe/rum-distiller/commit/cd0b0f8af8f2c389e9f7684f67aff7590a3ebd39))

# [1.9.0](https://github.com/adobe/rum-distiller/compare/v1.8.0...v1.9.0) (2024-11-20)


### Features

* trigger release ([2b38800](https://github.com/adobe/rum-distiller/commit/2b38800cce59d4cd2a043a2701ec8393f4caab20))

# [1.8.0](https://github.com/adobe/rum-distiller/compare/v1.7.0...v1.8.0) (2024-11-19)


### Features

* adjust length obfuscation ([#18](https://github.com/adobe/rum-distiller/issues/18)) ([581ef18](https://github.com/adobe/rum-distiller/commit/581ef1835291468ae821febdde6d7e66a5f30ffa))

# [1.7.0](https://github.com/adobe/rum-distiller/compare/v1.6.1...v1.7.0) (2024-11-18)


### Bug Fixes

* **referrer:** classify video referrers, tiktok isn't a social network ([7542981](https://github.com/adobe/rum-distiller/commit/754298175544cf9914f71c3b2822fc7ced761229))


### Features

* **facets:** add enterSource facet, which is based on the referrer classification ([6cbbf55](https://github.com/adobe/rum-distiller/commit/6cbbf55533e7c479cd241efa4fac96ab0978fa06))
* **referrer:** add referrer classification ([ce704c3](https://github.com/adobe/rum-distiller/commit/ce704c361f1f4798d6ea30e9419fd8e362ceedf3))

## [1.6.1](https://github.com/adobe/rum-distiller/compare/v1.6.0...v1.6.1) (2024-11-14)


### Bug Fixes

* respect plainURL contract for domains ([#19](https://github.com/adobe/rum-distiller/issues/19)) ([47a265d](https://github.com/adobe/rum-distiller/commit/47a265d27a15828002437b5885e8c34199f40c7d))

# [1.6.0](https://github.com/adobe/rum-distiller/compare/v1.5.0...v1.6.0) (2024-10-15)


### Bug Fixes

* **series:** target is actually `prerendered` ([d26c5c1](https://github.com/adobe/rum-distiller/commit/d26c5c11c0ef4d053caf7e57e2bc040a86e36011))


### Features

* **series:** redefine page views so that prerenders (that never are turned into navigation events) are no longer counted ([2e54f16](https://github.com/adobe/rum-distiller/commit/2e54f1697715ea52f73821685519eedc64ac50ae))

# [1.5.0](https://github.com/adobe/rum-distiller/compare/v1.4.1...v1.5.0) (2024-10-15)


### Features

* **facets:** add `plainURL` facet that does not try to hide potential PII from URL paths ([d600421](https://github.com/adobe/rum-distiller/commit/d600421fb7d640aad2e32e3f52acf60438bedabd)), closes [#11](https://github.com/adobe/rum-distiller/issues/11)

## [1.4.1](https://github.com/adobe/rum-distiller/compare/v1.4.0...v1.4.1) (2024-10-14)


### Bug Fixes

* **rum-oversight:** unknown filter should return empty set ([#9](https://github.com/adobe/rum-distiller/issues/9)) ([9554e62](https://github.com/adobe/rum-distiller/commit/9554e6213951b7cf803e115fe2a7c14124352c48))

# [1.4.0](https://github.com/adobe/rum-distiller/compare/v1.3.0...v1.4.0) (2024-10-11)


### Bug Fixes

* **facets:** better matching of base64 strings ([b4416d3](https://github.com/adobe/rum-distiller/commit/b4416d3cf3a9375cc13e2445c4039254aaa89c3a))
* **facets:** fix viewmedia checkpoint name ([e4a539c](https://github.com/adobe/rum-distiller/commit/e4a539c0868a5a443dbe8cbf5e72dcd2f7b9a388))


### Features

* **facets:** extract common facets as reusable facet definitions ([2a1428b](https://github.com/adobe/rum-distiller/commit/2a1428b85b6e0d4c227222046740cbb099ba2504))

# [1.3.0](https://github.com/adobe/rum-distiller/compare/v1.2.0...v1.3.0) (2024-10-11)


### Features

* export ttfb series ([3aa0a49](https://github.com/adobe/rum-distiller/commit/3aa0a499faef6cc17c78b56d5c6160ec648f5433))

# [1.2.0](https://github.com/adobe/rum-distiller/compare/v1.1.0...v1.2.0) (2024-10-10)


### Features

* **metrics:** define some standard metrics/series that can be used consistently ([bc888a5](https://github.com/adobe/rum-distiller/commit/bc888a581c9033d7f120317cf447f9f1d069e1ce))
* **series:** redefine engagement based on content engagement and click engagement ([66a5491](https://github.com/adobe/rum-distiller/commit/66a549145f367e306524abc37252d0ea47a02fb7))

# [1.1.0](https://github.com/adobe/rum-distiller/compare/v1.0.0...v1.1.0) (2024-10-08)


### Features

* **index:** allow single entry point in main.js ([3d2df08](https://github.com/adobe/rum-distiller/commit/3d2df08d0c04e17742aa7eafafcb55ac2b6c440a))

# 1.0.0 (2024-10-08)


### Bug Fixes

* allow special domains (not url) ([#618](https://github.com/adobe/rum-distiller/issues/618)) ([eae6a8a](https://github.com/adobe/rum-distiller/commit/eae6a8aba8c6533609c1332dabfce5e68baaa4fc))
* **cruncher:** do not let negative facets affect the values of the mirroring regular facet ([aea3314](https://github.com/adobe/rum-distiller/commit/aea331485897d2a52b6a09a960e31faae9d2c398))
* **cruncher:** keep facet combiners in separate object ([cdf2420](https://github.com/adobe/rum-distiller/commit/cdf24204de128899c07746939bb84663a7792952))
* **number-format:** keep old value, if available ([0340b81](https://github.com/adobe/rum-distiller/commit/0340b818b48f091d4d1c4053c2b75b01ef4a6151))
* **number-format:** update format from content, not title ([3f572a8](https://github.com/adobe/rum-distiller/commit/3f572a8c60a51427d6ccae0ca458a2f6f646f4cc))
* **oversight:** dial back the censorship a bit, one large UK newspaper has really long article names in the URLs ([e6d1e48](https://github.com/adobe/rum-distiller/commit/e6d1e48d182da391153dea3d68e05c105d0f988b))
* **oversight:** disable shift-click on ui facets that have no corresponding negative data facet ([e776316](https://github.com/adobe/rum-distiller/commit/e776316ade870c5a9003f9307ff3e38ee1fc6adf))
* **oversight:** don't break key metrics ([9fed588](https://github.com/adobe/rum-distiller/commit/9fed5887a5f3e3a682cb99fc63cf9726d332ce51))
* **oversight:** fix both cases of numberformat updates ([25a0cff](https://github.com/adobe/rum-distiller/commit/25a0cff43f064d21dd8f0b7317f25be1e231c80e))
* **oversight:** guard against empty iterator ([72965d3](https://github.com/adobe/rum-distiller/commit/72965d35c038776b9fd09da3e18c0c493fc8f81a))
* **oversight:** immedeately bounce back if returnTo has been set ([3413f1e](https://github.com/adobe/rum-distiller/commit/3413f1e2e494a1a78a976a8a36d31cb85831744d))
* **oversight:** improve detection of custom conversion spec ([5477244](https://github.com/adobe/rum-distiller/commit/5477244ed201dad1aaefa9cc8a69448b3126a3e5))
* **oversight:** make list of allowed checkpoints that can be used for facets explicit ([71866d6](https://github.com/adobe/rum-distiller/commit/71866d64db0e4297c7e0c930171be0f62c21e6be))
* **oversight:** more and all links in facets should be next to each other ([89ff159](https://github.com/adobe/rum-distiller/commit/89ff159d52cebd92aecfae6dd3397148580491c8))
* **oversight:** more number format tweaks ([1c3d06a](https://github.com/adobe/rum-distiller/commit/1c3d06a7dd37222c22d48a0da384cdf61392c195))
* **oversight:** more robust default parameters for list view ([36612b2](https://github.com/adobe/rum-distiller/commit/36612b2c7cce07781dc6b5f088cea742fba989e9))
* **oversight:** only report rate ([7f8f66a](https://github.com/adobe/rum-distiller/commit/7f8f66a486e9f64cb48bde09a64e83fcd732af00))
* **oversight:** prevent key metrics from breaking ([d7a0b45](https://github.com/adobe/rum-distiller/commit/d7a0b451350d4cdad1acf0b43bd3c0ca701f8e1b))
* **oversight:** remember the expansion depth of ui facets through a URL parameter ([d5f778c](https://github.com/adobe/rum-distiller/commit/d5f778cadfdef7a1c95653b86c0e2a6aa7cdfbec))
* **oversight:** remove drilldown for traffic source ([690b8e9](https://github.com/adobe/rum-distiller/commit/690b8e909f668e1a79a801bd55b09ace2042234f))
* **oversight:** remove lines from thumbnail facet ([2d7b86e](https://github.com/adobe/rum-distiller/commit/2d7b86e050e217bcc207530dca9712a84c7f7db5))
* **oversight:** remove special handling of utm parameter ([f89f6d0](https://github.com/adobe/rum-distiller/commit/f89f6d0779f5a65ff057966632937f4cf7826a82))
* remove gradient ([#602](https://github.com/adobe/rum-distiller/issues/602)) ([04dbbe0](https://github.com/adobe/rum-distiller/commit/04dbbe0ed483e613fc50cd57ee78eedd22c60d10))
* **rum-explorer:** align all html files ([1bd76b7](https://github.com/adobe/rum-distiller/commit/1bd76b7d9160735b201dc36192bdd6aa4a1fa8ef))
* **rum-explorer:** better format for no conversions ([827f628](https://github.com/adobe/rum-distiller/commit/827f6285082b7e87929889a3376c13535ff7c739))
* **rum-explorer:** better handling of no data ([2bf43ba](https://github.com/adobe/rum-distiller/commit/2bf43bac2387bff0d0219af876e14705bb8a7205))
* **rum-explorer:** control number formatting ([db86545](https://github.com/adobe/rum-distiller/commit/db8654503856801ec4ca905c80cc4c93c7546f1a))
* **rum-explorer:** do not append more and more extras when toggling facets ([d11b288](https://github.com/adobe/rum-distiller/commit/d11b288dafc36ade3843ae9f4b2894fca09202c5))
* **rum-explorer:** guard against bad max precision ([f46f2b3](https://github.com/adobe/rum-distiller/commit/f46f2b3bc2570f4506a73c6c7b3bda9ab60b38eb))
* **rum-explorer:** make sure all custom elements are defined uniformly ([9c6dd69](https://github.com/adobe/rum-distiller/commit/9c6dd696e3557d4bbc6fa270e75247b74b466057))
* **rum-explorer:** use common number formatting in sidebar ([f4e956e](https://github.com/adobe/rum-distiller/commit/f4e956ea8578633d7c9a9b08a2adf69e95c605c8))
* **slicer:** support indeterminate clicks ([1088e33](https://github.com/adobe/rum-distiller/commit/1088e33740d244b7b10d3a4047c170f438ba394b))
* un-matched filter ([#614](https://github.com/adobe/rum-distiller/issues/614)) ([7e08080](https://github.com/adobe/rum-distiller/commit/7e08080cac550ed464d0ec7d0a899be628aa6441))
* **utils:** no more fuzzy math ([09302a0](https://github.com/adobe/rum-distiller/commit/09302a0b6e3ffe7205809a8d9171b8768512e89a))


### Features

* **cruncher:** add support for negative combiners: `none` and `never` ([38bf675](https://github.com/adobe/rum-distiller/commit/38bf675de2c766e2259e020e0c3d18d47fae1e8a))
* **cruncher:** support short hand syntax for both positive and negative facets ([6d9f148](https://github.com/adobe/rum-distiller/commit/6d9f148b5deed7d0ae3f5d5baa7988a17b471ee8))
* defer conversions computation ([44e2af0](https://github.com/adobe/rum-distiller/commit/44e2af0042d4022550fbd2890889baf8e63ce8c9))
* defer CWV loading ([8a7e340](https://github.com/adobe/rum-distiller/commit/8a7e3402706380ec4960bfb152a6ea3b609233bc))
* extract distiller into its own library ([587a004](https://github.com/adobe/rum-distiller/commit/587a004e3fab4449ee6894d57c8e734887fb0779))
* get domain suggestions for url input ([#653](https://github.com/adobe/rum-distiller/issues/653)) ([af3dc48](https://github.com/adobe/rum-distiller/commit/af3dc4842d8e32a198412f3a2d09bcc04691870f))
* **incognito:** bounce back to original URL, if domainkey is available ([4af829b](https://github.com/adobe/rum-distiller/commit/4af829bac483c3a699ff008d95779fb161a01728))
* **list-facet:** allow excluding elements from filter (if negative facet exists) by holding shift while selecting facet value ([85bc5c0](https://github.com/adobe/rum-distiller/commit/85bc5c0157e0fe9ca338fc39bde300f023dbc2cd))
* **list-facet:** better styling for deselected values ([b37fa69](https://github.com/adobe/rum-distiller/commit/b37fa69833549a1b9706a30c4be413e7455110a8))
* **list-facet:** defer metrics calculations ([726f8f6](https://github.com/adobe/rum-distiller/commit/726f8f60bba5643f4472d13e6def436c826c3e51))
* only render the necessary ([08592e8](https://github.com/adobe/rum-distiller/commit/08592e85af344e698d74968a0d534cccc1e644ed))
* **oversight:** add ability to drill down to acquisition source ([b678318](https://github.com/adobe/rum-distiller/commit/b67831865ad2dd8f250135b20118848bdfa58991))
* **oversight:** add trend indicators when looking at date-range chart ([0259b01](https://github.com/adobe/rum-distiller/commit/0259b01850cd119480846a9d13b52e49b8df82c6))
* **oversight:** allow excluding urls from the filter set by specifying a facet in the URL parameters like `&url!=https://example.com/irrelevant` ([50edce5](https://github.com/adobe/rum-distiller/commit/50edce50eb0b14d45c3072bd14fb4a44c9804078))
* **oversight:** bounce shift-clicks to known URL ([fbde0f8](https://github.com/adobe/rum-distiller/commit/fbde0f80895260e89cf1cc497639ef90a9d20c22))
* **oversight:** censor more agressively ([d5d25b3](https://github.com/adobe/rum-distiller/commit/d5d25b3ddbd27cbdcfdc636a6c19b2b8adfbdba0))
* **oversight:** censor numbers, hex codes, base64, and uuids in link facet ([43748f1](https://github.com/adobe/rum-distiller/commit/43748f1ebb72803fa14da150bdbbc412b8c1e569))
* **oversight:** classify incoming traffic by paid, owned, earned in sankey ([bd6c747](https://github.com/adobe/rum-distiller/commit/bd6c747e70f2df4abb38fef8f8352d51ff2f4c86))
* **oversight:** classify traffic acquisition ([97b2a2e](https://github.com/adobe/rum-distiller/commit/97b2a2edc69cebff5f8146168e1b07acdcc02d90))
* **oversight:** display traffic sources ([ea93e48](https://github.com/adobe/rum-distiller/commit/ea93e485de2a57eadcd6ee11d9f89b23f8cd498e))
* **oversight:** distinguish between engaged and converted ([1633434](https://github.com/adobe/rum-distiller/commit/1633434eb35a64ed72ebaddbe2aaea5606148501))
* **oversight:** enable negative facets for user agent and checkpoint ([67cd4d8](https://github.com/adobe/rum-distiller/commit/67cd4d85adaa5117c864ef5ac1b3f0b1144c5d6c))
* **oversight:** hide common prefixes in list facet ([3013303](https://github.com/adobe/rum-distiller/commit/301330373478d83ac1e4b22288460aaa4da829c0))
* **oversight:** improve detection of earned and owned in sankey diagram ([cec1402](https://github.com/adobe/rum-distiller/commit/cec1402579e9980e3eeb5cf5dd6a2ca8236e8d5a))
* **oversight:** list additional known consent vendors ([0fa1152](https://github.com/adobe/rum-distiller/commit/0fa1152a7a957ae690e20a87125a6bac934fd495))
* **oversight:** nicer labels for hosttype ([31c4367](https://github.com/adobe/rum-distiller/commit/31c43676a34f144235b3d43524effb41bf648768))
* **oversight:** prettier pie charts, with more functionality ([39e333c](https://github.com/adobe/rum-distiller/commit/39e333ccf59b95dd049c60189996e2fb971eaf02))
* **oversight:** re-classify consent clicks ([c68c5cd](https://github.com/adobe/rum-distiller/commit/c68c5cd6ccb293b8fc20a12a75f454491044e18b))
* **oversight:** reclassify consent clicks as “not clicks” ([4563e27](https://github.com/adobe/rum-distiller/commit/4563e277c99c01d8bad5a65de51f81ee9b7d07bc))
* **oversight:** report engagement rate by default ([ba9813a](https://github.com/adobe/rum-distiller/commit/ba9813ab3345beaaba0636b4c006f2acbe0d3eb8))
* **oversight:** set trampoline URL to production URL ([6c07558](https://github.com/adobe/rum-distiller/commit/6c075588f79ce9f58768b9474884c5741627aed8))
* **oversight:** show / if there is nothing left but the prefix ([ea36d16](https://github.com/adobe/rum-distiller/commit/ea36d160bd3bbf1d8c7d66abe53e0320e45ac9e2))
* **oversight:** show LCP facet ([51dd079](https://github.com/adobe/rum-distiller/commit/51dd07942ef6feb9cc3095d89b69b2b8abba7573))
* **oversight:** show that iOS CWVs are fake ([f111d7e](https://github.com/adobe/rum-distiller/commit/f111d7e1f1d4f52f4ec568287ebf866c0fd36d23))
* **oversight:** store return token and refresh ([cd87867](https://github.com/adobe/rum-distiller/commit/cd87867a42ee16f09f51e5d1a80de073cfc01a32))
* remove unuset focus in oversight ([#613](https://github.com/adobe/rum-distiller/issues/613)) ([50b93e2](https://github.com/adobe/rum-distiller/commit/50b93e20514fee7254a2c7d31eff6b93e4523b1b))
* **rum-explorer:** allow setting exact start and end dates ([9b4e794](https://github.com/adobe/rum-distiller/commit/9b4e79485eb8c08dea8b99fcb5a7cc333ec7eb93))
* **rum-explorer:** improve applyFilter ([8115728](https://github.com/adobe/rum-distiller/commit/811572890d58ae89fe7bf9449a2a52af900ae0a7))
* **rum-explorer:** improve get totals by replacing a reduce with a copy ([e092298](https://github.com/adobe/rum-distiller/commit/e0922982326cdac2cff645223b86a8bda560ef93))
* **rum-explorer:** improve matching in consent ([965e7c5](https://github.com/adobe/rum-distiller/commit/965e7c5ea98f9e73cdf4d37f4cd4a874ac30e90e))
* **rum-explorer:** improve reduce in skyline ([537bc59](https://github.com/adobe/rum-distiller/commit/537bc59a3e281e3cdad3d3e2ca0c6edd340f5546))
* **rum-explorer:** show TTFB as secondary metric to LCP ([ff9b842](https://github.com/adobe/rum-distiller/commit/ff9b8424c233049232cd6da664d6a1fcf3ed4412))
* **rum-explorer:** split draw from loadData ([8fa3564](https://github.com/adobe/rum-distiller/commit/8fa3564cc114a28033f969d30ca95df9c471dd09))
* **rum-explorer:** ui tweaks ([#619](https://github.com/adobe/rum-distiller/issues/619)) ([0c318f3](https://github.com/adobe/rum-distiller/commit/0c318f3c02fac92921ef5e0c053023e291750169))
* **rum-explorer:** unroll scoreCWV loop in util ([fa7251c](https://github.com/adobe/rum-distiller/commit/fa7251c306a05252af3241d8bae958a7a5d3ba4b))
* **rum-explorer:** use find instead of reduce in acquisition ([2de2e8b](https://github.com/adobe/rum-distiller/commit/2de2e8b82da92d0c002bda08a3b1cdffec9be27d))
* **rum-oversight:** cleanup backport ([#610](https://github.com/adobe/rum-distiller/issues/610)) ([7d193f8](https://github.com/adobe/rum-distiller/commit/7d193f835b5d6d0a71e2ca1f9354b5b806cc686e))
* **rum-oversight:** host type facet ([#623](https://github.com/adobe/rum-distiller/issues/623)) ([5d1e598](https://github.com/adobe/rum-distiller/commit/5d1e59834f1498225e7abf3e7bcd1ecf8d98228c))
* **rum:** add org aggregate handling ([#642](https://github.com/adobe/rum-distiller/issues/642)) ([21e9d5b](https://github.com/adobe/rum-distiller/commit/21e9d5b953118af1541811714c746aec867b8a13))
* **thumbnail-facet:** show filename ([12c2d22](https://github.com/adobe/rum-distiller/commit/12c2d223c37e48ae51227f628a75bc04b7ae89c9))


### Reverts

* Revert "fix(rum-explorer) cache network calls to bundles" ([49e8fac](https://github.com/adobe/rum-distiller/commit/49e8fac5d4754d0735480183a6d9c7b434d239e8))
* Revert "fix(rum-explorer) keep cached between views" ([61d7f9d](https://github.com/adobe/rum-distiller/commit/61d7f9d61205aca9f3902c2f9686abc7f4707a6d))
* Revert "fix(rum-explorer) no need to iterate over all events" ([8cfb5cc](https://github.com/adobe/rum-distiller/commit/8cfb5ccf01c1479e2717d83ea4a8d0c60a083333))
