<script lang="ts">
	import { Button } from '@/ui/components/elements';
	import type ManagePaginationProps from './types';

	let { currentPage, totalPages, onPrevious, onNext, className }: ManagePaginationProps =
		$props();
</script>

<nav class="ml-manage__pagination {className ?? ''}" aria-label="Pagination">
	<Button
		variant="secondary"
		size="small"
		disabled={currentPage <= 1}
		ariaLabel="Previous page"
		onclick={onPrevious}
	>
		Previous
	</Button>
	<span class="ml-manage__page-info">Page {currentPage} of {totalPages}</span>
	<Button
		variant="secondary"
		size="small"
		disabled={currentPage >= totalPages}
		ariaLabel="Next page"
		onclick={onNext}
	>
		Next
	</Button>
</nav>

<style lang="scss">
	@use 'tokens' as *;

	.ml-manage__pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-md;
	}

	.ml-manage__page-info {
		font-size: $font-sm;
		color: $text-muted;
	}
</style>
