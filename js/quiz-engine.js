export class QuizEngine {
  constructor(courseData, progressTracker) {
    this.courseData = courseData;
    this.vocab = courseData.vocabulary || [];
    this.progressTracker = progressTracker;
    this.totalQuestions = Math.min(10, this.vocab.length); 
    this.questions = [];
    this.currentIndex = 0;
    this.correctCount = 0;
    this.startTime = 0;
    this.endTime = 0;
    this.synth = window.speechSynthesis;
  }

  start() {
    this.startTime = Date.now();
    this.buildQuestions();
    this.currentIndex = 0;
    this.correctCount = 0;
  }

  buildQuestions() {
    // 根據熟練度排序，等級低的優先出現
    let pool = [...this.vocab];
    pool.sort((a, b) => {
      const levelA = this.progressTracker.getWordLevel(a.id);
      const levelB = this.progressTracker.getWordLevel(b.id);
      return levelA - levelB; // 等級低的在一開始
    });

    const selected = pool.slice(0, this.totalQuestions);
    // 稍微打亂順序，避免每次順序一樣
    this.questions = selected.sort(() => Math.random() - 0.5);
  }

  getCurrentQuestion() {
    if (this.currentIndex >= this.questions.length) return null;
    const wordObj = this.questions[this.currentIndex];
    return {
      wordObj,
      hintArray: this.generateHintPattern(wordObj.word)
    };
  }

  /**
   * 根據演算法產生提示遮罩：
   * true 表示顯示，false 表示挖空
   */
  generateHintPattern(word) {
    const len = word.length;
    let pattern = new Array(len).fill(false);
    
    // 首尾必顯示
    pattern[0] = true;
    if (len > 1) pattern[len - 1] = true;

    if (len >= 5 && len <= 7) {
      // 顯示1個中間字
      const mid = Math.floor(len / 2);
      pattern[mid] = true;
    } else if (len >= 8) {
      // 顯示2個中間字
      const q1 = Math.floor(len / 3);
      const q3 = Math.floor(len * 2 / 3);
      pattern[q1] = true;
      pattern[q3] = true;
    }

    return pattern;
  }

  submitAnswer(inputWord) {
    const currentQ = this.questions[this.currentIndex];
    const isCorrect = inputWord.toLowerCase() === currentQ.word.toLowerCase();
    
    // 記錄熟練度
    this.progressTracker.recordWordResult(currentQ.id, isCorrect);
    
    if (isCorrect) {
      this.correctCount++;
    }
    
    return isCorrect;
  }

  nextQuestion() {
    this.currentIndex++;
    if (this.currentIndex >= this.questions.length) {
      this.endTime = Date.now();
      return false; // 測驗結束
    }
    return true; // 還有下一題
  }

  getStats() {
    const timeSec = Math.floor((this.endTime - this.startTime) / 1000);
    const accuracy = this.questions.length > 0 
      ? Math.round((this.correctCount / this.questions.length) * 100) 
      : 0;
      
    return {
      timeSec,
      accuracy,
      correctCount: this.correctCount,
      totalCount: this.questions.length
    };
  }

  playAudio(text) {
    if (!this.synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8; // 稍微放慢速度，適合兒童聽
    this.synth.speak(utterance);
  }
}
