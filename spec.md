## 專案目標
製作一個給兒童複習英文的網頁應用程式，提供互動式學習體驗，幫助兒童有效複習英文單字、句型和文法。


### 系統特色
- 純靜態網頁，無需後端伺服器
    - 單檔或是可以輕鬆發布於 github page
- 靜態檔案託管，無動態後端依賴
- 響應式設計，適配平板、手機、電腦
- 兒童友善介面設計 (清楚、可愛、簡潔)
- 資料由 json 載入，可以分教材、單元
- 基本都是亂數出題，可設定出題數量、會自動計算答題時間以及正確率，答完設定的題目數就結束，顯示統計的結果
- 使用瀏覽器原生 API，無需外部語音檔案


## 資料結構設計

### 檔案架構
```
/data
  /courses
    - course-list.json          # 課程索引檔
    - elementary-unit1.json     # 各課程獨立檔案
    - elementary-unit2.json
    - junior-unit1.json
    ...
```

### 課程內容結構
每個課程檔案包含：
- **課程資訊**: 課程名稱、級別、單元編號
- **單字內容**: 單字、音標、中文意思、例句
- **句型內容**: 句型架構、例句 (中英對照)
- **文法內容**: 文法架構、例句 (中英對照)

## 核心功能

### 學習模式
- **單字複習**: 依課程或跨課程複習單字
- **句型練習**: 學習句型架構和應用
- **文法學習**: 基礎文法規則練習
- **混合模式**: 隨機出現各類題型

### 題型設計

#### 單字填空題
- **克漏字形式**: 給予中文意思及前後字母提示
- **範例**: "貓" → c_t
- **提示演算法**: 
  - 短單字 (≤4字母): 顯示首尾字母
  - 中等單字 (5-7字母): 顯示首字母 + 1-2個中間字母
  - 長單字 (≥8字母): 顯示首尾字母 + 2-3個中間字母
- **難度調整**: 根據熟練度調整提示字母數量

#### 句型填空題
- **句型練習**: 給予中文句子，填入關鍵字詞
- **範例**: 
  - 英文: "The book is in front of me."
  - 中文: "那本書在我前面"
  - 題目: "The book is __ ____ __ me." (那本書在我前面)
- **挖空策略**: 
  - 介系詞片語: "in front of" → "__ ____ __"
  - 動詞變化: "is eating" → "__ ____"
  - 關鍵單字: 依照課程重點挖空

#### 文法練習題
- **選擇題**: 選擇正確的文法形式
  - 範例: "I ___ an apple." (a) eat (b) eats (c) eating
- **排序題**: 將句子重新排列
  - 範例: [apple, an, eat, I] → "I eat an apple."
- **轉換題**: 句型轉換練習
  - 範例: 肯定句 → 疑問句

### 進度追蹤系統
- **熟練度記錄**: 使用 Local Storage 儲存學習進度
- **五級分類**: 根據回答正確率分為五個熟練等級
  - Level 1: 0-20% (需加強)
  - Level 2: 21-40% (初學)
  - Level 3: 41-60% (進步中)
  - Level 4: 61-80% (良好)
  - Level 5: 81-100% (熟練)
- **個別追蹤**: 單字、句型、文法分別記錄熟練程度
- **智慧複習**: 依熟練度調整出題頻率
  - Level 1-2: 高頻出現 (權重 3-4)
  - Level 3: 中等頻率 (權重 2)
  - Level 4-5: 低頻複習 (權重 1)

### 語音功能
- **單字發音**: 使用瀏覽器內建 Web Speech API (TTS) 播放單字發音
- **例句朗讀**: 支援完整例句語音播放
- **發音設定**: 可調整語速、音調，適合兒童學習
- **無檔案依賴**: 不需要維護音頻檔案，減少專案大小

## 用戶體驗設計

### 介面設計原則
- **清楚易懂**: 大字體、高對比度、簡潔佈局
- **色彩友善**: 適合兒童的溫和配色方案
- **互動回饋**: 答題正確/錯誤的視覺和聲音回饋
- **進度顯示**: 清楚的學習進度和成就顯示

