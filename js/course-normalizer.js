const LEGACY_VOCAB_STAGE_ID = 'quiz-vocabulary';

function normalizeStudyBlock(block, index) {
  return {
    id: block.id || `block-${index + 1}`,
    type: block.type || 'text',
    title: block.title || '',
    body: block.body || '',
    columns: Array.isArray(block.columns) ? block.columns : [],
    rows: Array.isArray(block.rows) ? block.rows : [],
    items: Array.isArray(block.items) ? block.items : [],
    src: block.src || '',
    alt: block.alt || '',
  };
}

function normalizeStage(stage, index) {
  const kind = stage.kind || 'study';

  if (kind === 'study') {
    return {
      id: stage.id || `study-${index + 1}`,
      kind,
      title: stage.title || '學習內容',
      description: stage.description || '',
      blocks: Array.isArray(stage.blocks)
        ? stage.blocks.map((block, blockIndex) => normalizeStudyBlock(block, blockIndex))
        : [],
    };
  }

  if (kind === 'quiz') {
    return {
      id: stage.id || `quiz-${index + 1}`,
      kind,
      engine: stage.engine || '',
      title: stage.title || '練習',
      description: stage.description || '',
      questions: Array.isArray(stage.questions) ? stage.questions : [],
    };
  }

  return null;
}

function buildLegacyVocabularyStage() {
  return {
    id: LEGACY_VOCAB_STAGE_ID,
    kind: 'quiz',
    engine: 'vocabulary-spelling',
    title: '單字測驗',
    description: '練習本單元的單字拼字。',
    questions: [],
  };
}

function stageHasContent(stage, courseData) {
  if (!stage) return false;

  if (stage.kind === 'study') {
    return stage.blocks.length > 0;
  }

  if (stage.kind === 'quiz' && stage.engine === 'vocabulary-spelling') {
    return Array.isArray(courseData.vocabulary) && courseData.vocabulary.length > 0;
  }

  if (stage.kind === 'quiz' && stage.engine === 'grammar-choice') {
    return stage.questions.length > 0;
  }

  return false;
}

export function normalizeCourseDetail(courseData) {
  const rawStages = Array.isArray(courseData.stages) && courseData.stages.length > 0
    ? courseData.stages
    : (Array.isArray(courseData.vocabulary) && courseData.vocabulary.length > 0
      ? [buildLegacyVocabularyStage()]
      : []);

  const stages = rawStages
    .map((stage, index) => normalizeStage(stage, index))
    .filter((stage) => stageHasContent(stage, courseData));

  return {
    ...courseData,
    stages,
  };
}

