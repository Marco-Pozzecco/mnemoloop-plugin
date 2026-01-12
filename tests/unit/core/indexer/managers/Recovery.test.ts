import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IndexManager } from '@/core/indexer/managers/IndexManager';
import { StatsManager } from '@/core/indexer/managers/StatsManager';
import { runMigrations } from '@/core/indexer/schema/migrations';
import { CardMetadata } from '@/core/indexer/schema/indexSchema';
import { App } from 'obsidian';

// Mock Obsidian App
const mockApp = {
  vault: {
    adapter: {
      exists: vi.fn(),
      read: vi.fn(),
      write: vi.fn(),
      mkdir: vi.fn(),
      list: vi.fn(),
    },
  },
} as unknown as App;

describe('Recovery and Migration', () => {
  let indexManager: IndexManager;
  let statsManager: StatsManager;
  let mockCard: CardMetadata;

  beforeEach(() => {
    indexManager = new IndexManager(mockApp);
    statsManager = new StatsManager(mockApp);
    vi.clearAllMocks();
    
    mockCard = {
      file: 'flashcards/test.md',
      source: 'Test Note',
      status: 'ACTIVE',
      created: '2024-01-01T00:00:00.000Z',
      updated: '2024-01-01T00:00:00.000Z',
      deleted_at: null,
      srs: {
        stability: 0,
        difficulty: 5,
        state: 0,
        last_review: null,
        next_review: '2024-01-02T00:00:00.000Z',
        reps: 0,
      },
    };
  });

  it('should run migrations correctly', () => {
    const mockIndex = {
      version: 1,
      cards: { 'card-1': mockCard },
    };
    
    const migratedIndex = runMigrations(mockIndex, 1, 1);
    
    expect(migratedIndex.version).toBe(1);
    expect(migratedIndex.cards).toEqual({ 'card-1': mockCard });
  });

  it('should rebuild index when file is corrupted', async () => {
    const mockAdapter = (mockApp.vault.adapter as any);
    
    // Simulate corrupted index file
    mockAdapter.exists.mockResolvedValue(true);
    mockAdapter.read.mockRejectedValue(new Error('Corrupted file'));
    
    // Mock rebuild functionality
    mockAdapter.list.mockResolvedValue({
      files: ['flashcards/test.md'],
      folders: [],
    });
    mockAdapter.read.mockImplementation((file: string) => {
      if (file === 'flashcards/test.md') {
        return `---
source: "Test Note"
srs: {"stability": 0, "difficulty": 5, "state": 0, "last_review": null, "next_review": "2024-01-02T00:00:00.000Z", "reps": 0}
---
# Test Card`;
      }
      return '';
    });
    mockAdapter.write.mockResolvedValue(undefined);

    // Load should fail with corrupted file
    await expect(indexManager.load()).rejects.toThrow();
    
    // But rebuild should work
    await indexManager.rebuildFromVault();
    
    expect(indexManager.getCard('flashcards-test-md')).toBeDefined();
  });

  it('should handle missing flashcard folder during rebuild', async () => {
    const mockAdapter = (mockApp.vault.adapter as any);
    mockAdapter.exists.mockResolvedValue(false);

    await indexManager.rebuildFromVault();

    // Should not throw error, just log warning
    expect(mockAdapter.exists).toHaveBeenCalledWith('flashcards');
  });

  it('should handle malformed YAML during rebuild', async () => {
    const mockAdapter = (mockApp.vault.adapter as any);
    mockAdapter.exists.mockResolvedValue(true);
    mockAdapter.list.mockResolvedValue({
      files: ['flashcards/malformed.md', 'flashcards/valid.md'],
      folders: [],
    });
    
    let callCount = 0;
    mockAdapter.read.mockImplementation((file: string) => {
      callCount++;
      if (file === 'flashcards/malformed.md') {
        return 'invalid yaml content\n# Malformed Card';
      }
      if (file === 'flashcards/valid.md') {
        return `---
source: "Valid Note"
srs: {"stability": 0, "difficulty": 5, "state": 0, "last_review": null, "next_review": "2024-01-02T00:00:00.000Z", "reps": 0}
---
# Valid Card`;
      }
      return '';
    });
    mockAdapter.write.mockResolvedValue(undefined);

    await indexManager.rebuildFromVault();

    // Should process valid card despite malformed one
    expect(indexManager.getCard('flashcards-valid-md')).toBeDefined();
    expect(indexManager.getCard('flashcards-malformed-md')).toBeUndefined();
    expect(callCount).toBe(2);
  });

  it('should maintain data consistency between index and stats', async () => {
    const mockAdapter = (mockApp.vault.adapter as any);
    mockAdapter.exists.mockResolvedValue(false);
    mockAdapter.mkdir.mockResolvedValue(undefined);
    mockAdapter.write.mockResolvedValue(undefined);

    // Load both managers
    await indexManager.load();
    await statsManager.load();

    // Add a card to index
    indexManager.upsertCard('card-1', mockCard);
    
    // Recompute stats
    const index = { 'card-1': mockCard };
    statsManager.recomputeAll(index);

    const summary = statsManager.getSummary();
    expect(summary.total_learned).toBe(0); // state 0 is not considered learned
    expect(summary.difficulty_dist).toEqual({ 5: 1 });
  });
});