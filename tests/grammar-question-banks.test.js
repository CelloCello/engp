import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const QUESTIONS_DIR = path.join(process.cwd(), 'public/data/courses/grammar/questions');
const COURSE_FILE = path.join(process.cwd(), 'public/data/courses/grammar/past-tense.json');

const PAST_MARKERS = [
  'yesterday',
  'last night',
  'last sunday',
  'last weekend',
  'last week',
  'last friday',
  'last saturday',
  'last month',
  'this morning',
  'yesterday afternoon',
  'yesterday morning',
  'yesterday evening',
  'two hours ago',
  'two days ago',
  'a minute ago',
  'ten years ago',
];

const PRESENT_MARKERS = [
  'every day',
  'every morning',
  'every night',
  'every afternoon',
  'every evening',
  'every week',
  'every weekend',
  'every sunday',
  'every tuesday',
  'on sundays',
  'on saturdays',
  'on fridays',
  'on mondays',
  'on weekends',
  'on hot days',
  'after dinner',
  'after school',
  'at night',
  'at bedtime',
  'at lunch time',
  'in the evening',
  'in the afternoon',
  'sometimes',
  'now',
];

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function classifyTense(stem) {
  const normalized = stem.toLowerCase();

  if (PAST_MARKERS.some((marker) => normalized.includes(marker))) {
    return 'past';
  }

  if (PRESENT_MARKERS.some((marker) => normalized.includes(marker))) {
    return 'present';
  }

  return 'unknown';
}

describe('grammar question banks', () => {
  it('references five mixed question sets from the course file', async () => {
    const course = await loadJson(COURSE_FILE);
    const quizStage = course.stages.find((stage) => stage.id === 'quiz-past-tense');

    expect(quizStage.questionFiles).toEqual([
      'questions/past-tense-set-1.json',
      'questions/past-tense-set-2.json',
      'questions/past-tense-set-3.json',
      'questions/past-tense-set-4.json',
      'questions/past-tense-set-5.json',
    ]);
  });

  it('keeps five sets with 30 questions each and a 12/18 present-past mix', async () => {
    const files = (await readdir(QUESTIONS_DIR))
      .filter((file) => /^past-tense-set-\d+\.json$/.test(file))
      .sort();

    expect(files).toHaveLength(5);

    for (const file of files) {
      const questionSet = await loadJson(path.join(QUESTIONS_DIR, file));
      const counts = questionSet.questions.reduce((acc, question) => {
        acc[classifyTense(question.stem)] += 1;
        return acc;
      }, { present: 0, past: 0, unknown: 0 });

      expect(questionSet.questions).toHaveLength(30);
      expect(counts.present).toBe(12);
      expect(counts.past).toBe(18);
      expect(counts.unknown).toBe(0);
    }
  });

  it('does not repeat stems across the five sets', async () => {
    const files = (await readdir(QUESTIONS_DIR))
      .filter((file) => /^past-tense-set-\d+\.json$/.test(file))
      .sort();
    const seenStems = new Set();

    for (const file of files) {
      const questionSet = await loadJson(path.join(QUESTIONS_DIR, file));

      for (const question of questionSet.questions) {
        expect(seenStems.has(question.stem)).toBe(false);
        seenStems.add(question.stem);
      }
    }

    expect(seenStems.size).toBe(150);
  });
});
