import { CourseManager } from './course-manager.js';
import { QuizEngine } from './quiz-engine.js';
import { ProgressTracker } from './progress-tracker.js';

const app = {
  courseManager: new CourseManager(),
  progressTracker: new ProgressTracker(),
  quizEngine: null,
  currentMaterial: null,
  currentCourse: null,
  currentStage: null,

  // DOM Elements
  screens: {
    home: document.getElementById('screen-home'),
    units: document.getElementById('screen-units'),
    stages: document.getElementById('screen-stages'),
    study: document.getElementById('screen-study'),
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result')
  },
  ctrls: {
    navPanel: document.getElementById('nav-controls'),
    btnBackHome: document.getElementById('btn-back-home'),
    btnBackMaterials: document.getElementById('btn-back-materials'),
    btnBackUnitsFromStages: document.getElementById('btn-back-units-from-stages'),
    btnBackToStages: document.getElementById('btn-back-to-stages'),
    btnStudyNextStage: document.getElementById('btn-study-next-stage'),
    btnHomeFromResult: document.getElementById('btn-home-from-result'),
    btnRetry: document.getElementById('btn-retry')
  },

  async init() {
    this.bindEvents();
    await this.loadCourseList();
  },

  bindEvents() {
    this.ctrls.btnBackHome.addEventListener('click', () => this.showScreen('home'));
    this.ctrls.btnBackMaterials.addEventListener('click', () => this.showScreen('home'));
    this.ctrls.btnBackUnitsFromStages.addEventListener('click', () => {
      if (this.currentMaterial) {
        this.showMaterialUnits(this.currentMaterial);
      }
    });
    this.ctrls.btnBackToStages.addEventListener('click', () => this.showCourseStages());
    this.ctrls.btnHomeFromResult.addEventListener('click', () => this.showCourseStages());
    this.ctrls.btnRetry.addEventListener('click', () => {
      if (this.currentStage?.kind === 'quiz') {
        this.startQuizStage(this.currentStage);
      }
    });
    this.ctrls.btnStudyNextStage.addEventListener('click', () => {
      const nextQuizStage = this.getDefaultQuizStage();
      if (nextQuizStage) {
        this.enterStage(nextQuizStage.id);
      }
    });
  },

  showScreen(name) {
    Object.values(this.screens).forEach(screen => {
      if (screen) screen.classList.add('hidden');
    });
    const target = this.screens[name];
    if (target) {
      target.classList.remove('hidden');
      void target.offsetWidth;
    }

    if (name === 'home') {
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

      let html = `<h3>📚 ${this.escapeHtml(material.title)}</h3>`;
      if (material.description) html += `<div class="desc">${this.escapeHtml(material.description)}</div>`;
      if (material.info) html += `<div class="info">${this.escapeHtml(material.info)}</div>`;

      card.innerHTML = html;
      card.addEventListener('click', () => this.showMaterialUnits(material));
      listContainer.appendChild(card);
    });
  },

  showMaterialUnits(material) {
    this.currentMaterial = material;
    document.getElementById('units-material-title').textContent = material.title;
    const unitsContainer = document.getElementById('unit-list-container');
    unitsContainer.innerHTML = '';

    material.units.forEach(unit => {
      const card = document.createElement('div');
      card.className = 'card unit-card';
      let html = `<h4>${this.escapeHtml(unit.title)}</h4>`;
      if (unit.description) html += `<p>${this.escapeHtml(unit.description)}</p>`;
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
      alert('載入課程細節失敗！');
      return;
    }

    this.currentCourse = courseDetail;
    this.currentStage = null;
    this.showCourseStages();
  },

  showCourseStages() {
    if (!this.currentCourse) return;

    document.getElementById('stages-course-title').textContent = this.currentCourse.courseInfo.title;
    document.getElementById('stages-course-subtitle').textContent = '選擇這個單元要進行的階段';

    const stageContainer = document.getElementById('stage-list-container');
    stageContainer.innerHTML = '';

    if (!Array.isArray(this.currentCourse.stages) || this.currentCourse.stages.length === 0) {
      stageContainer.innerHTML = `
        <div class="empty-state">
          <h3>這個單元還沒有可進入的內容</h3>
          <p>請檢查單元 JSON 是否有設定正確的學習或測驗階段。</p>
        </div>
      `;
      this.showScreen('stages');
      return;
    }

    this.currentCourse.stages.forEach(stage => {
      const card = document.createElement('div');
      card.className = 'card stage-card';
      const icon = stage.kind === 'study' ? '📘' : '🎯';
      const ctaLabel = stage.kind === 'study' ? '開始學習' : '開始練習';

      card.innerHTML = `
        <div class="stage-badge">${icon} ${stage.kind === 'study' ? '學習階段' : '測驗階段'}</div>
        <h3>${this.escapeHtml(stage.title)}</h3>
        <p>${this.escapeHtml(stage.description || '進入這個階段開始學習。')}</p>
        <button class="btn ${stage.kind === 'study' ? 'btn-secondary' : 'btn-primary'}">${ctaLabel}</button>
      `;

      card.querySelector('button').addEventListener('click', () => this.enterStage(stage.id));
      stageContainer.appendChild(card);
    });

    this.showScreen('stages');
  },

  enterStage(stageId) {
    const stage = this.currentCourse?.stages?.find((item) => item.id === stageId);
    if (!stage) return;

    if (stage.kind === 'study') {
      this.renderStudyStage(stage);
      return;
    }

    if (stage.kind === 'quiz') {
      this.startQuizStage(stage);
    }
  },

  renderStudyStage(stage) {
    this.currentStage = stage;
    document.getElementById('study-stage-title').textContent = `${this.currentCourse.courseInfo.title}・${stage.title}`;
    document.getElementById('study-stage-description').textContent = stage.description || '';

    const container = document.getElementById('study-content-container');
    container.innerHTML = stage.blocks.map((block) => this.renderStudyBlockHtml(block)).join('');

    const nextQuizStage = this.getDefaultQuizStage();
    if (nextQuizStage) {
      this.ctrls.btnStudyNextStage.classList.remove('hidden');
      this.ctrls.btnStudyNextStage.textContent = `前往${nextQuizStage.title}`;
    } else {
      this.ctrls.btnStudyNextStage.classList.add('hidden');
    }

    this.showScreen('study');
  },

  renderStudyBlockHtml(block) {
    const title = block.title ? `<h3>${this.escapeHtml(block.title)}</h3>` : '';

    if (block.type === 'text') {
      return `
        <section class="study-block">
          ${title}
          ${this.renderParagraphs(block.body)}
        </section>
      `;
    }

    if (block.type === 'callout') {
      return `
        <section class="study-block study-callout">
          ${title}
          ${this.renderParagraphs(block.body)}
        </section>
      `;
    }

    if (block.type === 'table') {
      const headerHtml = block.columns.map((column) => `<th>${this.escapeHtml(column)}</th>`).join('');
      const rowHtml = block.rows.map((row) => `
        <tr>
          ${row.map((cell) => `<td>${this.escapeHtml(cell)}</td>`).join('')}
        </tr>
      `).join('');

      return `
        <section class="study-block">
          ${title}
          <div class="table-wrapper">
            <table class="study-table">
              <thead><tr>${headerHtml}</tr></thead>
              <tbody>${rowHtml}</tbody>
            </table>
          </div>
        </section>
      `;
    }

    if (block.type === 'example-list') {
      const listHtml = block.items.map((item) => `
        <li>
          <div class="example-en">${this.escapeHtml(item.english || '')}</div>
          <div class="example-zh">${this.escapeHtml(item.chinese || '')}</div>
        </li>
      `).join('');

      return `
        <section class="study-block">
          ${title}
          <ul class="example-list">${listHtml}</ul>
        </section>
      `;
    }

    if (block.type === 'image' && block.src) {
      return `
        <section class="study-block">
          ${title}
          <img class="study-image" src="${this.escapeHtml(block.src)}" alt="${this.escapeHtml(block.alt || block.title || '學習圖片')}">
        </section>
      `;
    }

    console.warn(`Unsupported study block type: ${block.type}`);
    return `
      <section class="study-block study-fallback">
        ${title}
        <p>這個內容區塊目前還不支援顯示。</p>
      </section>
    `;
  },

  renderParagraphs(text = '') {
    return text
      .split('\n')
      .filter(Boolean)
      .map((paragraph) => `<p>${this.escapeHtml(paragraph)}</p>`)
      .join('');
  },

  getDefaultQuizStage() {
    return this.currentCourse?.stages?.find((stage) => stage.kind === 'quiz') || null;
  },

  startQuizStage(stage) {
    this.currentStage = stage;
    this.quizEngine = new QuizEngine(this.currentCourse, stage, this.progressTracker);
    document.getElementById('quiz-course-title').textContent = `${this.currentCourse.courseInfo.title}・${stage.title}`;
    this.showScreen('quiz');
    this.quizEngine.start();
    this.renderQuestion();
  },

  renderQuestion() {
    const q = this.quizEngine.getCurrentQuestion();
    const container = document.getElementById('quiz-question-container');

    if (!q) {
      container.innerHTML = '<p>目前沒有可作答的題目。</p>';
      return;
    }

    const currentNum = this.quizEngine.currentIndex + 1;
    const totalNum = this.quizEngine.questions.length;
    document.getElementById('quiz-progress-text').textContent = `${currentNum} / ${totalNum}`;

    if (q.type === 'grammar-choice') {
      this.renderGrammarChoiceQuestion(q.questionObj, container);
      return;
    }

    this.renderVocabularyQuestion(q.wordObj, q.hintArray, container);
  },

  renderVocabularyQuestion(wordObj, hintArray, container) {
    container.innerHTML = `
      <div class="quiz-prompt">${this.escapeHtml(wordObj.meaning)}</div>
      ${wordObj.phonetic ? `<div class="quiz-phonetic">${this.escapeHtml(wordObj.phonetic)}</div>` : ''}
      <div class="quiz-input-area" id="quiz-inputs"></div>
      <div class="action-buttons">
        <button id="btn-play-audio" class="btn-audio" title="聽發音">🔊</button>
        <button id="btn-submit-answer" class="btn btn-primary" disabled>確認送出</button>
      </div>
      <div id="quiz-feedback-panel"></div>
    `;

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

    const firstEmpty = inputs.find(i => !i.readOnly);
    if (firstEmpty) setTimeout(() => firstEmpty.focus(), 100);

    const checkInputsComplete = () => {
      const isComplete = inputs.every(i => i.value.trim().length === 1);
      document.getElementById('btn-submit-answer').disabled = !isComplete;
    };

    inputs.forEach((input, idx) => {
      input.addEventListener('input', () => {
        checkInputsComplete();
        if (input.value.trim().length === 1) {
          const nextIdx = inputs.findIndex((inp, i) => i > idx && !inp.readOnly);
          if (nextIdx !== -1) inputs[nextIdx].focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value === '') {
          const prevInputs = inputs.slice(0, idx).reverse();
          const prevEditable = prevInputs.find(i => !i.readOnly);
          if (prevEditable) {
            e.preventDefault();
            prevEditable.focus();
            prevEditable.value = '';
            checkInputsComplete();
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const btn = document.getElementById('btn-submit-answer');
          if (!btn.disabled) btn.click();
        } else if (e.key === 'ArrowLeft') {
          const prevInputs = inputs.slice(0, idx).reverse();
          const prevEditable = prevInputs.find(i => !i.readOnly);
          if (prevEditable) prevEditable.focus();
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
      const result = this.quizEngine.submitAnswer(userAnswer);

      if (result.isCorrect) {
        inputs.forEach(i => i.classList.add('correct'));
        this.showFeedback(true, () => this.advanceQuiz());
      } else {
        this.showFeedback(false);
        inputs.forEach(i => {
          if (!i.readOnly && i.value.toLowerCase() !== i.dataset.char) {
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
        const firstEditable = inputs.find(i => !i.readOnly);
        if (firstEditable) setTimeout(() => firstEditable.focus(), 850);
      }
    });

    setTimeout(() => this.quizEngine.playAudio(wordObj.word), 300);
  },

  renderGrammarChoiceQuestion(questionObj, container) {
    container.innerHTML = `
      <div class="quiz-tag">文法選擇題</div>
      <div class="quiz-prompt quiz-prompt-md">${this.escapeHtml(questionObj.prompt)}</div>
      <div class="quiz-stem">${this.escapeHtml(questionObj.stem)}</div>
      <div class="quiz-choice-list" id="quiz-choice-list"></div>
      <div id="quiz-feedback-panel"></div>
    `;

    const choicesContainer = document.getElementById('quiz-choice-list');

    questionObj.choices.forEach((choice, index) => {
      const button = document.createElement('button');
      button.className = 'quiz-choice-btn';
      button.textContent = choice;
      button.addEventListener('click', () => {
        if (button.disabled) return;

        const result = this.quizEngine.submitAnswer(index);
        const buttons = Array.from(choicesContainer.querySelectorAll('button'));
        buttons.forEach((btn, btnIndex) => {
          btn.disabled = true;
          if (btnIndex === questionObj.correctIndex) {
            btn.classList.add('choice-correct');
          } else if (btnIndex === index) {
            btn.classList.add('choice-error');
          }
        });

        const feedbackPanel = document.getElementById('quiz-feedback-panel');
        feedbackPanel.innerHTML = `
          <div class="quiz-explanation ${result.isCorrect ? 'is-correct' : 'is-error'}">
            <h3>${result.isCorrect ? '答對了！' : `正解：${this.escapeHtml(result.expectedAnswer)}`}</h3>
            ${result.explanation ? `<p>${this.escapeHtml(result.explanation)}</p>` : ''}
          </div>
        `;

        if (result.isCorrect) {
          this.showFeedback(true, null, 700);
          setTimeout(() => this.advanceQuiz(), 1400);
        } else {
          this.showFeedback(false, null, 700);
          setTimeout(() => this.advanceQuiz(), 1800);
        }
      });
      choicesContainer.appendChild(button);
    });
  },

  advanceQuiz() {
    if (this.quizEngine.nextQuestion()) {
      this.renderQuestion();
    } else {
      this.showResultSummary();
    }
  },

  showFeedback(isCorrect, callback, duration = 1200) {
    const overlay = document.getElementById('feedback-overlay');
    const icon = document.getElementById('feedback-icon');

    icon.textContent = isCorrect ? '⭕' : '❌';
    icon.className = `feedback-anim ${isCorrect ? 'text-correct' : 'text-error'}`;
    overlay.classList.remove('hidden');

    setTimeout(() => {
      overlay.classList.add('hidden');
      if (callback) callback();
    }, duration);
  },

  showResultSummary() {
    this.showScreen('result');
    const stats = this.quizEngine.getStats();
    const wrongReviewSection = document.getElementById('result-wrong-review');
    const perfectMessage = document.getElementById('result-perfect-message');
    const wrongList = document.getElementById('result-wrong-list');

    document.getElementById('result-stage-title').textContent = `${this.currentCourse.courseInfo.title}・${this.currentStage.title}`;
    document.getElementById('result-time').textContent = stats.timeSec;
    document.getElementById('result-accuracy').textContent = stats.accuracy;
    document.getElementById('result-correct').textContent = stats.correctCount;
    document.getElementById('result-total').textContent = stats.totalCount;

    if (this.currentStage?.engine !== 'grammar-choice') {
      wrongReviewSection.classList.add('hidden');
      perfectMessage.classList.add('hidden');
      wrongList.innerHTML = '';
      return;
    }

    wrongReviewSection.classList.remove('hidden');

    if (stats.wrongQuestions.length === 0) {
      perfectMessage.classList.remove('hidden');
      wrongList.innerHTML = '';
      return;
    }

    perfectMessage.classList.add('hidden');
    wrongList.innerHTML = stats.wrongQuestions.map((item, index) => `
      <article class="card result-wrong-card">
        <div class="result-wrong-index">第 ${index + 1} 題</div>
        ${item.prompt ? `<p class="result-wrong-prompt">${this.escapeHtml(item.prompt)}</p>` : ''}
        <p class="result-wrong-stem">${this.escapeHtml(item.stem)}</p>
        <p><strong>你的答案：</strong>${this.escapeHtml(item.userAnswer)}</p>
        <p><strong>正確答案：</strong>${this.escapeHtml(item.expectedAnswer)}</p>
        ${item.explanation ? `<p><strong>解釋：</strong>${this.escapeHtml(item.explanation)}</p>` : ''}
      </article>
    `).join('');
  },

  escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
