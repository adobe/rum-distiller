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
