import { RecoverResult } from '@/interfaces/parser/utils';
import { DEFAULT_FLASHCARD_YAML, FlashcardYaml, FlashcardYamlSchema } from '@/schemas';
import { Plugin } from 'obsidian';
import { v4 as uuid } from 'uuid';
import { YamlParser } from '../_core/Yaml';

export class FlashcardYamlParser extends YamlParser<FlashcardYaml> {
	constructor(plugin: Plugin) {
		super(plugin, FlashcardYamlSchema);
	}

	recover: (filepath: string) => Promise<RecoverResult<FlashcardYaml>> = async (filepath) => {
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
