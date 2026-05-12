// Vitest setup file
import { vi } from 'vitest';

// Define build-time globals for tests
(globalThis as Record<string, unknown>).__DEV__ = true;

// Mock obsidian module
vi.mock('obsidian', () => ({
	Notice: vi.fn(),
	Plugin: class {},
}));
