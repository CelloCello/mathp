import { lcm } from './factorUtils.js';
import { createFractionValue, formatFractionValue } from './fractionUtils.js';
import { createFractionQuestion } from './questionFactories.js';
import { createPracticeUnit, pickRandom, randomInt } from './practiceUtils.js';

const denominators = [];
for (let left = 2; left <= 12; left += 1) {
    for (let right = 2; right <= 12; right += 1) {
        if (left !== right && lcm(left, right) <= 60) denominators.push([left, right]);
    }
}

// Build finite, verified operand pools so even boundary random values terminate.
const properPairs = { small: [], overflow: [], integer: [], subtract: [] };
for (const [leftDenominator, rightDenominator] of denominators) {
    const commonDenominator = lcm(leftDenominator, rightDenominator);
    for (let leftNumerator = 1; leftNumerator < leftDenominator; leftNumerator += 1) {
        for (let rightNumerator = 1; rightNumerator < rightDenominator; rightNumerator += 1) {
            const left = leftNumerator * commonDenominator / leftDenominator;
            const right = rightNumerator * commonDenominator / rightDenominator;
            const pair = { leftNumerator, leftDenominator, rightNumerator, rightDenominator, commonDenominator };
            if (left + right < commonDenominator) properPairs.small.push(pair);
            if (left + right > commonDenominator) properPairs.overflow.push(pair);
            if (left + right === commonDenominator) properPairs.integer.push(pair);
            if (left > right) properPairs.subtract.push(pair);
        }
    }
}

const labelOperand = (whole, numerator, denominator) => whole
    ? `${whole} ${numerator}/${denominator}` : `${numerator}/${denominator}`;

export const createScaffoldedOperands = (operator, relation) => {
    const candidates = properPairs[operator === '+' ? 'small' : 'subtract'].filter((pair) => {
        const isMultiple = Math.max(pair.leftDenominator, pair.rightDenominator)
            % Math.min(pair.leftDenominator, pair.rightDenominator) === 0;
        return relation === 'multiple' ? isMultiple : !isMultiple;
    });
    const pair = pickRandom(candidates);
    return {
        leftOperand: { label: `${pair.leftNumerator}/${pair.leftDenominator}`, totalNumerator: pair.leftNumerator, denominator: pair.leftDenominator },
        rightOperand: { label: `${pair.rightNumerator}/${pair.rightDenominator}`, totalNumerator: pair.rightNumerator, denominator: pair.rightDenominator },
        commonDenominator: pair.commonDenominator,
        leftEquivalentNumerator: pair.leftNumerator * pair.commonDenominator / pair.leftDenominator,
        rightEquivalentNumerator: pair.rightNumerator * pair.commonDenominator / pair.rightDenominator
    };
};

const createCalculation = ({ operator, pair, leftWhole = 0, rightWhole = 0, text }) => {
    const leftNumerator = leftWhole * pair.leftDenominator + pair.leftNumerator;
    const rightNumerator = rightWhole * pair.rightDenominator + pair.rightNumerator;
    const left = leftNumerator * pair.commonDenominator / pair.leftDenominator;
    const right = rightNumerator * pair.commonDenominator / pair.rightDenominator;
    const answerValue = createFractionValue(operator === '+' ? left + right : left - right, pair.commonDenominator);
    const leftLabel = labelOperand(leftWhole, pair.leftNumerator, pair.leftDenominator);
    const rightLabel = labelOperand(rightWhole, pair.rightNumerator, pair.rightDenominator);
    const answerLabel = formatFractionValue(answerValue, { style: 'mixed' });
    return createFractionQuestion({
        text: text ?? `${leftLabel} ${operator} ${rightLabel} = ?`,
        answerValue,
        standardAnswerLabel: answerLabel,
        meta: {
            promptType: 'grade-five-fraction',
            operator,
            leftNumerator,
            leftDenominator: pair.leftDenominator,
            rightNumerator,
            rightDenominator: pair.rightDenominator,
            leftWhole,
            rightWhole,
            commonDenominator: pair.commonDenominator,
            answerNumerator: answerValue.numerator,
            answerDenominator: answerValue.denominator,
            explanation: `先通分成分母 ${pair.commonDenominator}：${left}/${pair.commonDenominator} ${operator} ${right}/${pair.commonDenominator} = ${answerLabel}。`
        }
    });
};

export const createIndependentFractionUnit = () => createPracticeUnit({
    id: 'fraction_add_subtract_independent',
    name: '異分母分數加減',
    description: '自己通分計算，練習答案超過 1 或剛好是整數',
    variants: [
        { id: 'proper-add', weight: 30, level: 1, generate: () => createCalculation({ operator: '+', pair: pickRandom(properPairs.small) }) },
        { id: 'proper-subtract', weight: 30, level: 1, generate: () => createCalculation({ operator: '-', pair: pickRandom(properPairs.subtract) }) },
        { id: 'overflow-add', weight: 30, level: 2, generate: () => createCalculation({ operator: '+', pair: pickRandom(properPairs.overflow) }) },
        { id: 'integer-add', weight: 10, level: 2, generate: () => createCalculation({ operator: '+', pair: pickRandom(properPairs.integer) }) }
    ]
});

