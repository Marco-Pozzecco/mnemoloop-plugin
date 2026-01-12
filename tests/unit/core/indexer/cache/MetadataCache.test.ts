import { describe, it, expect, beforeEach } from 'vitest';
import { MetadataCache } from '@/core/indexer/cache/MetadataCache';
import { CardMetadata } from '@/core/indexer/schema/indexSchema';

describe('MetadataCache', () => {
  let cache: MetadataCache;
  let mockCard: CardMetadata;

  beforeEach(() => {
    cache = new MetadataCache();
    mockCard = {
      file: 'test.md',
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

  it('should initialize empty cache', () => {
    expect(cache.size()).toBe(0);
    expect(cache.isDirty()).toBe(false);
  });

  it('should add and retrieve cards', () => {
    cache.set('card-1', mockCard);
    
    expect(cache.size()).toBe(1);
    expect(cache.isDirty()).toBe(true);
    expect(cache.get('card-1')).toEqual(mockCard);
    expect(cache.has('card-1')).toBe(true);
  });

  it('should return undefined for non-existent cards', () => {
    expect(cache.get('non-existent')).toBeUndefined();
    expect(cache.has('non-existent')).toBe(false);
  });

  it('should delete cards', () => {
    cache.set('card-1', mockCard);
    const deleted = cache.delete('card-1');
    
    expect(deleted).toBe(true);
    expect(cache.size()).toBe(0);
    expect(cache.has('card-1')).toBe(false);
    expect(cache.isDirty()).toBe(true);
  });

  it('should clear all cards', () => {
    cache.set('card-1', mockCard);
    cache.set('card-2', mockCard);
    cache.clear();
    
    expect(cache.size()).toBe(0);
    expect(cache.isDirty()).toBe(true);
  });

  it('should query cards with predicate', () => {
    const card2: CardMetadata = { ...mockCard, status: 'PAUSED' };
    cache.set('card-1', mockCard);
    cache.set('card-2', card2);
    
    const activeCards = cache.query(card => card.status === 'ACTIVE');
    expect(activeCards).toHaveLength(1);
    expect(activeCards[0]).toEqual(mockCard);
  });

  it('should get all cards as Map', () => {
    cache.set('card-1', mockCard);
    cache.set('card-2', mockCard);
    
    const all = cache.getAll();
    expect(all.size).toBe(2);
    expect(all.get('card-1')).toEqual(mockCard);
  });

  it('should load from entries', () => {
    const entries = { 'card-1': mockCard };
    cache.load(entries);
    
    expect(cache.size()).toBe(1);
    expect(cache.isDirty()).toBe(false);
    expect(cache.get('card-1')).toEqual(mockCard);
  });

  it('should dump to entries', () => {
    cache.set('card-1', mockCard);
    const entries = cache.dump();
    
    expect(entries).toEqual({ 'card-1': mockCard });
  });

  it('should mark clean', () => {
    cache.set('card-1', mockCard);
    expect(cache.isDirty()).toBe(true);
    
    cache.markClean();
    expect(cache.isDirty()).toBe(false);
  });
});