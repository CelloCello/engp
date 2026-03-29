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

  it('collects wrong grammar answers for result review', () => {
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
        questions: [],
      },
      progressTracker,
    );

    engine.questions = [
      {
        id: 'q1',
        progressId: 'set-1:q1',
        prompt: '選出正確答案。',
        stem: 'Yesterday Amy ___ home.',
        choices: ['go', 'went'],
        correctIndex: 1,
        explanation: 'yesterday 要用過去式 went。',
      },
      {
        id: 'q2',
        prompt: '選出正確答案。',
        stem: 'They ___ soccer every day.',
        choices: ['play', 'played'],
        correctIndex: 0,
        explanation: 'every day 表示習慣，所以用 play。',
      },
    ];
    engine.startTime = Date.now() - 3000;

    expect(engine.submitAnswer(0)).toEqual({
      isCorrect: false,
      expectedAnswer: 'went',
      explanation: 'yesterday 要用過去式 went。',
    });

    engine.nextQuestion();
    engine.submitAnswer(0);
    engine.endTime = Date.now();

    expect(engine.answerRecords).toEqual([
      {
        questionId: 'q1',
        progressId: 'set-1:q1',
        prompt: '選出正確答案。',
        stem: 'Yesterday Amy ___ home.',
        userAnswer: 'go',
        expectedAnswer: 'went',
        explanation: 'yesterday 要用過去式 went。',
        isCorrect: false,
      },
      {
        questionId: 'q2',
        progressId: 'q2',
        prompt: '選出正確答案。',
        stem: 'They ___ soccer every day.',
        userAnswer: 'play',
        expectedAnswer: 'play',
        explanation: 'every day 表示習慣，所以用 play。',
        isCorrect: true,
      },
    ]);
    expect(engine.getStats().wrongQuestions).toEqual([
      {
        questionId: 'q1',
        progressId: 'set-1:q1',
        prompt: '選出正確答案。',
        stem: 'Yesterday Amy ___ home.',
        userAnswer: 'go',
        expectedAnswer: 'went',
        explanation: 'yesterday 要用過去式 went。',
        isCorrect: false,
      },
    ]);
  });

  it('clears prior answer records when starting a new quiz run', () => {
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
            prompt: '選出正確答案。',
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
        prompt: '選出正確答案。',
        stem: 'Yesterday Amy ___ home.',
        choices: ['go', 'went'],
        correctIndex: 1,
        explanation: 'yesterday 要用過去式 went。',
      },
    ];
    engine.submitAnswer(0);

    expect(engine.answerRecords).toHaveLength(1);

    engine.start();

    expect(engine.answerRecords).toEqual([]);
    expect(engine.endTime).toBe(0);
    expect(engine.correctCount).toBe(0);
  });

  it('selects one external question set per run and records progressId', () => {
    const progressTracker = {
      getWordLevel: vi.fn(() => 1),
      recordWordResult: vi.fn(),
      recordGrammarChoiceResult: vi.fn(),
    };
    const randomSpy = vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.9);
    const engine = new QuizEngine(
      {
        courseInfo: { id: 'grammar-past-tense' },
        vocabulary: [],
      },
      {
        id: 'quiz-past-tense',
        kind: 'quiz',
        engine: 'grammar-choice',
        questionSets: [
          {
            id: 'past-tense-set-1',
            questions: [
              { id: 'q1', stem: 'core', choices: ['a', 'b'], correctIndex: 0, progressId: 'past-tense-set-1:q1' },
            ],
          },
          {
            id: 'past-tense-set-2',
            questions: Array.from({ length: 12 }, (_, index) => ({
              id: `q${index + 1}`,
              stem: `mixed-${index + 1}`,
              choices: ['a', 'b'],
              correctIndex: 1,
              progressId: `past-tense-set-2:q${index + 1}`,
            })),
          },
        ],
      },
      progressTracker,
    );

    engine.buildQuestions();

    expect(engine.questions).toHaveLength(10);
    expect(engine.questions.every((question) => question.progressId.startsWith('past-tense-set-2:'))).toBe(true);

    engine.submitAnswer(1);

    expect(progressTracker.recordGrammarChoiceResult).toHaveBeenCalledWith(
      'grammar-past-tense',
      engine.questions[0].progressId,
      true,
    );

    randomSpy.mockRestore();
  });
});
