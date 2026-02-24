# Math Practice Platform (MathP) 🐘

一個為小學生設計的數學練習平台，擁有可愛、清楚的介面，支援手機與平板的響應式設計 (RWD)。平台特色在於提供各種數學知識分類（如加法、減法、乘法等），並且開發上非常方便擴充其他數學題型！

## 🌟 核心功能 (Features)
- 🎨 **可愛設計 & RWD**：使用活潑的顏色、圓滑的按鈕與大字體，在手機或電腦上皆能舒適閱讀。
- 🎲 **隨機出題**：根據設定的邏輯動態隨機產生題目，每次挑戰都不同。
- ⏱️ **自動計算成績與時間**：測驗結束後會顯示正確率、答對題數以及總耗時，並給予對應的鼓勵。
- 🔧 **高擴充性**：透過簡單的配置檔，即可輕鬆新增像是「分數」、「小數」等全新挑戰分類。
- 🚀 **靜態部署**：本專案為 Single Page Application (SPA)，建置後全為靜態檔案，可直接部署於 GitHub Pages 上。

## 🛠️ 技術棧 (Tech Stack)
- **前端框架**: [React 18](https://reactjs.org/)
- **建置工具**: [Vite](https://vitejs.dev/) - 極速的開發體驗與建置。
- **樣式 (Styling)**: Vanilla CSS (純 CSS) - 透過 CSS Variables 定義了全局可愛主題。
- **字體**: Google Fonts (Nunito & Noto Sans TC)

## 🚀 如何開始 (Getting Started)

### 1. 安裝依賴 (Install Dependencies)
請先確保你的電腦有安裝 [Node.js](https://nodejs.org/)。接著在專案根目錄下執行：
```bash
npm install
```

### 2. 啟動開發伺服器 (Start Development Server)
```bash
npm run dev
```
執行後，可以在瀏覽器中開啟終端機提示的網址 (通常是 `http://localhost:5173/`) 來預覽與開發。

### 3. 建置為靜態檔案 (Build for Production)
若要將專案打包發布（例如放到 GitHub Pages 或任何靜態伺服器）：
```bash
npm run build
```
產生的檔案會放在 `dist` 資料夾中。你只要將 `dist` 內的檔案丟到靜態網頁伺服器即可運作！

*(註：本專案在 `vite.config.js` 已經設定 `base: './'`，可直接使用相對路徑來載入資源，非常適合發布在各類子目錄中)*

## 🧩 如何擴充新題型 (How to Add New Categories)

要新增不同的數學分類，只需編輯 `src/game/categories.js` 檔案即可。
在 `categories` 陣列中新增一個物件：

```javascript
{
  id: 'division_basic',      // 分類唯一 ID
  name: '基礎除法',            // 顯示名稱
  description: '能整除的除法',   // 簡單描述
  icon: '🍰',                // 可愛圖示
  color: '#a18cd1',          // 卡片背景顏色
  // 定義出題邏輯
  generateQuestion: () => {
    const b = Math.floor(Math.random() * 9) + 1;
    const answer = Math.floor(Math.random() * 9) + 1;
    const a = b * answer; // 確保能整除
    
    return {
      text: `${a} ÷ ${b} = ?`, // 顯示在畫面的題目
      answers: [answer],       // 支援多個正確答案的陣列格式
      type: 'number'
    };
  }
}
```
儲存後，首頁就會自動多出一個新分類，完全不需要修改 UI 程式碼！
