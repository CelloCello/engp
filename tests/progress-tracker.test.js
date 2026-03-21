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

    expect(tracker.progress.apple).toEqual({ correct: 1, total: 2 });
    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      'engp_progress',
      JSON.stringify({
        apple: { correct: 1, total: 2 },
      }),
    );
  });

  it('maps accuracy to the expected mastery levels', () => {
    const tracker = new ProgressTracker();
    tracker.progress = {
      newWord: { correct: 0, total: 0 },
      weak: { correct: 1, total: 5 },
      early: { correct: 2, total: 5 },
      mid: { correct: 3, total: 5 },
      good: { correct: 4, total: 5 },
      mastered: { correct: 5, total: 5 },
    };

    expect(tracker.getWordLevel('unknown')).toBe(1);
    expect(tracker.getWordLevel('newWord')).toBe(1);
    expect(tracker.getWordLevel('weak')).toBe(1);
    expect(tracker.getWordLevel('early')).toBe(2);
    expect(tracker.getWordLevel('mid')).toBe(3);
    expect(tracker.getWordLevel('good')).toBe(4);
    expect(tracker.getWordLevel('mastered')).toBe(5);
  });
});
