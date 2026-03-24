import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProgressTracker } from '../js/progress-tracker.js';

describe('ProgressTracker', () => {
  beforeEach(() => {
    const store = new Map();

    global.localStorage = {
      getItem: vi.fn((key) => store.get(key) ?? null),
      setItem: vi.fn((key, value) => {
        store.set(key, value);
      }),
      removeItem: vi.fn((key) => {
        store.delete(key);
      }),
      clear: vi.fn(() => {
        store.clear();
      }),
    };
  });

  it('records answers and persists progress', () => {
    const tracker = new ProgressTracker();

    tracker.recordWordResult('apple', true);
    tracker.recordWordResult('apple', false);

    expect(tracker.progress['word:apple']).toEqual({ correct: 1, total: 2 });
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'engp_progress',
      JSON.stringify({
        'word:apple': { correct: 1, total: 2 },
      }),
    );
  });

  it('maps accuracy to the expected mastery levels', () => {
    const tracker = new ProgressTracker();
    tracker.progress = {
      'word:newWord': { correct: 0, total: 0 },
      'word:weak': { correct: 1, total: 5 },
      'word:early': { correct: 2, total: 5 },
      'word:mid': { correct: 3, total: 5 },
      'word:good': { correct: 4, total: 5 },
      'word:mastered': { correct: 5, total: 5 },
    };

    expect(tracker.getWordLevel('unknown')).toBe(1);
    expect(tracker.getWordLevel('newWord')).toBe(1);
    expect(tracker.getWordLevel('weak')).toBe(1);
    expect(tracker.getWordLevel('early')).toBe(2);
    expect(tracker.getWordLevel('mid')).toBe(3);
    expect(tracker.getWordLevel('good')).toBe(4);
    expect(tracker.getWordLevel('mastered')).toBe(5);
  });

  it('normalizes legacy word progress keys on load', () => {
    const legacyStore = new Map([
      ['engp_progress', JSON.stringify({ apple: { correct: 2, total: 2 } })],
    ]);

    global.localStorage.getItem = vi.fn((key) => legacyStore.get(key) ?? null);

    const tracker = new ProgressTracker();

    expect(tracker.progress).toEqual({
      'word:apple': { correct: 2, total: 2 },
    });
    expect(tracker.getWordLevel('apple')).toBe(5);
  });

  it('tracks grammar-choice progress separately', () => {
    const tracker = new ProgressTracker();

    tracker.recordGrammarChoiceResult('unit-past-tense', 'q1', true);
    tracker.recordGrammarChoiceResult('unit-past-tense', 'q1', false);

    expect(tracker.progress['grammar-choice:unit-past-tense:q1']).toEqual({ correct: 1, total: 2 });
    expect(tracker.getGrammarChoiceLevel('unit-past-tense', 'q1')).toBe(3);
  });
});
