<script lang="ts">
	import { Icon } from '@/ui/components/elements';
	import { Accordion } from 'bits-ui';
	import type AccordionItemProps from './types';

	let { content, header, value, actions }: AccordionItemProps = $props();
</script>

<Accordion.Item {value} class="ka-accordion-item">
	<Accordion.Header class="ka-accordion-header">
		<Accordion.Trigger class="ka-accordion-trigger">
			{@render header()}
			{#if actions}
				<div class="ka-accordion-actions">
					{@render actions()}
				</div>
			{/if}
			<Icon name="chevron-down" className="ka-accordion-chevron" />
		</Accordion.Trigger>
	</Accordion.Header>
	<Accordion.Content forceMount class="ka-accordion-content">
		<div class="ka-accordion-content-inner">
			{@render content()}
		</div>
	</Accordion.Content>
</Accordion.Item>

<style>
	/* Accordion item styles */
	:global(.ka-accordion-item) {
		border: 1px solid var(--background-modifier-border);
		border-radius: 4px;
	}

	/* Trigger styles */
	:global(button.ka-accordion-trigger) {
		display: flex;
		align-items: center;
		gap: var(--size-4-2);
		width: 100%;
		padding: var(--size-4-2) var(--size-4-3);
		background: none !important;
		border: none !important;
		box-shadow: none;
		cursor: pointer;
		text-align: left;
	}

	:global(button.ka-accordion-trigger:focus-visible) {
		outline: 2px solid var(--interactive-accent);
		outline-offset: -2px;
	}

	/* Header styles */
	:global(.ka-accordion-header) {
		font-size: var(--font-ui-medium);
		font-weight: var(--font-medium);
		color: var(--text-normal);
		margin-top: 4px;
		margin-bottom: 2px;
	}

	:global(.ka-accordion-header[data-state='open']) {
		border-bottom: 1px solid var(--background-modifier-border);
	}

	/* Chevron styles */
	:global(.ka-accordion-chevron) {
		color: var(--text-muted);
		flex-shrink: 0;
		transition: transform 0.2s ease;
	}

	/* Chevron rotation based on parent Item state */
	:global(.ka-accordion-item[data-state='open'] .ka-accordion-chevron) {
		transform: rotate(180deg);
	}

	/* Content styles */
	:global(.ka-accordion-content) {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.25s ease-out;
		overflow: hidden;
	}

	:global(.ka-accordion-content[data-state='open']) {
		grid-template-rows: 1fr;
	}

	:global(.ka-accordion-content-inner) {
		overflow: hidden;
		padding: 0 var(--size-4-3);
	}

	:global(.ka-accordion-content[data-state='open'] .ka-accordion-content-inner) {
		padding-bottom: var(--size-4-3);
	}

	/* Error indicator styles */
	:global(.ka-accordion-error-indicator) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: var(--background-modifier-error);
		color: var(--text-error);
		border-radius: 50%;
		font-size: var(--font-ui-small);
		font-weight: var(--font-bold);
	}

	/* Actions styles */
	:global(.ka-accordion-actions) {
		display: flex;
		align-items: center;
		gap: var(--size-4-1);
		margin-left: auto;
		margin-right: var(--size-4-2);
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		:global(button.ka-accordion-trigger) {
			padding: 0.875rem 1rem;
		}

		:global(.ka-accordion-content-inner) {
			padding: 0 1rem;
		}

		:global(.ka-accordion-content[data-state='open'] .ka-accordion-content-inner) {
			padding-bottom: 1rem;
		}
	}
</style>
