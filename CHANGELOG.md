## [1.8.0](https://github.com/Marco-Pozzecco/mnemoloop-plugin/compare/1.7.0...1.8.0) (2026-08-20)

### Features

* **a11y:** improve management table semantics ([bf24f67](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/bf24f6735aed226bfde5eea5e31f85e47058b60b))
* add editable flashcard management table ([5381188](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/5381188f303ee1f14e2be23b261a941abda2bc17))
* add flashcard management filters and result states ([0036fed](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/0036fed38d8c9be54318f00031fa5533eb765b5e))
* add flashcard management navigation view ([421a7a1](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/421a7a1ca4413b2c097c82060701cc0df76cc36d))
* add flashcard management state and controller ([879c1e0](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/879c1e081af11cc2757b00f520c052f1fd606f38))
* add reusable Chip component ([c749df8](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/c749df860daca0886496f03902d998b76dab4219))
* add reusable combobox components ([0fa5c54](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/0fa5c543d94867c104b3ecd265eb4466735e5fdf))
* add reusable table components ([b37165d](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/b37165de858d402d67c07b0a694a19e2b8904d7c))
* **events:** mark linked flashcards stale ([1026ea7](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/1026ea7aeed242dd6265f41ca7a242128f41cab2))
* **manage:** add searchable filters and pagination controls ([002ef3d](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/002ef3df9be82049bcb4978108a59e92af6c5736))
* **settings:** add source-note watch configuration ([916dfcb](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/916dfcbd924e9ce97a4aaecda62eed3efc89d72a))
* **ui:** add alert dialog and delete confirmation ([a8e6b85](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/a8e6b85f664ff89f5c5f0088bcfff47f8d5e6e96))
* **ui:** add source-note settings controls ([72e1389](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/72e1389447d57c351497db1091c81495332b375a))
* **ui:** improve combobox accessibility and anchoring ([71e81bd](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/71e81bd46f7208fa43495b6b1b68166db1668d3e))
* **watcher:** publish source-note modification events ([76b7153](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/76b71531551be68d562978ce3835b3ddd5e01e5d))

### Bug Fixes

* lint ([ac08f98](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/ac08f98305d7a4c4fc31fbc2b937dfb9768b5e42))
* **manage:** reconcile metadata and deletion outcomes ([9a70ed3](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/9a70ed3d7b54a38ad7cef91807bf29f8a2de26c3))
* replace settings-items-padding variable with fixed value ([ddd1eeb](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/ddd1eeb96862611b2d0913adfade28242ccb884c))

### Performance Improvements

* improve eslint execution time ([96eebab](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/96eebabddb6f05baa3de5ebc4c0897f25ab5a366))

## [1.7.0](https://github.com/Marco-Pozzecco/mnemoloop-plugin/compare/1.6.0...1.7.0) (2026-08-03)

### Features

* add Button icon support, cn utility, and class API ([007e10d](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/007e10dac1bf9e9e09200f256d6d7744186d3e83))
* add cloze content component and wire into review flow ([9a1084f](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/9a1084fd10059bc9935e2801dffce4479f17bf11))
* add cloze deletion card type schema ([26aad5d](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/26aad5d51d03e0782e9964447fd7ba4fc6af4a77))
* add Combobox component and open file after flashcard save ([90399af](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/90399aff31a041e7f34ef8692e9468b9c0013dac))
* add decks field to flashcard writer create event ([09189a5](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/09189a5db2bd8a789631e585b8977c7efcf0e305))
* add displayAs slot to Select for custom trigger labels ([17aa94a](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/17aa94a1bf51737a268b1acfc639de4f5bbf5151))
* add FlashcardClozeContentParser ([140df6c](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/140df6ca031e7f1973f05844dfa7fcf4cc1b04a4))
* add FormField and Textarea shared UI components ([b0ef817](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/b0ef817dd3ec35a93364a153925178ade2063394))
* add multi-card-type support with discriminated union schemas ([788dc24](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/788dc24b486c9c74864d97b9ef9b3e7e3f0f0eb4))
* add per-card-type Review UI subcomponents ([5c26b91](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/5c26b91b137cb11331e8153a3f169fb4ab595c01))
* add question field to sequence flashcards ([60c99c7](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/60c99c740f71f790f3e901d9f9d9c171f261af8a))
* add Quiz flashcard card type ([111e522](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/111e5222ac11d8595e2f9a6163e0919e8645cdbf))
* add recovery warnings and multi-round field recovery ([4b90371](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/4b903715dff8594a323e29106a5d6cf94302fe59))
* add ReviewItemFactory and SequenceReviewItem for multi-card-type review ([6ba0b55](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/6ba0b55162b634077bd28972e94535245869c102))
* add Tooltip component ([68849da](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/68849da86d039a4b3afe0904aacd30fb7920083c))
* add Uncategorized deck filter to dashboard controller ([239c24a](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/239c24a9e20a2831564b7703845e7900a4ec55ab))
* redesign flashcard form modal with tabs and submit-aware state ([be1caa0](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/be1caa095cc17375f64768d653334062e27ee078))
* replace FlashcardModal with multi-type FlashcardFormModal ([e645dc9](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/e645dc960c731cc6d9368cec4399874d8c67333b))
* support multiple decks in flashcard form modal ([9f5c50f](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/9f5c50fa4b39275989d75dc2d90a6938d28512b2))

