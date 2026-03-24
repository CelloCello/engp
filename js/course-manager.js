import { normalizeCourseDetail } from './course-normalizer.js';

export class CourseManager {
  constructor() {
    this.courses = [];
    this.baseUrl = this.normalizeBaseUrl(import.meta.env.BASE_URL);
  }

  normalizeBaseUrl(baseUrl) {
    if (!baseUrl || baseUrl === '/') {
      return '/';
    }

    return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  }

  buildDataPath(path) {
    return `${this.baseUrl}data/${path}`;
  }

  resolveCourseRelativePath(courseFileName, relatedPath) {
    const resolvedUrl = new URL(relatedPath, new URL(courseFileName, 'https://engp.local/'));
    return resolvedUrl.pathname.replace(/^\//, '');
  }

  async fetchJsonData(path) {
    const resp = await fetch(this.buildDataPath(path));
    if (!resp.ok) {
      throw new Error(`Failed to fetch ${path}`);
    }

    return resp.json();
  }

  normalizeQuestionSet(rawSet) {
    if (!rawSet || typeof rawSet !== 'object' || !Array.isArray(rawSet.questions)) {
      return null;
    }

    const setId = rawSet.id || 'question-set';
    const title = rawSet.title || setId;
    const questions = rawSet.questions
      .filter((question) => question && typeof question === 'object')
      .map((question, index) => {
        const questionId = question.id || `q${index + 1}`;

        return {
          ...question,
          id: questionId,
          sourceSetId: setId,
          progressId: `${setId}:${questionId}`,
        };
      });

    if (questions.length === 0) {
      return null;
    }

    return {
      id: setId,
      title,
      questions,
    };
  }

  async hydrateQuestionFileStages(courseFileName, courseData) {
    if (!Array.isArray(courseData?.stages)) {
      return courseData;
    }

    const stages = await Promise.all(courseData.stages.map(async (stage) => {
      if (!Array.isArray(stage.questionFiles) || stage.questionFiles.length === 0) {
        return stage;
      }

      const questionSets = (await Promise.all(stage.questionFiles.map(async (questionFile) => {
        try {
          const resolvedPath = this.resolveCourseRelativePath(courseFileName, questionFile);
          const rawSet = await this.fetchJsonData(`courses/${resolvedPath}`);
          return this.normalizeQuestionSet(rawSet);
        } catch (err) {
          console.error(`Failed to load question file "${questionFile}" for ${courseFileName}`, err);
          return null;
        }
      }))).filter(Boolean);

      return {
        ...stage,
        questionSets,
      };
    }));

    return {
      ...courseData,
      stages,
    };
  }

  async fetchCourseList() {
    try {
      const data = await this.fetchJsonData('course-list.json');
      this.courses = data.courses;
      return this.courses;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async fetchCourseDetail(fileName) {
    try {
      const courseData = await this.fetchJsonData(`courses/${fileName}`);
      const hydratedCourseData = await this.hydrateQuestionFileStages(fileName, courseData);
      return normalizeCourseDetail(hydratedCourseData);
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}
