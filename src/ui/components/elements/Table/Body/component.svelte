<script lang="ts">
	import { cn } from '../../../utils';
	import type TableBodyProps from './types';

	let { className, children }: TableBodyProps = $props();
</script>

<tbody class={cn('ml-table__body', className)}>
	{@render children?.()}
</tbody>