### 響應式設計
- **平板優先**: 主要針對平板使用體驗最佳化
- **多裝置支援**: 手機和電腦也能正常使用
- **觸控友善**: 按鈕大小適合觸控操作

## 擴展功能

### 學習管理
- **課程選擇**: 可選擇特定課程或混合複習
- **難度調整**: 根據學習者程度調整題目難度
- **學習報告**: 顯示學習統計和弱點分析
- **成就系統**: 完成學習里程碑獲得徽章和獎勵
- **家長模式**: 查看孩子學習進度和建議

### 系統優化
- **載入優化**: 按需載入課程內容，提升效能
- **快取機制**: 智慧快取常用課程和資源
- **離線支援**: 快取機制支援部分離線使用
- **效能監控**: 追蹤載入時間和使用者互動

### 維護便利性
- **模組化設計**: 課程內容獨立管理
- **版本控制**: 支援課程內容更新和版本管理
- **擴展性**: 易於新增課程和功能模組
- **內容管理**: JSON 格式便於非技術人員編輯課程內容
- **A/B 測試**: 支援不同教學方法的效果測試

## 檔案結構設計

### 建議的目錄結構：
```
engp/
├── index.html                    # 主頁面
├── css/
│   └── style.css                # 主樣式檔案
├── js/
│   ├── main.js                  # 主程式邏輯
│   ├── course-manager.js        # 課程管理模組
│   ├── quiz-engine.js           # 題目產生引擎
│   └── progress-tracker.js      # 進度追蹤模組
├── data/
│   ├── course-list.json         # 課程索引檔
│   └── courses/                 # 課程內容目錄
│       ├── elementary-unit1.json
│       ├── elementary-unit2.json
│       ├── junior-unit1.json
│       └── ...
└── assets/
    ├── images/                  # 圖片資源
    │   ├── icons/
    │   └── illustrations/
    └── sounds/                  # 音效檔案（非語音）
        ├── correct.mp3
        └── wrong.mp3
```

### 課程索引檔 (course-list.json)：
```json
{
  "courses": [
    {
      "id": "elementary-unit1",
      "title": "國小英文第一課 - 水果",
      "level": "elementary",
      "unit": 1,
      "description": "學習基本水果單字",
      "file": "elementary-unit1.json",
      "wordCount": 10,
      "sentenceCount": 5
    },
    {
      "id": "elementary-unit2", 
      "title": "國小英文第二課 - 顏色",
      "level": "elementary",
      "unit": 2,
      "description": "學習基本顏色單字",
      "file": "elementary-unit2.json",
      "wordCount": 8,
      "sentenceCount": 4
    }
  ]
}
```

### 個別課程檔案 (elementary-unit1.json)：
```json
{
  "courseInfo": {
    "id": "elementary-unit1",
    "title": "水果 Fruits",
    "level": "elementary",
    "unit": 1,
    "version": "1.0"
  },
  "vocabulary": [
    {
      "id": "apple",
      "word": "apple",
      "phonetic": "/ˈæp.əl/",
      "meaning": "蘋果",
      "partOfSpeech": "noun",
      "examples": [
        {
          "english": "I eat an apple every day.",
          "chinese": "我每天吃一個蘋果。"
        }
      ],
      "difficulty": 1
    }
  ],
  "sentences": [
    {
      "id": "sentence1",
      "pattern": "I like [fruit].",
      "chinese": "我喜歡[水果]。",
      "examples": [
        {
          "english": "I like apples.",
          "chinese": "我喜歡蘋果。"
        }
      ]
    }
  ],
  "grammar": [
    {
      "id": "present-simple",
      "title": "現在簡單式",
      "structure": "主詞 + 動詞原形",
      "examples": [
        {
          "english": "I eat fruit.",
          "chinese": "我吃水果。"
        }
      ]
    }
  ]
}
```
