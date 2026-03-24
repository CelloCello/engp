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

  async fetchCourseList() {
    try {
      const resp = await fetch(this.buildDataPath('course-list.json'));
      if (!resp.ok) throw new Error('Failed to fetch course list');
      const data = await resp.json();
      this.courses = data.courses;
      return this.courses;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async fetchCourseDetail(fileName) {
    try {
      const resp = await fetch(this.buildDataPath(`courses/${fileName}`));
      if (!resp.ok) throw new Error('Failed to fetch course detail');
      return normalizeCourseDetail(await resp.json());
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}
