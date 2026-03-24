import { gcd, createFractionValue, formatFractionValue } from './fractionUtils.js';
import {
    createBinaryNode,
    createGroupNode,
    createValueNode,
    evaluateExpression,
    expressionToText
} from './expressionUtils.js';
import {
    createChoiceQuestion,
    createFractionQuestion,
    createNumberQuestion
} from './questionFactories.js';

const ROUNDING_METHODS = [
    { name: '四捨五入法', apply: (value, unit) => Math.round(value / unit) * unit },
    { name: '無條件進入法', apply: (value, unit) => Math.ceil(value / unit) * unit },
    { name: '無條件捨去法', apply: (value, unit) => Math.floor(value / unit) * unit }
];

const ROUNDING_PLACES = [
    { name: '百位', unit: 100 },
    { name: '千位', unit: 1000 },
    { name: '萬位', unit: 10000 }
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pickRandom = (items) => items[randomInt(0, items.length - 1)];

const shuffle = (items) => {
    const next = [...items];

    for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = randomInt(0, index);
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }

    return next;
};

const createRawFractionOption = (numerator, denominator) => ({
    value: `${numerator}/${denominator}`,
    label: `${numerator}/${denominator}`
});

const createRandomProperFractionOption = () => {
    const denominator = randomInt(2, 9);
    const candidates = Array.from({ length: denominator - 1 }, (_, index) => index + 1);
    const numerator = pickRandom(candidates);

    return createRawFractionOption(numerator, denominator);
};

const createRandomImproperFractionOption = () => {
    const denominator = randomInt(2, 9);
    const numerator = randomInt(denominator + 1, denominator + 8);

    return createRawFractionOption(numerator, denominator);
};

const createUniqueOptions = (correctOptionFactory, distractorFactory) => {
    const options = [];
    const usedLabels = new Set();

    const pushUnique = (option) => {
        if (usedLabels.has(option.label)) {
            return false;
        }

        usedLabels.add(option.label);
        options.push(option);
        return true;
    };

    while (options.length === 0) {
        pushUnique(correctOptionFactory());
    }

    while (options.length < 4) {
        pushUnique(distractorFactory());
    }

    return {
        correctOption: options[0],
        options: shuffle(options)
    };
};

const createReducedProperFractionValue = () => {
    const denominator = randomInt(2, 9);
    const numerators = Array.from({ length: denominator - 1 }, (_, index) => index + 1)
        .filter((numerator) => gcd(numerator, denominator) === 1);
    const numerator = pickRandom(numerators);

    return createFractionValue(numerator, denominator);
};

const createFractionOperand = (numerator, denominator) => ({
    kind: 'fraction',
    totalNumerator: numerator,
    denominator,
    label: `${numerator}/${denominator}`,
    value: createFractionValue(numerator, denominator)
});

const createMixedOperand = (whole, numerator, denominator) => {
    const totalNumerator = whole * denominator + numerator;

    return {
        kind: 'mixed',
        whole,
        numerator,
        totalNumerator,
        denominator,
        label: `${whole} ${numerator}/${denominator}`,
        value: createFractionValue(totalNumerator, denominator)
    };
};

const createProperFractionOperand = (denominator) =>
    createFractionOperand(randomInt(1, denominator - 1), denominator);

const createDistinctProperFractionOperands = (denominator) => {
    const left = randomInt(1, denominator - 1);
    const right = pickRandom(
        Array.from({ length: denominator - 1 }, (_, index) => index + 1)
            .filter((candidate) => candidate !== left)
    );

    return {
        left: createFractionOperand(left, denominator),
        right: createFractionOperand(right, denominator)
    };
};

const createOrderedProperFractionOperands = (denominator) => {
    const left = randomInt(2, denominator - 1);
    const right = randomInt(1, left - 1);

    return {
        left: createFractionOperand(left, denominator),
        right: createFractionOperand(right, denominator)
    };
};

const createImproperFractionOperand = (denominator, minimumNumerator) => {
    const start = Math.max(denominator + 1, minimumNumerator);
    const end = denominator * 5 - 1;
    const candidates = Array.from({ length: end - start + 1 }, (_, index) => start + index)
        .filter((numerator) => numerator % denominator !== 0);

    return createFractionOperand(pickRandom(candidates), denominator);
};

