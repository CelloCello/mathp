# Math Practice Platform (MathP) 🐘

一個為小學生設計的數學練習平台，現在採用 `分類 → 單元 → 題數 → 作答 → 結果` 的固定流程，支援數字輸入、分數輸入、小數輸入、多欄填空與選擇題作答模式。題庫已內建基礎加減法、九九乘法、概數、分數、小數與四則運算單元。

## 核心功能

- `category → unit` 雙層題庫結構，讓同一分類下可以有多個獨立維護的單元
- `number`、`fraction`、`decimal`、`fields`、`choice` 題型介面與評分流程
- `evaluate(rawInput)` 題目契約，評分規則由題目自身定義，畫面只負責顯示與流程控制
- 分數輸入支援整數 `n`、分數 `a/b`、帶分數 `w a/b`
- 小數輸入使用精確十進位模型判分，接受等值尾端 `0`，例如 `4.560` 等於 `4.56`
- 概數單元只會出 `百位 / 千位 / 萬位` 與三種取概數方法的組合

## 技術棧

- React 18
- Vite 7
- Vanilla CSS
- Vitest

## 開發指令

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

## 題庫結構

題庫定義集中在 [src/game/categories.js](/Users/sero/dev/sero/mathp/src/game/categories.js)。

每個 category 都必須包含 `units[]`，每個 unit 都自己負責 `generateQuestion()`：

```js
{
  id: 'fractions',
  name: '分數',
  description: '真分數、假分數、帶分數與同分母加減',
  icon: '🥧',
  color: '#f6b93b',
  units: [
    {
      id: 'proper_fraction',
      name: '真分數',
      description: '從選項中找出分子小於分母的分數',
      generateQuestion: () => createChoiceQuestion(...)
    }
  ]
}
```

可用的查找 helper：

- `getCategoryById(categoryId)`
- `getUnitById(categoryId, unitId)`
- `createQuestionSet(categoryId, unitId, totalQuestions)` in [src/game/session.js](/Users/sero/dev/sero/mathp/src/game/session.js)

## Question Contract

每一題都必須回傳統一結構：

```js
{
  text: '1/4 + 1/4 = ?',
  inputMode: 'fraction', // 'number' | 'fraction' | 'decimal' | 'fields' | 'choice'
  placeholder: '例如 3/4',
  options: [{ value: '1/2', label: '1/2' }], // only for choice
  evaluate: (rawInput) => ({
    isCorrect: true,
    userAnswerLabel: '2/4',
    correctAnswerLabel: '1/2',
    validationError: null,
    note: null
  })
}
```

`evaluate(rawInput)` 的規則：

- `validationError` 不為 `null` 時，畫面不送出、不前進、不計分
- `userAnswerLabel` / `correctAnswerLabel` 必須直接可顯示在結果頁與錯題回顧
- 若題目有格式要求，可以用 `note` 補充，例如「這題要用帶分數作答」

共用 factory 位於 [src/game/questionFactories.js](/Users/sero/dev/sero/mathp/src/game/questionFactories.js)：

- `createNumberQuestion(...)`
- `createChoiceQuestion(...)`
- `createFractionQuestion(...)`
- `createDecimalQuestion(...)`
- `createFieldQuestion(...)`

## 分數規則

分數工具位於 [src/game/fractionUtils.js](/Users/sero/dev/sero/mathp/src/game/fractionUtils.js)。

目前支援：

- 解析 `n`、`a/b`、`w a/b`
- 分母不可為 `0`
- 帶分數的小分數部分必須是真分數
- 約分正規化與等值判定
- 依單元需求要求特定格式，例如 `帶分數` 轉換題要求輸入帶分數時，等值假分數仍算錯
- `分數加減` 目前會混出同分母的 `分數±分數`、`帶分數±分數`、`分數±帶分數`、`帶分數±帶分數`
- `分數加減` 的答案格式依結果決定：大於 1 的非整數要用帶分數、小於 1 用分數、整數結果用整數

## 小數規則

小數工具位於 [src/game/decimalUtils.js](/Users/sero/dev/sero/mathp/src/game/decimalUtils.js)。

目前支援：

- 解析非負整數與小數，不接受分數、逗號格式、負數或 `.5` 這類省略整數位的寫法
- 用整數縮放表示小數，避免 JavaScript floating point 誤差
- 格式化時移除不必要尾端 `0`，例如 `3420.000` 顯示為 `3420`
- `認識小數` 使用 `fields` 多欄填空，練習最小位值組成、位值展開與位值辨識
- `小數加減` 使用 `decimal` 單欄輸入，兩個 operand 都在 `0 ~ 100` 且減法不出負數
- `小數點移動` 使用 `decimal` 單欄輸入，練習乘除 `10^1` 到 `10^4`，倍率與乘法答案都不超過 `10000`

## 新增 Category / Unit 的方式

### 1. 新增一個 category

若是全新分類，直接在 [src/game/categories.js](/Users/sero/dev/sero/mathp/src/game/categories.js) 新增 category 物件，並提供至少一個 unit。

### 2. 在既有 category 下新增 unit

最常見的擴充方式是為既有 category 增加一個 unit：

```js
{
  id: 'multiplication_table',
  name: '九九乘法',
  description: '熟悉 1 到 9 的乘法表',
  icon: '🚀',
  color: '#fccb90',
  units: [
    existingUnit,
    {
      id: 'word_problems',
      name: '乘法應用題',
      description: '用情境題練習乘法',
      generateQuestion: () => createNumberQuestion({
        text: '3 盒每盒 4 顆，一共有幾顆？',
        answer: 12
      })
    }
  ]
}
```

### 3. 若需要新題型

優先遵守既有 question contract。只有在 `number / fraction / decimal / fields / choice` 不足時，才擴充新的 `inputMode` 與畫面渲染邏輯。這時至少要同步修改：

- [src/components/PlayScreen.jsx](/Users/sero/dev/sero/mathp/src/components/PlayScreen.jsx)
- [src/components/SummaryScreen.jsx](/Users/sero/dev/sero/mathp/src/components/SummaryScreen.jsx)
- 對應題目 factory / 工具模組
- 測試案例

## 測試覆蓋

目前測試位於 [src/game/categories.test.js](/Users/sero/dev/sero/mathp/src/game/categories.test.js)、[src/game/fractionUtils.test.js](/Users/sero/dev/sero/mathp/src/game/fractionUtils.test.js)、[src/game/decimalUtils.test.js](/Users/sero/dev/sero/mathp/src/game/decimalUtils.test.js)、[src/game/questionFactories.test.js](/Users/sero/dev/sero/mathp/src/game/questionFactories.test.js)、[src/game/session.test.js](/Users/sero/dev/sero/mathp/src/game/session.test.js)，覆蓋：

- category / unit schema 與 helper 查找
- 概數 generator 只出指定位數與方法
- 分數解析、格式驗證、等值判定
- 小數解析、格式驗證、精確運算、等值判定
- 小數分類三個單元的 generator 與答案驗證
- 帶分數格式要求
- category / unit 選擇後的出題流程 helper

## 目前內建單元

- 基礎加法 / `10 以內加法`
- 基礎減法 / `10 以內減法`
- 九九乘法 / `1 到 9 乘法表`
- 概數 / `百位到萬位概數`
- 分數 / `真分數`
- 分數 / `假分數`
- 分數 / `帶分數`
- 分數 / `分數的整數倍`
- 分數 / `分數加減`
- 小數 / `認識小數`
- 小數 / `小數加減`
- 小數 / `小數點移動`
- 四則運算 / `基礎整數運算`
