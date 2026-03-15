# 兒童英文複習 (English Practice App)

這是一個專為兒童設計的互動式英文學習網頁應用程式，旨在透過趣味及視覺化的介面，幫助孩子有效複習英文單字、未來亦將擴增句型與文法練習。

## 🌟 系統特色

* **無後端依賴**：完全基於前端建構（靜態檔案託管），所有教材資料皆透過 JSON 動態載入。
* **兒童友善介面**：採用高對比、護眼且充滿活力的色彩配色，搭配明確的動畫和表情符號（如答對時的「⭕」放大回饋，答錯時的視窗震動），提升學習興致。
* **原生語音支援**：整合瀏覽器內建 `Web Speech API` (TTS) 作為發音來源，且已預先調整成較慢的語速 (0.8x)，適合兒童聆聽。不須額外準備大量音效檔。
* **智慧學習追蹤**：運用 LocalStorage 即時記錄每位學習者的答題正確率，將各單字熟練度分為 5 個等級 (Level 1~5)。系統會自動加權出現頻率，讓「不熟的單字多考幾遍」。
* **響應式平板優先**：介面佈局針對平板電腦（學習載具大宗）優化，按鈕寬大易觸控，並相容手機與桌機。

## 🚀 快速開始

本專案使用 [Vite](https://vitejs.dev/) 作為建置工具。

### 安裝依賴
```bash
npm install
```

### 開發伺服器 (開發模式)
啟動本機伺服器以進行開發與預覽：
```bash
npm run dev
```
預設會運行在 `http://localhost:5173`。

### 建置與部署 (生產模式)
```bash
npm run build
```
將會生成一個 `dist` 資料夾，裡面包含所有已壓縮、最佳化過後的靜態檔案（HTML, CSS, JS, JSON 資料與圖片），可以直接部署至 GitHub Pages 或任何靜態資源伺服器。

## 📁 專案結構

```
engp/
├── index.html                   # 主系統入口，包含所有 UI 容器 (SPA)
├── css/
│   └── style.css                # 主視覺與所有元件樣式定型
├── js/
│   ├── main.js                  # 處理 UI 切換、控制流程與綁定 DOM 事件
│   ├── course-manager.js        # 負責透過 fetch 讀取 JSON 並管理課程資料
│   ├── quiz-engine.js           # 測驗邏輯核心：計算提示格子、比對答案、操作語音
│   └── progress-tracker.js      # 處理 LocalStorage 存取與五階段熟練度評估演算法
├── public/
│   └── data/
│       ├── course-list.json     # 課程全域索引 (包含 教材 > 單元 兩層架構)
│       └── courses/             # 依據架構存放單元 JSON 檔 (例如: everybody-up/unit1.json)
└── package.json
```

## 📖 教材匯入格式 (JSON)

所有課程的資料可由非技術人員於 `public/data/courses/` 手動編輯或擴增。
資料必須符合以下結構：

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
      "difficulty": 1
    }
    // ...更多單字
  ],
  "sentences": [], // 擴充中
  "grammar": []    // 擴充中
}
```

```json
{
  "courses": [
    {
      "id": "material-everybody-up",
      "title": "三年級 EveryBody Up",
      "units": [
        {
          "id": "eu-u1",
          "title": "Unit 1",
          "description": "水果 Fruits",
          "file": "everybody-up/unit1.json",
          "wordCount": 5
        }
      ]
    }
  ]
}
```

而實際的單元教材內容則會放置於 `public/data/courses/{material}/{unit}.json` 對應的資料夾中，格式同前述的課程單元格式。