const createFractionAddSubQuestion = () => {
    const operator = Math.random() < 0.5 ? '+' : '-';
    const operandPattern = pickRandom([
        'fraction-fraction',
        'mixed-fraction',
        'fraction-mixed',
        'mixed-mixed'
    ]);
    const denominator = randomInt(3, 12);

    let leftOperand;
    let rightOperand;

    if (operandPattern === 'fraction-fraction') {
        const operands = operator === '+'
            ? createDistinctProperFractionOperands(denominator)
            : createOrderedProperFractionOperands(denominator);
        leftOperand = operands.left;
        rightOperand = operands.right;
    }

    if (operandPattern === 'mixed-fraction') {
        leftOperand = createMixedOperand(randomInt(1, 3), randomInt(1, denominator - 1), denominator);
        rightOperand = createProperFractionOperand(denominator);
    }

    if (operandPattern === 'fraction-mixed') {
        rightOperand = createMixedOperand(randomInt(1, 3), randomInt(1, denominator - 1), denominator);
        leftOperand = operator === '+'
            ? createProperFractionOperand(denominator)
            : createImproperFractionOperand(denominator, rightOperand.totalNumerator + 1);
    }

    if (operandPattern === 'mixed-mixed') {
        if (operator === '+') {
            leftOperand = createMixedOperand(randomInt(1, 3), randomInt(1, denominator - 1), denominator);
            do {
                rightOperand = createMixedOperand(randomInt(1, 3), randomInt(1, denominator - 1), denominator);
            } while (rightOperand.totalNumerator === leftOperand.totalNumerator);
        } else {
            const leftWhole = randomInt(2, 4);
            const rightWhole = randomInt(1, leftWhole - 1);
            leftOperand = createMixedOperand(leftWhole, randomInt(1, denominator - 1), denominator);
            rightOperand = createMixedOperand(rightWhole, randomInt(1, denominator - 1), denominator);

            if (rightOperand.totalNumerator >= leftOperand.totalNumerator) {
                rightOperand = createMixedOperand(1, randomInt(1, denominator - 1), denominator);
            }
        }
    }

    const answer = createFractionValue(
        operator === '+'
            ? leftOperand.totalNumerator + rightOperand.totalNumerator
            : leftOperand.totalNumerator - rightOperand.totalNumerator,
        denominator
    );
    const resultKind = answer.denominator === 1
        ? 'integer'
        : answer.numerator > answer.denominator
            ? 'mixed'
            : 'fraction';
    const standardAnswerLabel = resultKind === 'mixed'
        ? formatFractionValue(answer, { style: 'mixed' })
        : formatFractionValue(answer);

    return createFractionQuestion({
        text: `${leftOperand.label} ${operator} ${rightOperand.label} = ?`,
        answerValue: answer,
        standardAnswerLabel,
        requiredKind: resultKind,
        placeholder: '例如 3/4、1 1/2 或 2',
        meta: {
            promptType: 'fraction-add-subtract',
            operandPattern,
            operator,
            denominator,
            leftKind: leftOperand.kind,
            rightKind: rightOperand.kind,
            leftTotalNumerator: leftOperand.totalNumerator,
            rightTotalNumerator: rightOperand.totalNumerator,
            resultKind,
            resultNumerator: answer.numerator,
            resultDenominator: answer.denominator
        }
    });
};

const createAdditionUnit = () => ({
    id: 'within_10',
    name: '10 以內加法',
    description: '練習和不超過 10 的加法',
    generateQuestion: () => {
        const a = randomInt(1, 9);
        const b = randomInt(1, 10 - a);

        return createNumberQuestion({
            text: `${a} + ${b} = ?`,
            answer: a + b
        });
    }
});

const createSubtractionUnit = () => ({
    id: 'within_10',
    name: '10 以內減法',
    description: '練習被減數不超過 10 的減法',
    generateQuestion: () => {
        const a = randomInt(1, 10);
        const b = randomInt(0, a - 1);

        return createNumberQuestion({
            text: `${a} - ${b} = ?`,
            answer: a - b
        });
    }
});

const createMultiplicationUnit = () => ({
    id: 'times_table',
    name: '1 到 9 乘法表',
    description: '練習九九乘法',
    generateQuestion: () => {
        const a = randomInt(1, 9);
        const b = randomInt(1, 9);

        return createNumberQuestion({
            text: `${a} × ${b} = ?`,
            answer: a * b
        });
    }
});

const createApproximationUnit = () => ({
    id: 'rounding',
    name: '百位到萬位概數',
    description: '百位、千位、萬位的四捨五入與進位捨去',
    generateQuestion: () => {
        const method = pickRandom(ROUNDING_METHODS);
        const place = pickRandom(ROUNDING_PLACES);
        const value = randomInt(place.unit + 1, 99999);
        const answer = method.apply(value, place.unit);

        return createNumberQuestion({
            text: `${value.toLocaleString()} 以「${method.name}」取概數到${place.name} = ?`,
            answer,
            meta: {
                methodName: method.name,
                placeName: place.name
            }
        });
    }
});

