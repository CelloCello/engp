import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QuizEngine } from '../js/quiz-engine.js';

describe('QuizEngine', () => {
  beforeEach(() => {
    global.window = {
      speechSynthesis: {
        speak: vi.fn(),
      },
    };
    global.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
      }
    };
  });

  it('generates hint patterns based on word length', () => {
    const engine = new QuizEngine({ vocabulary: [] }, { getWordLevel: vi.fn() });

    expect(engine.generateHintPattern('cat')).toEqual([true, false, true]);
    expect(engine.generateHintPattern('apple')).toEqual([true, false, true, false, true]);
    expect(engine.generateHintPattern('elephant')).toEqual([true, false, true, false, false, true, false, true]);
  });

  it('checks answers case-insensitively and records progress', () => {
    const progressTracker = {
      getWordLevel: vi.fn(() => 1),
      recordWordResult: vi.fn(),
    };
    const engine = new QuizEngine(
      {
        vocabulary: [{ id: 'apple', word: 'Apple' }],
      },
      progressTracker,
    );

    engine.questions = [{ id: 'apple', word: 'Apple' }];

    expect(engine.submitAnswer('apple')).toBe(true);
    expect(progressTracker.recordWordResult).toHaveBeenCalledWith('apple', true);
    expect(engine.correctCount).toBe(1);
  });
});
