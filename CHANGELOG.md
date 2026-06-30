## [1.5.0](https://github.com/Marco-Pozzecco/mnemoloop-plugin/compare/1.4.0...1.5.0) (2026-06-30)

### Features

* add analytics review section with sessions chart ([b96b649](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/b96b649740a33fd4b5be4fa15140b382bc571069))
* add Analytics view with controller and store ([c2dad83](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/c2dad8383d88e2e4647382b1b11a640cd16949d4))
* add get adapter event handlers for flashcard, settings, and statistics ([bf091c9](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/bf091c955db0d01d6c1c8f288de1d5891ba736f1))
* add Navbar section component ([7d4b5e6](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/7d4b5e604e5891b56e439619d3a0765441de3188))
* add NavigationMenu element component ([757d93b](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/757d93b6e54d56c80f6ff3588c252c0596046bcb))
* add sessions calendar heatmap chart component ([b3c7f4d](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/b3c7f4db21ad1fb264816667e2e6834c04ffb2e4))
* add total_reviews counter to flashcard statistics ([e9b2c8f](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/e9b2c8f9b01896964162ce48cdb992b6bb6819c3))
* extract stats from parse results and add NotFoundError ([1c2a774](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/1c2a774da9cc263e78738f0880f2a438a02f431f))

### Bug Fixes

* correct syntax errors in analytics review component ([3733496](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/3733496f66e232e35c78766960d5c5e3b4c8948d))
* correct vault.fileMap access in FlashcardAdapter test ([6e22459](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/6e224594c949b8f195c60b632eb88d6ed26f37fa))
* handle null stats in sessions chart with empty state ([ae52661](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/ae52661c0fdbac260811565a84ee426a3f0640a3))

## [1.4.0](https://github.com/Marco-Pozzecco/mnemoloop-plugin/compare/1.3.1...1.4.0) (2026-06-21)

### Features

* add debug command to bulk-create test flashcards ([e594ac1](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/e594ac1eb308457acc0a2727f0c8f76ee2bf12d7))

### Bug Fixes

* correct banner-store test initial state type ([97a5f3d](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/97a5f3db2cf92add1338f1af389c812dbe2da433))
* defer VaultWatcher initialization until layout ready ([75607d0](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/75607d066e394f35b2e48fa4ffa027896f94fd98))
* improve heatmap cell rendering and add review count subtitle ([e4e1c90](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/e4e1c9036645fa32c1e5bbef0ffc027ed9c8baf9))

## [1.3.1](https://github.com/Marco-Pozzecco/mnemoloop-plugin/compare/1.3.0...1.3.1) (2026-06-15)

### Bug Fixes

* use console.debug for info-level logging ([67b5e90](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/67b5e90cfe2b98635240dad1225ecf07157976a0))

## [1.3.0](https://github.com/Marco-Pozzecco/mnemoloop-plugin/compare/1.2.1...1.3.0) (2026-06-15)

### Features

* add Banner notification system ([d5b72e6](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/d5b72e650b5035bde31282ba1ba5095851549d5c))
* add icon variant to Button ([a39dac4](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/a39dac428f8e90080b43fcc8598ca8319c7e7be1))

### Bug Fixes

* lint ([68abb98](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/68abb98330396a9d2e2827afa0f227529bcd2d23))

## [1.2.1](https://github.com/Marco-Pozzecco/mnemoloop-plugin/compare/1.2.0...1.2.1) (2026-06-12)

### Bug Fixes

* remove unnecessary await on adapter reset calls ([00cb359](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/00cb359683c0f558a7d63e2ef73305c0a7aa3766))
* resolve type-checked eslint violations ([d6bd857](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/d6bd8576d369a15a605fe82ed162b63bd5962287))

## [1.2.0](https://github.com/Marco-Pozzecco/mnemoloop-plugin/compare/1.1.0...1.2.0) (2026-06-12)

### Features

* add python script for manifest version sync ([8ece036](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/8ece036fc02c7ddf1c1fb94a0acb534d4d35d313))

### Bug Fixes

* order semantic-release plugins so npm bumps version before exec copies it ([4560f03](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/4560f036165d503c0206c871d9d61ba6b0baa094))

## [1.1.0](https://github.com/Marco-Pozzecco/mnemoloop-plugin/compare/1.0.2...1.1.0) (2026-06-12)

### Features