const createProperFractionUnit = () => ({
    id: 'proper_fraction',
    name: '真分數',
    description: '從選項中找出分子小於分母的分數',
    generateQuestion: () => {
        const { correctOption, options } = createUniqueOptions(
            createRandomProperFractionOption,
            createRandomImproperFractionOption
        );

        return createChoiceQuestion({
            text: '下面哪一個是真分數？',
            options,
            correctValue: correctOption.value
        });
    }
});

const createImproperFractionUnit = () => ({
    id: 'improper_fraction',
    name: '假分數',
    description: '從選項中找出分子大於分母的分數',
    generateQuestion: () => {
        const { correctOption, options } = createUniqueOptions(
            createRandomImproperFractionOption,
            createRandomProperFractionOption
        );

        return createChoiceQuestion({
            text: '下面哪一個是假分數？',
            options,
            correctValue: correctOption.value
        });
    }
});

const createMixedFractionUnit = () => ({
    id: 'mixed_fraction',
    name: '帶分數',
    description: '在假分數與帶分數之間互相轉換',
    generateQuestion: () => {
        const value = createReducedProperFractionValue();
        const whole = randomInt(1, 4);
        const improperNumerator = whole * value.denominator + value.numerator;
        const mixedLabel = `${whole} ${value.numerator}/${value.denominator}`;
        const improperLabel = `${improperNumerator}/${value.denominator}`;

        if (Math.random() < 0.5) {
            return createFractionQuestion({
                text: `把 ${improperLabel} 化成帶分數`,
                answerValue: createFractionValue(improperNumerator, value.denominator),
                standardAnswerLabel: mixedLabel,
                requiredKind: 'mixed',
                placeholder: '例如 1 1/2',
                meta: { promptType: 'improper-to-mixed' }
            });
        }

        return createFractionQuestion({
            text: `把 ${mixedLabel} 化成假分數`,
            answerValue: createFractionValue(improperNumerator, value.denominator),
            standardAnswerLabel: improperLabel,
            requiredKind: 'improper',
            placeholder: '例如 7/4',
            meta: { promptType: 'mixed-to-improper' }
        });
    }
});

const createFractionAddSubUnit = () => ({
    id: 'fraction_add_subtract',
    name: '分數加減',
    description: '同分母分數與帶分數的加減法',
    generateQuestion: () => createFractionAddSubQuestion()
});

const createArithmeticQuestion = ({ expression, ruleType, usesImplicitMultiplication = false }) => {
    const evaluation = evaluateExpression(expression);

    return createNumberQuestion({
        text: `${expressionToText(expression)} = ?`,
        answer: evaluation.value,
        placeholder: '輸入整數答案',
        meta: {
            promptType: 'integer-order-of-operations',
            renderKind: 'expression',
            ruleType,
            mathModel: expression,
            usesImplicitMultiplication,
            answer: evaluation.value,
            evaluationSteps: evaluation.steps
        }
    });
};

const valueNode = (value) => createValueNode(value);

const createLeftToRightQuestion = () => {
    const pattern = pickRandom(['add-subtract', 'multiply-divide', 'divide-multiply']);

    if (pattern === 'add-subtract') {
        const left = randomInt(6, 18);
        const addend = randomInt(2, 9);
        const subtrahend = randomInt(1, left + addend - 1);

        return createArithmeticQuestion({
            expression: createBinaryNode(
                'subtract',
                createBinaryNode('add', valueNode(left), valueNode(addend)),
                valueNode(subtrahend)
            ),
            ruleType: 'left-to-right'
        });
    }

    if (pattern === 'multiply-divide') {
        const left = randomInt(2, 9);
        const middle = randomInt(2, 9);
        const divisorCandidates = Array.from(
            { length: left * middle - 1 },
            (_, index) => index + 2
        ).filter((candidate) => (left * middle) % candidate === 0);
        const right = pickRandom(divisorCandidates);

        return createArithmeticQuestion({
            expression: createBinaryNode(
                'divide',
                createBinaryNode('multiply', valueNode(left), valueNode(middle)),
                valueNode(right)
            ),
            ruleType: 'left-to-right'
        });
    }

    const divisor = randomInt(2, 9);
    const quotient = randomInt(2, 9);
    const multiplier = randomInt(2, 9);

    return createArithmeticQuestion({
        expression: createBinaryNode(
            'multiply',
            createBinaryNode('divide', valueNode(divisor * quotient), valueNode(divisor)),
            valueNode(multiplier)
        ),
        ruleType: 'left-to-right'
    });
};

