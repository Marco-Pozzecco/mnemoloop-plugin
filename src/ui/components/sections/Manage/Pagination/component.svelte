<script lang="ts">
	import { Button } from '@/ui/components/elements';
	import type ManagePaginationProps from './types';

	let {
		currentPage,
		totalPages,
		totalItems = 0,
		pageSize = 25,
		onPageChange,
		onPrevious,
		onNext,
		className,
	}: ManagePaginationProps = $props();

	const safeTotalPages = $derived(Math.max(1, totalPages));
	const safePageSize = $derived(Math.max(1, pageSize));
	const safeTotalItems = $derived(Math.max(0, totalItems));
	const safeCurrentPage = $derived(
		Math.min(Math.max(1, Math.floor(Number.isFinite(currentPage) ? currentPage : 1)), safeTotalPages),
	);
	const rangeStart = $derived(
		safeTotalItems === 0 ? 0 : (safeCurrentPage - 1) * safePageSize + 1,
	);
	const rangeEnd = $derived(
		safeTotalItems === 0
			? 0
			: Math.min(safeCurrentPage * safePageSize, safeTotalItems),
	);

	// This writable derived value follows parent page changes while still allowing
	// users to type a candidate page before pressing Go.
	let pageInput = $derived(String(safeCurrentPage));

	function goToPage(rawPage: number): void {
		const page = Math.min(Math.max(1, Math.floor(Number.isFinite(rawPage) ? rawPage : safeCurrentPage)), safeTotalPages);
		onPageChange?.(page);
	}

	function goPrevious(): void {
		if (onPageChange) goToPage(safeCurrentPage - 1);
		else onPrevious?.();
	}

	function goNext(): void {
		if (onPageChange) goToPage(safeCurrentPage + 1);
		else onNext?.();
	}

	function handlePageInput(event: Event): void {
		pageInput = (event.currentTarget as HTMLInputElement).value;
	}

	function submitPage(): void {
		const parsed = Number(pageInput.trim());
		goToPage(Number.isFinite(parsed) ? parsed : safeCurrentPage);
	}

	function handleSubmit(event: SubmitEvent): void {
		event.preventDefault();
		submitPage();
	}

	function handlePageKeydown(event: KeyboardEvent): void {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		submitPage();
	}
</script>

<nav class="ml-manage__pagination {className ?? ''}" aria-label="Pagination">
	<div class="ml-manage__pagination-summary" aria-live="polite">
		Showing {rangeStart}–{rangeEnd} of {safeTotalItems}
	</div>
	<div class="ml-manage__pagination-controls">
		<Button
			variant="secondary"
			size="small"
			disabled={safeCurrentPage <= 1}
			ariaLabel="First page"
			onclick={() => goToPage(1)}
		>
			First
		</Button>
		<Button
			variant="secondary"
			size="small"
			disabled={safeCurrentPage <= 1}
			ariaLabel="Previous page"
			onclick={goPrevious}
		>
			Previous
		</Button>
		<span class="ml-manage__page-info">Page {safeCurrentPage} of {safeTotalPages}</span>
		<Button
			variant="secondary"
			size="small"
			disabled={safeCurrentPage >= safeTotalPages}
			ariaLabel="Next page"
			onclick={goNext}
		>
			Next
		</Button>
		<Button
			variant="secondary"
			size="small"
			disabled={safeCurrentPage >= safeTotalPages}
			ariaLabel="Last page"
			onclick={() => goToPage(safeTotalPages)}
		>
			Last
		</Button>
	</div>
	<form class="ml-manage__page-jump" onsubmit={handleSubmit}>
		<label for="ml-manage-page-number">Page</label>
		<input
			id="ml-manage-page-number"
			type="number"
			min="1"
			max={safeTotalPages}
			inputmode="numeric"
			aria-label="Page number"
			value={pageInput}
			oninput={handlePageInput}
			onkeydown={handlePageKeydown}
		/>
		<Button type="submit" variant="secondary" size="small">Go</Button>
	</form>
</nav>

<style lang="scss">
	@use 'tokens' as *;

	.ml-manage__pagination {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: $spacing-sm $spacing-md;
	}

	.ml-manage__pagination-summary,
	.ml-manage__page-info {
		font-size: $font-sm;
		color: $text-muted;
		white-space: nowrap;
	}

	.ml-manage__pagination-controls,
	.ml-manage__page-jump {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
	}

	.ml-manage__page-jump label {
		font-size: $font-sm;
		color: $text-muted;
	}

	.ml-manage__page-jump input {
		box-sizing: border-box;
		width: 4.5rem;
		min-height: 32px;
		padding: $spacing-xs;
		font-family: inherit;
		font-size: $font-sm;
		color: $text-normal;
		background-color: $background-primary;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-input;
	}

	.ml-manage__page-jump input:focus {
		outline: none;
		border-color: $interactive-accent;
		box-shadow: 0 0 0 2px $background-modifier-border-focus;
	}

	@media (pointer: coarse) {
		.ml-manage__page-jump input {
			min-height: 44px;
		}
	}

	@media (max-width: 480px) {
		.ml-manage__pagination {
			align-items: stretch;
			flex-direction: column;
			gap: $spacing-sm;
		}

		.ml-manage__pagination-summary,
		.ml-manage__page-jump {
			justify-content: center;
		}

		.ml-manage__pagination-controls {
			justify-content: center;
			flex-wrap: wrap;
		}
	}
</style>