* add action enums for adapters, indexes, and parsers ([a32565c](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/a32565cffea6a94b32697cf724c7bc7ccfa57431))
* add automatic timestamp defaults to FlashcardIndexer metadata ([b8f5aa4](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/b8f5aa4bf23eacf394afd7792555c6c561f32f10))
* add configurable tooltipPosition to Slider component ([00ba1c0](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/00ba1c0fc70e5c20d3177ba2a753b5e70a4b4eb3))
* add core event routing infrastructure ([cbc7844](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/cbc7844608e511367432c5c312cc28bc8d1c448c))
* add event emitters ([a23ed86](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/a23ed8663eacc37f57d568fa89ff024d033478e4))
* add EventRequest and EventResponse base classes ([33a701a](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/33a701a3620eeb3334a33fa0a63501e59a400e83))
* add flashcard adapter event handlers ([4828c12](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/4828c12976a4c2a73c529a968e822ec3bd4fcd36))
* add FlashcardStatisticsComputeEvent and export it ([acad2d5](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/acad2d5bcaa1fb2e4fa3ee82a04bf884edd42c13))
* add FSRS parameter configuration ([2e81317](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/2e81317971c41e5a7932b66542ac1bccbc5140c5))
* add optional tooltip to Slider component ([aaf0123](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/aaf012302732ad49921f009852bd784106138dd8))
* add semantic-release configuration ([7942164](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/7942164bec999474b191ec8f883bb9c0a69f18c3))
* add state events and update event handlers ([5d50d4c](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/5d50d4cfb3a7541a92ff7efc10d3639d00e1d9b0))
* add tooltip to retention rate slider and update label ([44564a9](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/44564a975ba17f5dd08ea95ea669a452b2dacc80))
* add writers support to EventHandler base class ([9bdb474](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/9bdb47441dfc87a863ee28ce998bba2f5b16e38f))
* **events:** introduce EventFactory for dynamic event class creation ([da99d21](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/da99d2180fe4f756c211b2f3d584ad1a5ea75210))
* improve deck tree with uncategorized support and auto-expand ([e6db1cd](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/e6db1cd016c2067af2695084729b7b880d8ff0b8))
* integrate writers and event bus into plugin lifecycle ([069b439](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/069b439be38fe2c982a8763c54b436d6926d5c3e))
* introduce flashcard event handlers ([7ed8a1c](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/7ed8a1ce8653bf1b323c19899a2d4471b01162ef))
* introduce settings event handlers ([3c5dc2d](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/3c5dc2d96a3d083d77fa1717eb515777ab58b215))
* introduce statistics event handlers ([fd5908c](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/fd5908cfd92d8b27557be6663077cd516e40bdff))
* migrate domain events from processors to handlers ([5334c96](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/5334c96ef1972a4f1a933a09aa4d26bc0941038c))
* publish StatisticsAdapterStateEvent on adapter and compute operations ([2539148](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/25391481acdffca8ac842c180f56666678457840))
* refactor event bus to use EventClass for type-safe subscriptions ([5977b29](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/5977b29f985d6150f7644dca9d56ca5a1190c33b))
* refactor plugin initialization to use event-based adapter and index setup ([f233309](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/f233309454eb888805abd427624dc0ca62b6b433))
* reorganize event domains into per-domain directories ([e484056](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/e484056770dd739d46fea2299ed898c8e7f90a31))
* strip unknown frontmatter keys using schema shape ([4ac6e19](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/4ac6e19c2f9e20bc4cb6a478f68c23c55580f3bd))

### Bug Fixes

* bind event handler methods and prevent double initialization ([0292fbf](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/0292fbf1e78f7aa0fc9df4d3390266ce1e2cc1ff))
* configure svelte-preprocess to use tsconfig.svelte.json ([12b7618](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/12b7618b7aed665b16e7871d4f99002bfed915a2))
* correct semantic-release tag format and draft release key ([78a9f13](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/78a9f1386f4899feb5df17a2d80319cdf1e85cdf))
* handle parser error results across downstream consumers ([61463bf](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/61463bf9c1564c4515e51e92cbc1d6a35717a08d))
* include filepath in FlashcardWriterBodyEvent payload ([ee6198e](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/ee6198e4c63828cda9d6d23bcd20adb109e4ab57))
* migrate to fsrs.next API ([04c4a4e](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/04c4a4e4a4597f95c9fca3ebece17e2eeaef90b3))
* resolve @typescript-eslint/no-unused-expressions in BaseAdapter.ts ([77f7f69](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/77f7f697cfbddaf4af4d5abaaece08cd7c62dac5))
* resolve sourceMap conflict in tsconfig.svelte.json ([278f994](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/278f99427a24bfa095d66813a2c902b75f986e94))
* use default values for corrupted paths in BaseAdapter recovery ([927de79](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/927de799f50c602d37a55b96382916bbea9427e7))
* use FlashcardYamlSchema.parse in review session score handler ([f4c0a83](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/f4c0a8322644344695e54a87e6b08416c390516d))
* use partial deck matching for deck filter ([8117378](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/81173782366b5c098002d7214ec72606d9746ca5))
