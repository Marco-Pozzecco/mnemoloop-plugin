import { OpenDashboardCommand } from '@/modules/commands/palette/OpenDashboardCommand';
import { OpenSettingsCommand } from '@/modules/commands/palette/OpenSettingsCommand';
import { CreateEmptyFlashcardCommand } from '@/modules/commands/palette/CreateEmptyFlashcardCommand';
import { GenerateFromSelectionCommand } from '@/modules/commands/editor-menu/GenerateFromSelectionCommand';
import { AIGenerateFromFileCommand } from '@/modules/commands/file-menu/AIGenerateFromFileCommand';
import { CreateFlashcardFromFileCommand } from '@/modules/commands';

export enum CommandKey {
	// palette
	openDashboard = 'openDashboard',
	openSettings = 'openSettings',
	createEmptyFlashcard = 'createEmptyFlashcard',
	// file menu
	generateFromFile = 'generateFromFile',
	createFlashcardFromFile = 'createFlashcardFromFile',
	// editor menu
	generateFromSelection = 'generateFromSelection',
}

interface CommandMap {
	[CommandKey.openDashboard]: OpenDashboardCommand;
	[CommandKey.openSettings]: OpenSettingsCommand;
	[CommandKey.createEmptyFlashcard]: CreateEmptyFlashcardCommand;
	[CommandKey.generateFromSelection]: GenerateFromSelectionCommand;
	[CommandKey.generateFromFile]: AIGenerateFromFileCommand;
	[CommandKey.createFlashcardFromFile]: CreateFlashcardFromFileCommand;
}

export type Commands = Map<CommandKey, CommandMap[CommandKey]>;
