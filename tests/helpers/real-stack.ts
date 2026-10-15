import { IEventRegistryDependencies } from '@/interfaces/IEventRegistry';
import { EventBus, EventRegistry, IndexRouter } from '@/modules/events';
import { FlashcardAdapter } from '@/modules/adapters/FlashcardAdapter';
import { SettingsAdapter } from '@/modules/adapters/SettingsAdapter';
import { StatisticsAdapter } from '@/modules/adapters/StatisticsAdapter';
import { FlashcardIndexer } from '@/modules/indexers/FlashcardIndexer';
import { FlashcardBasicContentParser } from '@/modules/parsers/content/FlashcardBasicContentParser';
import { FlashcardClozeContentParser } from '@/modules/parsers/content/FlashcardClozeContentParser';
import { FlashcardOcclusionContentParser } from '@/modules/parsers/content/FlashcardOcclusionContentParser';
import { FlashcardQuizContentParser } from '@/modules/parsers/content/FlashcardQuizContentParser';
import { FlashcardSequenceContentParser } from '@/modules/parsers/content/FlashcardSequenceContentParser';
import { FlashcardParser } from '@/modules/parsers/entity/FlashcardParser';
import { FlashcardWriter } from '@/modules/writers/FlashcardWriter';
import { IContentParser } from '@/interfaces/parser/IContentParser';
import { FlashcardContent } from '@/schemas';
import { AdapterKey, Adapters } from '@/types/adapters';
import { IndexKey, Indexes } from '@/types/indexes';
import { ParserKey, Parsers } from '@/types/parsers';
import { WriterKey, Writers } from '@/types/writers';
import {
	createRealPlugin,
	createRealVault,
	type RealStackFixture,
	type RealStackOptions,
	type RealVault,
} from './real-vault';
import { resetSingletons } from './reset-singletons';

export type { RealStackFixture, RealStackOptions, RealVault } from './real-vault';

/**
 * Wires the production adapters, parsers, indexer, writer and event registry
 * against an in-memory vault. Browser-safe: no `vitest`, no Node builtins, so
 * the playground can boot through exactly the same object graph the tests use.
 */

export interface RealStack {
	vault: RealVault;
	plugin: any;
	settings: any;
	statistics: any;
	flashcardAdapter: any;
	parser: any;
	indexer: any;
	writer: any;
	bus: any;
	registry: any;
	dispose(): void;
}

export async function buildRealStack(
	fixture: RealStackFixture,
	opts: RealStackOptions = {},
): Promise<RealStack> {
	if (opts.resetEventSingletons !== false) resetSingletons();
	const vault = createRealVault(fixture, opts);
	const plugin = createRealPlugin(vault, fixture);
	const settings = new SettingsAdapter(plugin);
	const statistics = new StatisticsAdapter(plugin);
	const flashcardAdapter = new FlashcardAdapter(plugin);
	const adapters: Adapters = new Map<AdapterKey, any>([
		[AdapterKey.settings, settings],
		[AdapterKey.statistics, statistics],
		[AdapterKey.flashcard, flashcardAdapter],
	]);
	const contentParsers: IContentParser<FlashcardContent>[] = [
		new FlashcardBasicContentParser(settings) as IContentParser<FlashcardContent>,
		new FlashcardSequenceContentParser(settings) as IContentParser<FlashcardContent>,
		new FlashcardQuizContentParser(settings) as IContentParser<FlashcardContent>,
		new FlashcardClozeContentParser(settings) as IContentParser<FlashcardContent>,
		new FlashcardOcclusionContentParser() as IContentParser<FlashcardContent>,
	];
	const parser = new FlashcardParser(plugin, contentParsers);
	const parsers: Parsers = new Map([[ParserKey.flashcard, parser]]);
	const indexer = new FlashcardIndexer(parser, flashcardAdapter, settings);
	const indexes: Indexes = new Map([[IndexKey.flashcard, indexer]]);
	const writer = new FlashcardWriter(plugin, parser);
	const writers: Writers = new Map([[WriterKey.flashcard, writer]]);
	const bus = EventBus.instance;
	const dependencies: IEventRegistryDependencies = {
		plugin,
		bus,
		adapters,
		indexes,
		parsers,
		writers,
	};
	const registry = new EventRegistry(bus, dependencies, IndexRouter);
	registry.initialize();

	return {
		vault,
		plugin,
		settings,
		statistics,
		flashcardAdapter,
		parser,
		indexer,
		writer,
		bus,
		registry,
		dispose: () => {
			registry.dispose();
			bus.clearTap();
		},
	};
}
