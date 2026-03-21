import { CourseManager } from './course-manager.js';
import { QuizEngine } from './quiz-engine.js';
import { ProgressTracker } from './progress-tracker.js';

const app = {
  courseManager: new CourseManager(),
  progressTracker: new ProgressTracker(),
  quizEngine: null,
  
  // DOM Elements
  screens: {
    home: document.getElementById('screen-home'),
    units: document.getElementById('screen-units'),
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result')
  },
  ctrls: {
    navPanel: document.getElementById('nav-controls'),
    btnBackHome: document.getElementById('btn-back-home')
  },

  async init() {
    this.bindEvents();
    await this.loadCourseList();
  },

  bindEvents() {
    this.ctrls.btnBackHome.addEventListener('click', () => this.showScreen('home'));
    document.getElementById('btn-back-materials').addEventListener('click', () => this.showScreen('home'));
    document.getElementById('btn-home-from-result').addEventListener('click', () => this.showScreen('home'));
    document.getElementById('btn-retry').addEventListener('click', () => {
      if (this.quizEngine) this.startQuiz();
    });
  },

  showScreen(name) {
    Object.values(this.screens).forEach(screen => {
      if(screen) screen.classList.add('hidden');
    });
    const target = this.screens[name];
    if(target) {
      target.classList.remove('hidden');
      // 強制瀏覽器重繪才能觸發 CSS transition
      void target.offsetWidth; 
    }
    
    if(name === 'home') {
      this.ctrls.navPanel.classList.add('hidden');
    } else {
      this.ctrls.navPanel.classList.remove('hidden');
    }
  },

  async loadCourseList() {
    const listContainer = document.getElementById('material-list-container');
    const courses = await this.courseManager.fetchCourseList();
    
    listContainer.innerHTML = '';
    
    if (courses.length === 0) {
      listContainer.innerHTML = '<p>無法載入教材資料。</p>';
      return;
    }

    courses.forEach(material => {
      const card = document.createElement('div');
      card.className = 'material-card';
      
      let html = `<h3>📚 ${material.title}</h3>`;
      if (material.description) html += `<div class="desc">${material.description}</div>`;
      if (material.info) html += `<div class="info">${material.info}</div>`;
      
      card.innerHTML = html;
      card.addEventListener('click', () => this.showMaterialUnits(material));
      listContainer.appendChild(card);
    });
  },

  showMaterialUnits(material) {
    document.getElementById('units-material-title').textContent = material.title;
    const unitsContainer = document.getElementById('unit-list-container');
    unitsContainer.innerHTML = '';

    material.units.forEach(unit => {
      const card = document.createElement('div');
      card.className = 'card unit-card';
      let html = `<h4>${unit.title}</h4>`;
      if (unit.description) html += `<p>${unit.description}</p>`;
      if (unit.wordCount !== undefined) html += `<p class="stats">單字數: ${unit.wordCount}</p>`;
      
      card.innerHTML = html;
      card.addEventListener('click', () => this.selectCourse(unit));
      unitsContainer.appendChild(card);
    });

    this.showScreen('units');
  },

  async selectCourse(courseBaseInfo) {
    const courseDetail = await this.courseManager.fetchCourseDetail(courseBaseInfo.file);
    if (!courseDetail) {
      alert("載入課程細節失敗！");
      return;
    }
    
    this.quizEngine = new QuizEngine(courseDetail, this.progressTracker);
    document.getElementById('quiz-course-title').textContent = courseDetail.courseInfo.title;
    this.startQuiz();
  },

  startQuiz() {
    this.showScreen('quiz');
    this.quizEngine.start();
    this.renderQuestion();
  },

  renderQuestion() {
    const q = this.quizEngine.getCurrentQuestion();
    if (!q) return;

    const { wordObj, hintArray } = q;
    const currentNum = this.quizEngine.currentIndex + 1;
    const totalNum = this.quizEngine.questions.length;
    
    document.getElementById('quiz-progress-text').textContent = `${currentNum} / ${totalNum}`;
    
    const container = document.getElementById('quiz-question-container');
    container.innerHTML = `
      <div class="quiz-prompt">${wordObj.meaning}</div>
      ${wordObj.phonetic ? `<div class="quiz-phonetic">${wordObj.phonetic}</div>` : ''}
      <div class="quiz-input-area" id="quiz-inputs"></div>
      <div class="action-buttons">
        <button id="btn-play-audio" class="btn-audio" title="聽發音">🔊</button>
        <button id="btn-submit-answer" class="btn btn-primary" disabled>確認送出</button>
      </div>
    `;

    // 建立輸入框
    const inputsContainer = document.getElementById('quiz-inputs');
    const inputs = [];
    
    for (let i = 0; i < wordObj.word.length; i++) {
      const char = wordObj.word[i];
      const isVisible = hintArray[i];
      
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'letter-input';
      input.dataset.index = i;
      input.dataset.char = char.toLowerCase();
      
      if (isVisible) {
        input.value = char;
        input.readOnly = true;
        input.classList.add('readonly-hint');
      }
      
      inputsContainer.appendChild(input);
      inputs.push(input);
    }
    
    // 設定焦點
    const firstEmpty = inputs.find(i => !i.readOnly);
    if(firstEmpty) setTimeout(() => firstEmpty.focus(), 100);

    const checkInputsComplete = () => {
      const isComplete = inputs.every(i => i.value.trim().length === 1);
      document.getElementById('btn-submit-answer').disabled = !isComplete;
    };

    // 事件綁定
    inputs.forEach((input, idx) => {
      input.addEventListener('input', (e) => {
        checkInputsComplete();
        // 如果輸入內容有效長度是1，自動跳下一個空格
        if (input.value.trim().length === 1) {
          const nextIdx = inputs.findIndex((inp, i) => i > idx && !inp.readOnly);
          if (nextIdx !== -1) inputs[nextIdx].focus();
        }
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value === '') {
          // 倒退跳上一個空格
          const prevInputs = inputs.slice(0, idx).reverse();
          const prevEditable = prevInputs.find(i => !i.readOnly);
          if(prevEditable) {
            e.preventDefault();
            prevEditable.focus();
            prevEditable.value = '';
            checkInputsComplete();
          }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const btn = document.getElementById('btn-submit-answer');
            if(!btn.disabled) btn.click();
        } else if (e.key === 'ArrowLeft') {
            const prevInputs = inputs.slice(0, idx).reverse();
            const prevEditable = prevInputs.find(i => !i.readOnly);
            if(prevEditable) prevEditable.focus();
        } else if (e.key === 'ArrowRight') {
            const nextIdx = inputs.findIndex((inp, i) => i > idx && !inp.readOnly);
            if (nextIdx !== -1) inputs[nextIdx].focus();
        }
      });
    });

    document.getElementById('btn-play-audio').addEventListener('click', () => {
      this.quizEngine.playAudio(wordObj.word);
    });

    document.getElementById('btn-submit-answer').addEventListener('click', () => {
      const userAnswer = inputs.map(i => i.value).join('');
      const isCorrect = this.quizEngine.submitAnswer(userAnswer);
      
      if(isCorrect) {
        // 設定正確樣式
        inputs.forEach(i => i.classList.add('correct'));
        this.showFeedback(true, () => {
          if(this.quizEngine.nextQuestion()){
            this.renderQuestion();
          } else {
            this.showResultSummary();
          }
        });
      } else {
        // 錯誤回饋：搖晃輸入框並不清除錯誤字母而改成紅色提示
        this.showFeedback(false);
        inputs.forEach(i => {
          if(!i.readOnly && i.value.toLowerCase() !== i.dataset.char) {
            i.classList.remove('error');
            void i.offsetWidth;
            i.classList.add('error');
            setTimeout(() => { 
                i.value = ''; 
                i.classList.remove('error'); 
                checkInputsComplete(); 
            }, 800);
          }
        });
        const firstEmpty = inputs.find(i => !i.readOnly);
        if(firstEmpty) setTimeout(() => firstEmpty.focus(), 850);
      }
    });

    // 進入題目自動發音一次
    setTimeout(() => this.quizEngine.playAudio(wordObj.word), 300);
  },

  showFeedback(isCorrect, callback) {
    const overlay = document.getElementById('feedback-overlay');
    const icon = document.getElementById('feedback-icon');
    
    icon.textContent = isCorrect ? '⭕' : '❌';
    icon.className = `feedback-anim ${isCorrect ? 'text-correct' : 'text-error'}`;
    overlay.classList.remove('hidden');
    
    setTimeout(() => {
      overlay.classList.add('hidden');
      if (callback) callback();
    }, 1200);
  },

  showResultSummary() {
    this.showScreen('result');
    const stats = this.quizEngine.getStats();
    
    document.getElementById('result-time').textContent = stats.timeSec;
    document.getElementById('result-accuracy').textContent = stats.accuracy;
    document.getElementById('result-correct').textContent = stats.correctCount;
    document.getElementById('result-total').textContent = stats.totalCount;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
