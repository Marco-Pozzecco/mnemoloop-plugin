/**
 * Names of the JSON documents the migration module reads and writes.
 *
 * `PluginDocumentStore` maps every name to its storage location, and migrations
 * use these constants instead of string literals so a name change is a single
 * edit.
 */
export const DATA_FILE = 'data.json' as const;
export const FLASHCARD_INDEX_FILE = 'flashcard-index.json' as const;
export const EVENT_LOG_FILE = 'event-log.json' as const;
export const LEGACY_STATISTICS_FILE = 'statistics.json' as const;
