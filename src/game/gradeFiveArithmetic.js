import { createChoiceQuestion, createFieldQuestion, createNumberQuestion } from './questionFactories.js';
import { createPracticeUnit, pickRandom, randomInt, shuffle } from './practiceUtils.js';

const numberQuestion = (text, answer, data, explanation) => createNumberQuestion({
    text,
    answer,
    meta: { promptType: 'grade-five-arithmetic', ...data, answer, explanation }
});

const createDivisionStory = () => {
    const perGroup = randomInt(2, 9);
    const groupsPerBox = randomInt(2, 8);
    const answer = randomInt(2, 12);
    const total = perGroup * groupsPerBox * answer;
    const text = pickRandom([
        `有 ${total} 顆糖果，每 ${perGroup} 顆裝一袋，每 ${groupsPerBox} 袋裝一盒，共可裝幾盒？`,
        `有 ${total} 本書，每 ${perGroup} 本綁成一捆，每 ${groupsPerBox} 捆裝一箱，共可裝幾箱？`,
        `有 ${total} 名學生，每 ${perGroup} 人一組，每 ${groupsPerBox} 組組成一隊，共可組成幾隊？`
    ]);
    return numberQuestion(text, answer, { operation: 'divide-twice', perGroup, groupsPerBox, total },
        `${total} ÷ ${perGroup} ÷ ${groupsPerBox} = ${answer}。也可以先算每盒、每箱或每隊的總數再除。`);
};

const createTwoStepStory = () => {
    const quantity = randomInt(2, 12);
    const price = randomInt(5, 50);
    const extra = randomInt(5, 80);
    const kind = pickRandom(['total', 'change', 'group']);
    if (kind === 'change') {
        const budget = quantity * price + extra;
        return numberQuestion(`買 ${quantity} 本筆記本，每本 ${price} 元，付 ${budget} 元，應找回多少元？`, extra,
            { operation: 'change', quantity, price, budget }, `先算花費：${price} × ${quantity} = ${price * quantity}，再算 ${budget} − ${price * quantity} = ${extra}。`);
    }
    if (kind === 'group') {
        const answer = (price + extra) * quantity;
        return numberQuestion(`每袋有紅色積木 ${price} 個、藍色積木 ${extra} 個，${quantity} 袋共有幾個積木？`, answer,
            { operation: 'group-total', quantity, price, extra }, `先算一袋：${price} + ${extra}，再乘以 ${quantity}，得到 ${answer}。`);
    }
    const answer = quantity * price + extra;
    return numberQuestion(`買 ${quantity} 本書，每本 ${price} 元，另付運費 ${extra} 元，共需多少元？`, answer,
        { operation: 'purchase-total', quantity, price, extra }, `${price} × ${quantity} + ${extra} = ${answer}。`);
};

const createThreeStepStory = () => {
    const quantity = randomInt(2, 12);
    const price = randomInt(5, 50);
    const fee = randomInt(5, 60);
    const answer = randomInt(10, 200);
    const budget = quantity * price + fee + answer;
    const text = pickRandom([
        `有 ${budget} 元，買 ${quantity} 盒色筆，每盒 ${price} 元，再買 ${fee} 元的畫紙，還剩多少元？`,
        `班費有 ${budget} 元，買 ${quantity} 本書，每本 ${price} 元，另付 ${fee} 元運費，班費還剩多少元？`,
        `有 ${budget} 元，買 ${quantity} 包餅乾，每包 ${price} 元，再買 ${fee} 元的牛奶，還剩多少元？`
    ]);
    return numberQuestion(text, answer, { operation: 'three-step', quantity, price, fee, budget },
        `先乘再加，求出總花費：${quantity} × ${price} + ${fee} = ${budget - answer}，再用 ${budget} − ${budget - answer} = ${answer}。`);
};

export const createMultiStepUnit = () => createPracticeUnit({
    id: 'integer_word_problems',
    name: '連除與多步驟應用',
    description: '練習分裝、分組與購物問題，從兩步驟到三步驟',
    variants: [
        { id: 'divide-twice', weight: 40, level: 1, generate: createDivisionStory },
        { id: 'two-step', weight: 40, level: 1, generate: createTwoStepStory },
        { id: 'three-step', weight: 20, level: 2, generate: createThreeStepStory }
    ]
});

