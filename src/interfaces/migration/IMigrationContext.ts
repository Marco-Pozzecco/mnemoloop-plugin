/**
 * Buffered view of the persisted documents available to a single migration run.
 *
 * The three methods mirror {@link IDocumentStore} on purpose, but the two
 * interfaces are deliberately unrelated: `write` and `remove` only buffer
 * changes in memory (synchronous), while `IDocumentStore` performs I/O
 * immediately (asynchronous). Buffered changes become durable only when the
 * runner commits the context, which is also what keeps a failed run from
 * touching the stored documents.
 */
export interface IMigrationContext {
	/** Reads a document, including changes already buffered by this run. */
	read(name: string): Promise<unknown>;

	/** Buffers a replacement for `name` until the runner commits. */
	write(name: string, data: unknown): void;

	/** Buffers the removal of `name` until the runner commits. */
	remove(name: string): void;
}