const createMixedCalculation = (kind) => {
    const operator = kind === 'plain-add' || kind === 'carry' ? '+' : '-';
    let pair = pickRandom(properPairs[kind === 'carry' ? 'overflow' : kind === 'borrow' ? 'subtract' : operator === '+' ? 'small' : 'subtract']);
    if (kind === 'borrow') {
        pair = {
            ...pair,
            leftNumerator: pair.rightNumerator,
            leftDenominator: pair.rightDenominator,
            rightNumerator: pair.leftNumerator,
            rightDenominator: pair.leftDenominator
        };
    }
    const rightWhole = randomInt(1, operator === '-' ? 4 : 5);
    const leftWhole = operator === '-' ? randomInt(rightWhole + 1, 5) : randomInt(1, 5);
    return createCalculation({ operator, pair, leftWhole, rightWhole });
};

export const createMixedFractionPracticeUnit = () => createPracticeUnit({
    id: 'fraction_mixed_add_subtract',
    name: '異分母帶分數加減',
    description: '練習帶分數加減，以及加法進位、減法借位',
    variants: [
        { id: 'plain-add', weight: 20, level: 1, generate: () => createMixedCalculation('plain-add') },
        { id: 'plain-subtract', weight: 20, level: 1, generate: () => createMixedCalculation('plain-subtract') },
        { id: 'carry', weight: 30, level: 2, generate: () => createMixedCalculation('carry') },
        { id: 'borrow', weight: 30, level: 2, generate: () => createMixedCalculation('borrow') }
    ]
});

const createFractionStory = (kind) => {
    const operator = kind === 'sum' || kind === 'original' ? '+' : '-';
    const pair = pickRandom(properPairs[operator === '+' ? 'overflow' : 'subtract']);
    const leftWhole = randomInt(1, 4);
    const rightWhole = randomInt(0, kind === 'difference' ? leftWhole : operator === '-' ? leftWhole - 1 : 3);
    const left = labelOperand(leftWhole, pair.leftNumerator, pair.leftDenominator);
    const right = labelOperand(rightWhole, pair.rightNumerator, pair.rightDenominator);
    const stories = {
        sum: [
            `上午走了 ${left} 公里，下午走了 ${right} 公里，一共走了多少公里？`,
            `第一段繩子長 ${left} 公尺，第二段長 ${right} 公尺，接起來共長多少公尺？`,
            `水桶原有 ${left} 公升水，又倒入 ${right} 公升，現在共有多少公升？`
        ],
        remaining: [
            `繩子原長 ${left} 公尺，剪去 ${right} 公尺，還剩多少公尺？`,
            `水桶有 ${left} 公升水，用掉 ${right} 公升，還剩多少公升？`,
            `一袋米重 ${left} 公斤，煮飯用了 ${right} 公斤，還剩多少公斤？`
        ],
        difference: [
            `紅繩長 ${left} 公尺，藍繩長 ${right} 公尺，紅繩比藍繩長多少公尺？`,
            `小安走了 ${left} 公里，小晴走了 ${right} 公里，小安多走多少公里？`,
            `甲袋米重 ${left} 公斤，乙袋重 ${right} 公斤，兩袋相差多少公斤？`
        ],
        original: [
            `剪去 ${left} 公尺的繩子後，還剩 ${right} 公尺，繩子原來長多少公尺？`,
            `用掉 ${left} 公升水後，桶裡還有 ${right} 公升，原來有多少公升水？`,
            `煮飯用了 ${left} 公斤米後，還剩 ${right} 公斤，原來有多少公斤米？`
        ]
    };
    const question = createCalculation({ operator, pair, leftWhole, rightWhole, text: pickRandom(stories[kind]) });
    question.meta.storyKind = kind;
    return question;
};

export const createFractionStoryUnit = () => createPracticeUnit({
    id: 'fraction_word_problems',
    name: '分數生活應用',
    description: '讀懂合計、剩餘、相差與原有量，再算出分數答案',
    variants: [
        { id: 'sum', weight: 40, level: 1, generate: () => createFractionStory('sum') },
        { id: 'remaining', weight: 20, level: 1, generate: () => createFractionStory('remaining') },
        { id: 'difference', weight: 20, level: 1, generate: () => createFractionStory('difference') },
        { id: 'original', weight: 20, level: 2, generate: () => createFractionStory('original') }
    ]
});
