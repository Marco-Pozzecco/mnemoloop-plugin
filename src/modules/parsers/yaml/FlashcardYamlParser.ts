import { RecoverResult } from '@/interfaces/parser/utils';
import { DEFAULT_FLASHCARD_YAML, FlashcardYaml, FlashcardYamlSchema } from '@/schemas';
import { normalizePath, parseYaml, Plugin } from 'obsidian';
import { v4 as uuid } from 'uuid';
import { YamlParser } from '../_core/Yaml';

export class FlashcardYamlParser extends YamlParser<FlashcardYaml> {
	constructor(plugin: Plugin) {
		super(plugin, FlashcardYamlSchema);
	}

	recover: (filepath: string) => Promise<RecoverResult<FlashcardYaml>> = async (filepath) => {
		// Try to preserve existing valid frontmatter fields before falling back to full defaults
		try {
			const normalizedFilepath = normalizePath(filepath);
			const file = this._plugin.app.vault.getFileByPath(normalizedFilepath);
			if (file) {
				const content = await this._plugin.app.vault.read(file);
				const fmMatch = content.match(this._yamlRegex);
				if (fmMatch) {
					const yamlContent = fmMatch[0].replace(/^---\n/, '').replace(/\n---\n?$/, '');
					const existing = parseYaml(yamlContent) as Record<string, unknown>;
					// Merge: existing valid fields win over defaults; generate uuid only if missing
					const merged = { ...DEFAULT_FLASHCARD_YAML, uuid: uuid(), ...existing };
					const result = this._schema.safeParse(merged);
					if (result.success) {
						await this.write(filepath, result.data);
						return { success: true, data: result.data };
					}
				}
			}
		} catch {
			// File read/parse failed; fall through to full default
		}

		// Full default: generate brand new YAML
		const { success, data } = this._generateYaml();
		if (success) {
			await this.write(filepath, data);
			return { success: true, data };
		}
		return { success: false, data: null };
	};

	private _generateYaml() {
		const yaml: FlashcardYaml = {
			uuid: uuid(),
			...DEFAULT_FLASHCARD_YAML,
		};
		return this._schema.safeParse(yaml);
	}
}
