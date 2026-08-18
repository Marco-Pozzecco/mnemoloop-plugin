import { Combobox } from 'bits-ui';
import { default as ComboboxRoot } from './Root/component.svelte';
import { default as ComboboxLabel } from './Label/component.svelte';
import { default as ComboboxInput } from './Input/component.svelte';
import { default as ComboboxTrigger } from './Trigger/component.svelte';
import { default as ComboboxContent } from './Content/component.svelte';
import { default as ComboboxViewport } from './Viewport/component.svelte';
import { default as ComboboxItem } from './Item/component.svelte';
import { default as ComboboxItemLabel } from './ItemLabel/component.svelte';
import { default as ComboboxItemIndicator } from './ItemIndicator/component.svelte';
import { default as ComboboxEmpty } from './Empty/component.svelte';
import { default as ComboboxCreate } from './Create/component.svelte';

/**
 * Compound combobox component built on bits-ui `Combobox`.
 *
 * Usage:
 * ```svelte
 * <Combobox.Root type="multiple" bind:value={decks} items={deckOptions}>
 *   <Combobox.Trigger ariaLabel="Open deck picker" />
 *   <Combobox.Portal>
 *     <Combobox.Content>
 *       <Combobox.Input placeholder="Search decks" />
 *       <Combobox.Viewport>
 *         {#each filtered as option (option.value)}
 *           <Combobox.Item value={option.value} label={option.label} />
 *         {/each}
 *       </Combobox.Viewport>
 *     </Combobox.Content>
 *   </Combobox.Portal>
 * </Combobox.Root>
 * ```
 *
 * Sub-components:
 * - `Root` — holds value/open/inputValue state; bindable for controlled mode.
 * - `Label` — optional visible label.
 * - `Input` — searchable text input (driven by Root's `inputValue`).
 * - `Trigger` — chevron toggle button, absolutely positioned; place it in a `position: relative` container.
 * - `Content` — floating dropdown panel.
 * - `Viewport` — scrollable item container.
 * - `Item` — pre-styled listbox option (default shows label + check indicator when selected).
 * - `ItemLabel` / `ItemIndicator` — styled parts for custom item content.
 * - `Empty` — non-interactive "no results" state.
 * - `Create` — pre-styled create-new option rendered as a selectable item (consumer handles its value).
 * - `Portal` — pass-through from bits-ui; portals content to the body.
 */
export default {
	Root: ComboboxRoot,
	Label: ComboboxLabel,
	Input: ComboboxInput,
	Trigger: ComboboxTrigger,
	Content: ComboboxContent,
	Viewport: ComboboxViewport,
	Item: ComboboxItem,
	ItemLabel: ComboboxItemLabel,
	ItemIndicator: ComboboxItemIndicator,
	Empty: ComboboxEmpty,
	Create: ComboboxCreate,
	Portal: Combobox.Portal,
};
