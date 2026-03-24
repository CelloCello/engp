export class ProgressTracker {
  constructor() {
    this.storageKey = 'engp_progress';
    this.loadProgress();
  }

  buildWordKey(wordId) {
    return `word:${wordId}`;
  }

  buildGrammarChoiceKey(unitId, questionId) {
    return `grammar-choice:${unitId}:${questionId}`;
  }

  normalizeLegacyProgress(progress) {
    const normalized = {};

    Object.entries(progress || {}).forEach(([key, value]) => {
      const normalizedKey = key.includes(':') ? key : this.buildWordKey(key);
      normalized[normalizedKey] = value;
    });

    return normalized;
  }

  loadProgress() {
    try {
      const data = localStorage.getItem(this.storageKey);
      this.progress = data ? this.normalizeLegacyProgress(JSON.parse(data)) : {};
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
    this.recordResult(this.buildWordKey(wordId), isCorrect);
  }

  recordGrammarChoiceResult(unitId, questionId, isCorrect) {
    this.recordResult(this.buildGrammarChoiceKey(unitId, questionId), isCorrect);
  }

  recordResult(progressKey, isCorrect) {
    if (!this.progress[progressKey]) {
      this.progress[progressKey] = { correct: 0, total: 0 };
    }
    this.progress[progressKey].total += 1;
    if (isCorrect) {
      this.progress[progressKey].correct += 1;
    }
    this.saveProgress();
  }

  /**
   * 取得單字等級 (1~5)
   */
  getWordLevel(wordId) {
    return this.getLevel(this.buildWordKey(wordId));
  }

  getGrammarChoiceLevel(unitId, questionId) {
    return this.getLevel(this.buildGrammarChoiceKey(unitId, questionId));
  }

  getLevel(progressKey) {
    const stat = this.progress[progressKey];
    if (!stat || stat.total === 0) return 1; // 尚未測驗過
    
    const accuracy = stat.correct / stat.total;
    if (accuracy <= 0.2) return 1;
    if (accuracy <= 0.4) return 2;
    if (accuracy <= 0.6) return 3;
    if (accuracy <= 0.8) return 4;
    return 5;
  }
}
