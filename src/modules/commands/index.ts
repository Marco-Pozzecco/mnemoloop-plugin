export { BaseCommand } from './BaseCommand';
export { CommandRegistry } from './CommandRegistry';

// Palette commands
export { OpenDashboardCommand } from './palette/OpenDashboardCommand';
export { OpenSettingsCommand } from './palette/OpenSettingsCommand';
export { CreateEmptyFlashcardCommand } from './palette/CreateEmptyFlashcardCommand';
export { SetAllFlashcardsDueNowCommand } from './palette/SetAllFlashcardsDueNowCommand';

// Editor menu commands
export { GenerateFromSelectionCommand } from './editor-menu/GenerateFromSelectionCommand';

// File menu commands
export { AIGenerateFromFileCommand as GenerateFromFileCommand } from './file-menu/AIGenerateFromFileCommand';
export { CreateFlashcardFromFileCommand } from './file-menu/CreateFlashcardFromFileCommand';
