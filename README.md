# Math Practice Platform (MathP) 🐘

一個為小學生設計的數學練習平台，採用 `分類 → 單元 → 題數 → 作答 → 結果` 的固定流程，支援數字輸入、分數輸入、小數輸入、多欄填空與選擇題。題庫包含基礎加減法、九九乘法、因數與倍數、概數、分數、小數、四則運算、面積與線對稱，共 10 個分類、30 個單元。

## 核心功能

- `category → unit` 雙層題庫結構，讓同一分類下可以有多個獨立維護的單元
- `number`、`fraction`、`decimal`、`fields`、`choice` 題型介面與評分流程
- `evaluate(rawInput)` 題目契約，評分規則由題目自身定義，畫面只負責顯示與流程控制
- 分數輸入支援整數 `n`、分數 `a/b`、帶分數 `w a/b`
- 小數輸入使用精確十進位模型判分，接受等值尾端 `0`，例如 `4.560` 等於 `4.56`
- 概數單元只會出 `百位 / 千位 / 萬位` 與三種取概數方法的組合
- 因數與倍數依五年級程度使用列舉法，練習因數配對、公因數、公倍數及最大最小關係

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
  description: '真分數、假分數、帶分數、等值分數與同分母加減',
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

## 因數與倍數規則

整數因數工具位於 [src/game/factorUtils.js](/Users/sero/dev/sero/mathp/src/game/factorUtils.js)。

目前支援：

- `找因數` 混合因數辨認、完整因數配對與列出全部因數，目標數不超過 `100`
- `公因數與最大公因數` 只處理 `6 ~ 60` 的兩個相異正整數，以列出兩數各自因數再求最大公因數的分步題為主，並保留直接作答題；包含共同因數只有 `1` 的特例
- `公倍數與最小公倍數` 使用 `2 ~ 12` 的兩個相異正整數，最小公倍數不超過 `120`
- 倍數從第一個正倍數開始，不把 `0` 放進題目
- 因數列表可用半形逗號、全形逗號、頓號或空格分隔；答案順序不拘，但不可重複或缺漏
- 複合填空題答錯後會保留正確答案與作答內容，由學生確認後手動進入下一題
- 全部題目以列舉與整數乘除關係為主，不使用短除法、質因數分解或「互質」術語

## 分數規則

分數工具位於 [src/game/fractionUtils.js](/Users/sero/dev/sero/mathp/src/game/fractionUtils.js)。

目前支援：

- 解析 `n`、`a/b`、`w a/b`
- 分母不可為 `0`
- 帶分數的小分數部分必須是真分數
- 約分正規化與等值判定
- 依單元需求要求特定格式，例如 `帶分數` 轉換題要求輸入帶分數時，等值假分數仍算錯
- `等值分數` 使用多欄填空，練習寫兩組等值分數，以及把不同分母分數或帶分數通成同分母後比較大小
- `等值分數` 的比較題呈現為左右等式鏈，例如 `1/2 = 3/6 > 2/6 = 1/3`，比較符號使用 `>`、`<`、`=` 三個按鈕點選
- `同分母分數加減` 混合 `分數±分數`、`帶分數±分數`、`分數±帶分數`、`帶分數±帶分數`
- `同分母分數加減` 的答案格式依結果決定：大於 1 的非整數要用帶分數、小於 1 用分數、整數結果用整數
- `異分母通分練習` 使用多欄填空，練習真分數異分母加減的通分分子與結果分子，答案小於 1；分母有倍數關係的題目占 60%，加減各半
- `異分母分數加減` 直接輸入答案，包含真分數加減、和超過 1、和為整數；`異分母帶分數加減` 包含不需進退位、加法進位與減法借位
- `分數生活應用` 混合合計、剩餘、相差與反求原有量，數字與情境一起變化
- 異分母題的分母介於 `2～12`，最小公倍數不超過 `60`；帶分數計算的整數部分為 `1～5`，減法結果為正數
- 三個新增分數單元接受等值分數、假分數、帶分數或整數，標準答案以整數、真分數或帶分數呈現；原有格式轉換題仍要求指定形式

## 五年級練習與題型分配

以下 13 個練習單元透過 `createPracticeUnit` 宣告 `practiceVariants`，每回合先按權重分配題數，再隨機生成題目：

| 分類／單元 | 題型權重 |
| --- | --- |
| 分數／異分母通分練習 | 倍數分母加、減各 30%；一般分母加、減各 20% |
| 分數／異分母分數加減 | 基礎加、減各 30%；和超過 1 占 30%；和為整數占 10% |
| 分數／異分母帶分數加減 | 不進位加法、不借位減法各 20%；進位、借位各 30% |
| 分數／分數生活應用 | 合計 40%；剩餘、相差、原有量各 20% |
| 四則運算／整數運算順序 | 同級 30%；乘除優先 40%；小括號 20%；多層括號 10% |
| 四則運算／連除與多步驟應用 | 連除、兩步驟各 40%；三步驟 20% |
| 四則運算／分配律與簡便計算 | 展開、合併填空各 40%；等值算式選擇 20% |
| 四則運算／平均問題 | 平均 60%；總量、缺少資料各 20% |
| 面積／平行四邊形面積、三角形面積、梯形面積 | 各單元辨認高 20%；求面積 60%；反求底或高 20%（梯形只反求高） |
| 面積／面積綜合練習 | 三種基本圖形均分 |
| 線對稱／方格上的對稱點 | 水平、垂直對稱軸各 50% |

