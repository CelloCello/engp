import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QuizEngine } from '../js/quiz-engine.js';

describe('QuizEngine', () => {
  const vocabularyStage = {
    id: 'quiz-vocabulary',
    kind: 'quiz',
    engine: 'vocabulary-spelling',
    title: '單字測驗',
  };

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
    const engine = new QuizEngine({ vocabulary: [] }, vocabularyStage, { getWordLevel: vi.fn() });

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
      vocabularyStage,
      progressTracker,
    );

    engine.questions = [{ id: 'apple', word: 'Apple' }];

    expect(engine.submitAnswer('apple')).toEqual({
      isCorrect: true,
      expectedAnswer: 'Apple',
      explanation: '',
    });
    expect(progressTracker.recordWordResult).toHaveBeenCalledWith('apple', true);
    expect(engine.correctCount).toBe(1);
  });

  it('records grammar-choice answers with unit and question ids', () => {
    const progressTracker = {
      getWordLevel: vi.fn(() => 1),
      recordWordResult: vi.fn(),
      recordGrammarChoiceResult: vi.fn(),
    };
    const engine = new QuizEngine(
      {
        courseInfo: { id: 'past-tense-unit' },
        vocabulary: [],
      },
      {
        id: 'quiz-past-tense',
        kind: 'quiz',
        engine: 'grammar-choice',
        questions: [
          {
            id: 'q1',
            stem: 'Yesterday Amy ___ home.',
            choices: ['go', 'went'],
            correctIndex: 1,
            explanation: 'yesterday 要用過去式 went。',
          },
        ],
      },
      progressTracker,
    );

    engine.questions = [
      {
        id: 'q1',
        stem: 'Yesterday Amy ___ home.',
        choices: ['go', 'went'],
        correctIndex: 1,
        explanation: 'yesterday 要用過去式 went。',
      },
    ];

    expect(engine.submitAnswer(1)).toEqual({
      isCorrect: true,
      expectedAnswer: 'went',
      explanation: 'yesterday 要用過去式 went。',
    });
    expect(progressTracker.recordGrammarChoiceResult).toHaveBeenCalledWith('past-tense-unit', 'q1', true);
    expect(engine.correctCount).toBe(1);
  });
});
