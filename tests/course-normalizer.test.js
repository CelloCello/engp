import { describe, expect, it } from 'vitest';

import { normalizeCourseDetail } from '../js/course-normalizer.js';

describe('normalizeCourseDetail', () => {
  it('creates an implicit vocabulary quiz stage for legacy units', () => {
    const course = normalizeCourseDetail({
      courseInfo: { id: 'legacy-u1', title: 'Legacy Unit' },
      vocabulary: [{ id: 'apple', word: 'apple', meaning: '蘋果' }],
    });

    expect(course.stages).toEqual([
      {
        id: 'quiz-vocabulary',
        kind: 'quiz',
        engine: 'vocabulary-spelling',
        title: '單字測驗',
        description: '練習本單元的單字拼字。',
        questions: [],
        questionFiles: [],
        questionSets: [],
      },
    ]);
  });

  it('keeps configured study and grammar-choice stages', () => {
    const course = normalizeCourseDetail({
      courseInfo: { id: 'past-tense', title: 'Past Tense Verbs' },
      vocabulary: [],
      stages: [
        {
          id: 'study-past-tense',
          kind: 'study',
          title: '過去式學習',
          blocks: [{ type: 'text', body: 'go -> went' }],
        },
        {
          id: 'quiz-past-tense',
          kind: 'quiz',
          engine: 'grammar-choice',
          title: '過去式練習',
          questions: [{ id: 'q1', choices: ['went', 'goes'], correctIndex: 0 }],
        },
      ],
    });

    expect(course.stages).toHaveLength(2);
    expect(course.stages[0].kind).toBe('study');
    expect(course.stages[1].engine).toBe('grammar-choice');
    expect(course.stages[1].questionSets).toEqual([
      {
        id: 'quiz-past-tense-inline',
        title: '過去式練習',
        questions: [{ id: 'q1', choices: ['went', 'goes'], correctIndex: 0 }],
      },
    ]);
  });

  it('keeps grammar-choice stages that are backed by question sets', () => {
    const course = normalizeCourseDetail({
      courseInfo: { id: 'past-tense', title: 'Past Tense Verbs' },
      vocabulary: [],
      stages: [
        {
          id: 'quiz-past-tense',
          kind: 'quiz',
          engine: 'grammar-choice',
          title: '過去式練習',
          questionSets: [
            {
              id: 'past-tense-set-1',
              title: 'Core',
              questions: [{ id: 'q1', progressId: 'past-tense-set-1:q1' }],
            },
          ],
        },
      ],
    });

    expect(course.stages).toHaveLength(1);
    expect(course.stages[0].questionSets).toEqual([
      {
        id: 'past-tense-set-1',
        title: 'Core',
        questions: [{ id: 'q1', progressId: 'past-tense-set-1:q1' }],
      },
    ]);
  });
});
