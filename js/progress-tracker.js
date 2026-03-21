export class ProgressTracker {
  constructor() {
    this.storageKey = 'engp_progress';
    this.loadProgress();
  }

  loadProgress() {
    try {
      const data = localStorage.getItem(this.storageKey);
      this.progress = data ? JSON.parse(data) : {};
    } catch (e) {
      this.progress = {};
    }
  }

  saveProgress() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
  }

  /**
   * 記錄單字答題結果
   * @param {string} wordId
   * @param {boolean} isCorrect
   */
  recordWordResult(wordId, isCorrect) {
    if (!this.progress[wordId]) {
      this.progress[wordId] = { correct: 0, total: 0 };
    }
    this.progress[wordId].total += 1;
    if (isCorrect) {
      this.progress[wordId].correct += 1;
    }
    this.saveProgress();
  }

  /**
   * 取得單字等級 (1~5)
   */
  getWordLevel(wordId) {
    const stat = this.progress[wordId];
    if (!stat || stat.total === 0) return 1; // 尚未測驗過
    
    const accuracy = stat.correct / stat.total;
    if (accuracy <= 0.2) return 1;
    if (accuracy <= 0.4) return 2;
    if (accuracy <= 0.6) return 3;
    if (accuracy <= 0.8) return 4;
    return 5;
  }
}