### Bug Fixes

* add create debounce and ctime threshold to VaultWatcher ([f073990](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/f073990dffc7b6d170524d7d9f666222e566d84b))
* add file existence checks and timestamps to flashcard indexer ([dd688b0](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/dd688b0eb2c2a9cd0d6f634e24252b8073fd29c3))
* correct SCSS variable references for error and warning colors ([16a8f44](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/16a8f442566bc34623a1ca7e0065b6aa910fd477))
* default decks field to empty array in flashcard schema ([42c5ea5](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/42c5ea59e1baf222a116e8c4536848150d09e4ba))
* export FlashcardClozeRegex and fix Cloze SvelteSet init ([5ca3060](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/5ca3060c7005f49444f825ab2278127ce31175dc))
* hide navbar during review; remove DangerZone from settings ([fa90f2c](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/fa90f2c516479774596634ab554cd6b6fb9982c9))
* match dashboard deck filter by prefix instead of substring ([e3e1fec](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/e3e1fec66afac9ea6a10c0718ef80bf716aefdc4))
* parse entity.content instead of entity in FlashcardParser ([e27cd8e](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/e27cd8eee4a0c90818a6e3c29e20fc57b809e9f3))
* preserve existing frontmatter in FlashcardYamlParser recovery ([f9c2bd8](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/f9c2bd86c4ca2bc5c5f0177c943334ce96d20d4f))
* remove redundant $state wrapper on SvelteSet initialization ([7787972](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/7787972feeedad4d81abed06c76171e24d039c20))
* remove unused import ([28a3d67](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/28a3d67892fe851477c919359832a296d5697a6a))
* remove wiki-link wrapping from flashcard source field ([84003d4](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/84003d47ce9e43c6ed35cf42f6c704bd9de6146e))
* rename Input className prop to class for Svelte 5 ([0e2f8fe](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/0e2f8fef81fa47057909b676ba8208f877b841e6))
* span flashcard form labels across full grid width ([4820ed2](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/4820ed2008f6a5d862ad10b909d1e9071379257e))

## [1.6.0](https://github.com/Marco-Pozzecco/mnemoloop-plugin/compare/1.5.0...1.6.0) (2026-07-06)

### Features

* add disk-backed event logging adapter ([b3bc34d](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/b3bc34d3217279d83df6e03c0197f5a5c7f57785))
* add EventBus tap side-effecting sink ([6731e92](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/6731e928e1a6faa4f9213c4506a56478c1bab2e5))
* add Obsidian theme token utility ([a75f90e](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/a75f90e5df4c6894d0bd63bcc8324094e304c6b6))

### Bug Fixes

* add getAll flashcards support for dashboard polling ([feb07cb](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/feb07cb86420ea4eb487577eef4c5ce645833620))
* return error result instead of throwing in FlashcardParser ([112302a](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/112302a2b523b24d591c0b3e7897a1348b59d557))
* set default log level to ERROR ([f00f67f](https://github.com/Marco-Pozzecco/mnemoloop-plugin/commit/f00f67fa90f24098e9acb0e61da3626978f790e7))

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
