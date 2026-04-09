import { IYamlEngine } from '@/interfaces/IYamlEngine';
import { DEFAULT_FLASHCARD_YAML, FlashcardMetadataSchema, FlashcardYaml } from '@/schemas';
import { Plugin } from 'obsidian';
import { v4 as uuid } from 'uuid';
import { BaseYamlEngine } from './BaseYamlEngine';

export class FlashcardYamlEngine
	extends BaseYamlEngine<FlashcardYaml>
	implements IYamlEngine<FlashcardYaml>
{
	constructor(plugin: Plugin) {
		super(plugin, FlashcardMetadataSchema);
	}

	recover: (filepath: string) => Promise<void> = async (filepath) => {
		await this.write(filepath, this.generateDefaultYaml());
	};

	private generateDefaultYaml() {
		const yaml: FlashcardYaml = {
			uuid: uuid(),
			...DEFAULT_FLASHCARD_YAML,
		};
		return yaml;
	}
}