const createPrecedenceQuestion = () => {
    const pattern = pickRandom(['add-multiply', 'subtract-divide', 'multiply-add']);

    if (pattern === 'add-multiply') {
        return createArithmeticQuestion({
            expression: createBinaryNode(
                'add',
                valueNode(randomInt(2, 12)),
                createBinaryNode('multiply', valueNode(randomInt(2, 9)), valueNode(randomInt(2, 9)))
            ),
            ruleType: 'precedence'
        });
    }

    if (pattern === 'subtract-divide') {
        const divisor = randomInt(2, 9);
        const quotient = randomInt(2, 9);
        const minuend = randomInt(quotient + 3, quotient + 15);

        return createArithmeticQuestion({
            expression: createBinaryNode(
                'subtract',
                valueNode(minuend),
                createBinaryNode('divide', valueNode(divisor * quotient), valueNode(divisor))
            ),
            ruleType: 'precedence'
        });
    }

    return createArithmeticQuestion({
        expression: createBinaryNode(
            'add',
            createBinaryNode('multiply', valueNode(randomInt(2, 9)), valueNode(randomInt(2, 9))),
            valueNode(randomInt(2, 12))
        ),
        ruleType: 'precedence'
    });
};

const createParenthesesQuestion = () => {
    const factor = randomInt(2, 9);
    const left = randomInt(1, 9);
    const right = randomInt(1, 9);
    const group = createGroupNode(
        createBinaryNode('add', valueNode(left), valueNode(right)),
        'paren'
    );

    return createArithmeticQuestion({
        expression: createBinaryNode('multiply', valueNode(factor), group, { implicit: true }),
        ruleType: 'parentheses',
        usesImplicitMultiplication: true
    });
};

const createNestedBracketsQuestion = () => {
    const innerLeft = randomInt(3, 12);
    const innerRight = randomInt(1, innerLeft - 1);
    const innerGroup = createGroupNode(
        createBinaryNode('subtract', valueNode(innerLeft), valueNode(innerRight)),
        'paren'
    );
    const squareLeft = randomInt(innerLeft - innerRight + 1, innerLeft - innerRight + 8);
    const squareGroup = createGroupNode(
        createBinaryNode('subtract', valueNode(squareLeft), innerGroup),
        'square'
    );
    const outerOffset = randomInt(2, 9);
    const curlyGroup = createGroupNode(
        createBinaryNode('add', valueNode(outerOffset), squareGroup),
        'curly'
    );
    const factor = randomInt(2, 6);

    return createArithmeticQuestion({
        expression: createBinaryNode('multiply', valueNode(factor), curlyGroup),
        ruleType: 'nested-brackets'
    });
};

const createIntegerOrderOfOperationsQuestion = () => {
    const ruleType = pickRandom([
        'left-to-right',
        'precedence',
        'parentheses',
        'nested-brackets'
    ]);

    if (ruleType === 'left-to-right') {
        return createLeftToRightQuestion();
    }

    if (ruleType === 'precedence') {
        return createPrecedenceQuestion();
    }

    if (ruleType === 'parentheses') {
        return createParenthesesQuestion();
    }

    return createNestedBracketsQuestion();
};

const createArithmeticUnit = () => ({
    id: 'integer_order_of_operations',
    name: '基礎整數運算',
    description: '整數四則、括號與運算順序',
    generateQuestion: () => createIntegerOrderOfOperationsQuestion()
});

export const categories = [
    {
        id: 'addition_basic',
        name: '基礎加法',
        description: '從簡單加法開始暖身',
        icon: '🍎',
        color: '#ff9a9e',
        units: [createAdditionUnit()]
    },
    {
        id: 'subtraction_basic',
        name: '基礎減法',
        description: '一步一步練習減法',
        icon: '🐢',
        color: '#84fab0',
        units: [createSubtractionUnit()]
    },
    {
        id: 'multiplication_table',
        name: '九九乘法',
        description: '熟悉 1 到 9 的乘法表',
        icon: '🚀',
        color: '#fccb90',
        units: [createMultiplicationUnit()]
    },
    {
        id: 'approximation',
        name: '概數',
        description: '四捨五入、無條件進入與無條件捨去',
        icon: '🎯',
        color: '#74b9ff',
        units: [createApproximationUnit()]
    },
    {
        id: 'fractions',
        name: '分數',
        description: '真分數、假分數、帶分數與同分母加減',
        icon: '🥧',
        color: '#f6b93b',
        units: [
            createProperFractionUnit(),
            createImproperFractionUnit(),
            createMixedFractionUnit(),
            createFractionAddSubUnit()
        ]
    },
    {
        id: 'arithmetic',
        name: '四則運算',
        description: '整數四則、先乘除後加減與括號規則',
        icon: '🧮',
        color: '#7fd1b9',
        units: [createArithmeticUnit()]
    }
];

export const getCategoryById = (categoryId) =>
    categories.find((category) => category.id === categoryId);

export const getUnitById = (categoryId, unitId) =>
    getCategoryById(categoryId)?.units.find((unit) => unit.id === unitId);
