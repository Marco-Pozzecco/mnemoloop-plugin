export interface CachedMetadata {
	frontmatter?: Record<string, any>;
	tags?: string[];
	links?: Array<{
		link: string;
		original: string;
	}>;
}

export interface IVaultAdapter {
	readFile(path: string): Promise<string>;
	writeFile(path: string, content: string): Promise<void>;
	fileExists(path: string): Promise<boolean>;
	getCachedMetadata(path: string): Promise<CachedMetadata | null>;
	deleteFile(path: string): Promise<void>;
}
