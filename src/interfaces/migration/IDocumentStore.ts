/**
 * Reads and writes the plugin's persisted JSON documents by document name.
 *
 * A missing document is reported as `undefined`: implementations must not throw
 * for absence. Document names are the constants in
 * `@/modules/migrations/documents`.
 */
export interface IDocumentStore {
	/** Reads a document. Resolves to `undefined` when the document is absent. */
	read(name: string): Promise<unknown>;

	/** Writes a document, replacing any existing content. */
	write(name: string, data: unknown): Promise<void>;

	/** Removes a document. Removing an absent document is a no-op. */
	remove(name: string): Promise<void>;
}
