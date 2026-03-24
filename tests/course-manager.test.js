import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CourseManager } from '../js/course-manager.js';

describe('CourseManager', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads question files into questionSets for grammar-choice stages', async () => {
    const manager = new CourseManager();

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          courseInfo: { id: 'grammar-past-tense', title: 'Past Tense' },
          stages: [
            {
              id: 'quiz-past-tense',
              kind: 'quiz',
              engine: 'grammar-choice',
              title: '過去式練習',
              questionFiles: ['questions/past-tense-set-1.json'],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'past-tense-set-1',
          title: 'Past Tense Set 1',
          questions: [
            {
              id: 'q1',
              prompt: '選出正確答案。',
              stem: 'We ___ soccer yesterday.',
              choices: ['play', 'played'],
              correctIndex: 1,
            },
          ],
        }),
      });

    const course = await manager.fetchCourseDetail('grammar/past-tense.json');

    expect(global.fetch).toHaveBeenNthCalledWith(1, '/data/courses/grammar/past-tense.json');
    expect(global.fetch).toHaveBeenNthCalledWith(2, '/data/courses/grammar/questions/past-tense-set-1.json');
    expect(course.stages[0].questionSets).toEqual([
      {
        id: 'past-tense-set-1',
        title: 'Past Tense Set 1',
        questions: [
          {
            id: 'q1',
            prompt: '選出正確答案。',
            stem: 'We ___ soccer yesterday.',
            choices: ['play', 'played'],
            correctIndex: 1,
            sourceSetId: 'past-tense-set-1',
            progressId: 'past-tense-set-1:q1',
          },
        ],
      },
    ]);
  });

  it('filters grammar-choice stages when external question files cannot be loaded', async () => {
    const manager = new CourseManager();

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          courseInfo: { id: 'grammar-past-tense', title: 'Past Tense' },
          stages: [
            {
              id: 'study-past-tense',
              kind: 'study',
              title: '學習',
              blocks: [{ type: 'text', body: 'go -> went' }],
            },
            {
              id: 'quiz-past-tense',
              kind: 'quiz',
              engine: 'grammar-choice',
              title: '過去式練習',
              questionFiles: ['questions/missing.json'],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

    const course = await manager.fetchCourseDetail('grammar/past-tense.json');

    expect(course.stages).toHaveLength(1);
    expect(course.stages[0].id).toBe('study-past-tense');
  });
});