const createDistributiveQuestion = (kind) => {
    const factor = randomInt(2, 30);
    const left = randomInt(2, 20);
    const right = randomInt(1, left - 1);
    const operator = pickRandom(['+', '-']);
    const sum = operator === '+' ? left + right : left - right;
    const meta = {
        promptType: 'distributive-law', factor, left, right, operator,
        explanation: `${factor} × (${left} ${operator} ${right}) = ${factor} × ${left} ${operator} ${factor} × ${right} = ${factor * sum}。`
    };
    if (kind === 'choose') {
        const options = shuffle([
            { value: 'correct', label: `${factor} × ${left} ${operator} ${factor} × ${right}` },
            { value: 'missing-factor', label: `${factor} × ${left} ${operator} ${right}` },
            { value: 'wrong-sign', label: `${factor} × ${left} ${operator === '+' ? '-' : '+'} ${factor} × ${right}` },
            { value: 'extra-one', label: `${factor} × (${left} ${operator} ${right}) + 1` }
        ]);
        return createChoiceQuestion({ text: `哪個算式是把 ${factor} × (${left} ${operator} ${right}) 正確使用分配律展開？`, options, correctValue: 'correct', meta });
    }
    const answer = kind === 'expand' ? right : sum;
    return createFieldQuestion({
        text: kind === 'expand'
            ? `${factor} × (${left} ${operator} ${right}) = ${factor} × ${left} ${operator} ${factor} × □`
            : `${factor} × ${left} ${operator} ${factor} × ${right} = ${factor} × □`,
        fields: [{ id: 'blank', label: '□', inputMode: 'numeric', answerKind: 'integer', expectedValue: answer, displayValue: String(answer) }],
        meta: { ...meta, answer }
    });
};

export const createDistributiveUnit = () => createPracticeUnit({
    id: 'distributive_law',
    name: '分配律與簡便計算',
    description: '練習共同乘數、展開與合併，理解簡便計算的理由',
    variants: [
        { id: 'expand', weight: 40, level: 1, generate: () => createDistributiveQuestion('expand') },
        { id: 'combine', weight: 40, level: 1, generate: () => createDistributiveQuestion('combine') },
        { id: 'choose', weight: 20, level: 2, generate: () => createDistributiveQuestion('choose') }
    ]
});

const createAverageQuestion = (kind) => {
    const count = randomInt(3, 5);
    const average = randomInt(50, 84);
    const offsets = Array.from({ length: count - 1 }, () => randomInt(-4, 4));
    const values = shuffle([...offsets.map((offset) => average + offset), average - offsets.reduce((sum, value) => sum + value, 0)]);
    const total = average * count;
    const context = pickRandom(['score', 'pages', 'items']);
    const unit = context === 'score' ? '分' : context === 'pages' ? '頁' : '個';
    const data = { promptType: 'average', count, average, total, values, context };
    if (kind === 'total') {
        const text = context === 'score' ? `${count} 次測驗的平均成績是 ${average} 分，總分是多少分？`
            : context === 'pages' ? `${count} 天平均每天閱讀 ${average} 頁，這幾天共讀幾頁？`
                : `${count} 盒積木平均每盒有 ${average} 個，這些盒子共有幾個積木？`;
        return numberQuestion(text, total, data, `總量 = 平均 × 份數：${average} × ${count} = ${total}。`);
    }
    if (kind === 'missing') {
        const known = values.slice(0, -1);
        const text = context === 'score' ? `${count} 次測驗平均 ${average} 分，其中 ${count - 1} 次是 ${known.join('、')} 分，另一次是幾分？`
            : context === 'pages' ? `${count} 天平均每天讀 ${average} 頁，其中 ${count - 1} 天讀了 ${known.join('、')} 頁，另一天讀幾頁？`
                : `${count} 盒積木平均每盒 ${average} 個，其中 ${count - 1} 盒有 ${known.join('、')} 個，另一盒有幾個？`;
        return numberQuestion(text, values.at(-1), data,
            `先算總量 ${average} × ${count} = ${total}，再減去已知的 ${known.reduce((sum, value) => sum + value, 0)}，得到 ${values.at(-1)} ${unit}。`);
    }
    const text = context === 'score' ? `${count} 次測驗成績分別是 ${values.join('、')} 分，平均是幾分？`
        : context === 'pages' ? `${count} 天分別讀了 ${values.join('、')} 頁，平均每天讀幾頁？`
            : `${count} 盒積木分別有 ${values.join('、')} 個，平均每盒有幾個？`;
    return numberQuestion(text, average, data, `先加總得到 ${total}，再除以 ${count}：${total} ÷ ${count} = ${average} ${unit}。`);
};

export const createAverageUnit = () => createPracticeUnit({
    id: 'average_problems',
    name: '平均問題',
    description: '從求平均，練到總量與缺少的一筆資料',
    variants: [
        { id: 'average', weight: 60, level: 1, generate: () => createAverageQuestion('average') },
        { id: 'total', weight: 20, level: 1, generate: () => createAverageQuestion('total') },
        { id: 'missing', weight: 20, level: 2, generate: () => createAverageQuestion('missing') }
    ]
});
