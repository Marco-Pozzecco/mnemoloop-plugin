import { createContext } from 'svelte';

/**
 * The default floating reference used by a compound combobox. Consumers can
 * still override it through Combobox.Content's `customAnchor` prop.
 */
export interface ComboboxContextValue {
	trigger: HTMLElement | null;
}

export const [getComboboxContext, setComboboxContext] = createContext<ComboboxContextValue>();
