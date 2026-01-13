// Vitest setup file
import { vi } from 'vitest';

// Mock obsidian module
vi.mock('obsidian', () => ({
	Notice: vi.fn(),
	Plugin: class {},
}));
