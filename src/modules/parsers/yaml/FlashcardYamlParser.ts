import { RecoverResult, RecoveryWarning } from '@/interfaces/parser/utils';
import { DEFAULT_FLASHCARD_YAML, FlashcardYaml, FlashcardYamlSchema } from '@/schemas';
import { normalizePath, parseYaml, Plugin } from 'obsidian';
import { v4 as uuid } from 'uuid';
import { YamlParser } from '../_core/Yaml';

const MAX_RECOVER_ROUNDS = 3;

export class FlashcardYamlParser extends YamlParser<FlashcardYaml> {
	constructor(plugin: Plugin) {
		super(plugin, FlashcardYamlSchema);
	}

	recover: (filepath: string) => Promise<RecoverResult<FlashcardYaml>> = async (filepath) => {
		try {
			const normalizedFilepath = normalizePath(filepath);
			const file = this._plugin.app.vault.getFileByPath(normalizedFilepath);

			// Extract raw YAML from existing file, or start with empty if none
			let raw: Record<string, unknown> = {};
			if (file) {
				const content = await this._plugin.app.vault.read(file);
				const fmMatch = content.match(this._yamlRegex);
				if (fmMatch) {
					const yamlContent = fmMatch[0].replace(/^---\n/, '').replace(/\n---\n?$/, '');

					const parsed: unknown = parseYaml(yamlContent);
					if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
						raw = parsed as Record<string, unknown>;
					}
				}
			}

			// Apply field-level recovery — preserves valid fields, fixes broken ones
			const { data, warnings } = this._recoverFlashcardYaml(raw);
			await this.write(filepath, data);
			return { success: true, data, warnings };
		} catch {
			return { success: false, data: null };
		}
	};

	private _recoverFlashcardYaml(raw: Record<string, unknown>): {
		data: FlashcardYaml;
		warnings: RecoveryWarning[];
	} {
		const warnings: RecoveryWarning[] = [];

		// clone input
		const working: Record<string, unknown> = { ...raw };

		for (let round = 0; round < MAX_RECOVER_ROUNDS; round++) {
			const result = FlashcardYamlSchema.safeParse(working);

			if (result.success) {
				return { data: result.data, warnings };
			}

			// for each unique field path with an issue, replace with default
			const seen = new Set<string>();
			for (const issue of result.error.issues) {
				const pathStr = issue.path.join('.'); // assume Array has always length of 1 as yaml is flat
				if (seen.has(pathStr)) continue;
				seen.add(pathStr);

				if (pathStr === 'uuid') {
					working[pathStr] = uuid();
				} else {
					working[pathStr] = DEFAULT_FLASHCARD_YAML[pathStr as keyof typeof DEFAULT_FLASHCARD_YAML];
				}

				warnings.push({
					field: pathStr,
					issue: issue.code,
				});
			}
		}
		// unrecoverable after max rounds, fallback to default
		const fallback: FlashcardYaml = {
			uuid: uuid(),
			...DEFAULT_FLASHCARD_YAML,
		};
		warnings.push({
			field: '*',
			issue: 'unrecoverable after max iterations',
		});
		return { data: fallback, warnings };
	}
}
