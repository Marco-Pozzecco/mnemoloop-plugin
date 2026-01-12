/**
 * Interface for all interaction with the Obsidian Vault.
 * Ensures we can mock the vault during testing.
 */
export interface IVaultManager {
	readFile(path: string): Promise<string>;
	writeFile(path: string, content: string): Promise<void>;
	exists(path: string): Promise<boolean>;
	listMarkdownFiles(): string[];
}
