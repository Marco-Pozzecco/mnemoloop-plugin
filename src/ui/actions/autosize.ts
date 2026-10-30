/**
 * Grows a textarea with its content, so the field never scrolls internally.
 *
 * Clearing the inline height first restores the browser's `rows` height; the
 * content can only make the field taller than that. The border is added back
 * because `scrollHeight` measures the padding box, not the border box.
 */
export function resizeTextarea(node: HTMLTextAreaElement): void {
	const border = node.offsetHeight - node.clientHeight;
	// Clearing the inline height restores the browser's `rows` height, which is
	// the floor for a short field.
	node.style.removeProperty('height');
	node.style.height = `${Math.ceil(node.scrollHeight + border)}px`;
}

/**
 * Svelte action wrapping {@link resizeTextarea}.
 *
 * The parameter is the field value: Svelte re-runs `update` whenever it
 * changes, so a programmatic write (edit-mode seeding, a card-type switch)
 * remeasures as well as typing.
 */
export function autosize(node: HTMLTextAreaElement, _value = '') {
	resizeTextarea(node);

	let width = node.clientWidth;

	// A width change (orientation, window resize) rewraps the text. Remeasure on
	// width only: observing the height we just wrote would re-trigger itself.
	const observer = new ResizeObserver(() => {
		if (node.clientWidth === width) return;
		width = node.clientWidth;
		resizeTextarea(node);
	});
	observer.observe(node);

	return {
		update(): void {
			// The action's update can run before the element's `value` property is
			// written in the same flush; the microtask measures after it.
			queueMicrotask(() => resizeTextarea(node));
		},
		destroy(): void {
			observer.disconnect();
		},
	};
}