- 題數選項為 `5、10、20、50`；比例不足整題時採最大餘數法分配，餘數相同時隨機決定。同層級題目隨機排列，進階題排在後面
- 同一回合不重複相同題目；數值面積題不只靠換標記或外觀算成新題。跨回合仍可能再出現同一題
- 這批單元答錯後會顯示解題步驟，按「下一題」才繼續；錯題回顧保留原始圖形及步驟
- `整數運算順序`、`異分母通分練習` 與重新命名的 `同分母分數加減` 保留原單元 ID

## 面積與線對稱

- 面積圖形由尺寸資料即時計算 SVG 頂點，尺寸與判分共用同一資料；底、高介於 `2～20` 公分，答案為整數。圖形包含鏡射及傾斜變化，不混入單位換算
- 辨認高的選項會打亂線段標記；圖形避免出現另一條同樣垂直的斜邊。反求題不在圖形或替代文字中顯示未知尺寸
- 面積綜合練習只涵蓋平行四邊形、三角形與梯形，不包含複合圖形
- 對稱點在 `10 × 10` 方格上依鏡射公式生成，離軸 `1～4` 格，先近後遠；選項包含距離錯誤、方向錯誤與軸同側的點
- 線對稱採 A～D 選點，不需要輸入座標或自由作圖；圖形附有可供輔助技術讀取的位置說明

## 小數規則

小數工具位於 [src/game/decimalUtils.js](/Users/sero/dev/sero/mathp/src/game/decimalUtils.js)。

目前支援：

- 解析非負整數與小數，不接受分數、逗號格式、負數或 `.5` 這類省略整數位的寫法
- 用整數縮放表示小數，避免 JavaScript floating point 誤差
- 格式化時移除不必要尾端 `0`，例如 `3420.000` 顯示為 `3420`
- `認識小數` 使用 `fields` 多欄填空，練習最小位值組成、位值展開與位值辨識
- `小數加減` 使用 `decimal` 單欄輸入，兩個 operand 都在 `0 ~ 100` 且減法不出負數
- `小數乘整數` 使用 `decimal` 單欄輸入，練習最多到百分位的小數乘以 `1 ~ 99` 的整數，題目以好算的組合為主
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

目前測試位於 [src/game/categories.test.js](/Users/sero/dev/sero/mathp/src/game/categories.test.js)、[src/game/factorUtils.test.js](/Users/sero/dev/sero/mathp/src/game/factorUtils.test.js)、[src/game/fractionUtils.test.js](/Users/sero/dev/sero/mathp/src/game/fractionUtils.test.js)、[src/game/decimalUtils.test.js](/Users/sero/dev/sero/mathp/src/game/decimalUtils.test.js)、[src/game/questionFactories.test.js](/Users/sero/dev/sero/mathp/src/game/questionFactories.test.js)、[src/game/session.test.js](/Users/sero/dev/sero/mathp/src/game/session.test.js)，覆蓋：

- category / unit schema 與 helper 查找
- 因數、倍數、最大公因數、最小公倍數工具與三個單元的 generator 範圍
- 概數 generator 只出指定位數與方法
- 分數解析、格式驗證、等值判定
- 小數解析、格式驗證、精確運算、等值判定
- 小數分類各單元的 generator 與答案驗證
- 帶分數格式要求
- category / unit 選擇後的出題流程 helper
- 五年級 13 個單元在各題數下的配額、不重複題與進階排序（`gradeFivePractice.test.js`）
- 分數進退位條件、情境量與答案、分配律干擾選項、幾何公式與鏡射判分
- SVG 多邊形實際面積、未知尺寸隱藏，以及作答與錯題回顧的圖形呈現（`GeometryDiagram.test.jsx`）

## 目前內建單元

- 基礎加法 / `10 以內加法`
- 基礎減法 / `10 以內減法`
- 九九乘法 / `1 到 9 乘法表`
- 因數與倍數 / `找因數`
- 因數與倍數 / `公因數與最大公因數`
- 因數與倍數 / `公倍數與最小公倍數`
- 概數 / `百位到萬位概數`
- 分數 / `真分數`
- 分數 / `假分數`
- 分數 / `帶分數`
- 分數 / `等值分數`
- 分數 / `分數的整數倍`
- 分數 / `同分母分數加減`
- 分數 / `異分母通分練習`
- 分數 / `異分母分數加減`
- 分數 / `異分母帶分數加減`
- 分數 / `分數生活應用`
- 小數 / `認識小數`
- 小數 / `小數加減`
- 小數 / `小數乘整數`
- 小數 / `小數點移動`
- 四則運算 / `整數運算順序`
- 四則運算 / `連除與多步驟應用`
- 四則運算 / `分配律與簡便計算`
- 四則運算 / `平均問題`
- 面積 / `平行四邊形面積`
- 面積 / `三角形面積`
- 面積 / `梯形面積`
- 面積 / `面積綜合練習`
- 線對稱 / `方格上的對稱點`
