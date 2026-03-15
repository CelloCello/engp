export class CourseManager {
  constructor() {
    this.courses = [];
  }

  async fetchCourseList() {
    try {
      const resp = await fetch('/data/course-list.json');
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
      const resp = await fetch(`/data/courses/${fileName}`);
      if (!resp.ok) throw new Error('Failed to fetch course detail');
      return await resp.json();
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}
