import {
    addDecimalValues,
    compareDecimalOrder,
    createDecimalValue,
    divideDecimalByPowerOfTen,
    formatDecimalValue,
    multiplyDecimalByPowerOfTen,
    subtractDecimalValues
} from './decimalUtils.js';
import {
    gcd,
    createFractionValue,
    formatFractionValue,
    formatFractionValueWithOriginalDenominator
} from './fractionUtils.js';
import {
    createBinaryNode,
    createGroupNode,
    createValueNode,
    evaluateExpression,
    expressionToText
} from './expressionUtils.js';
import {
    createChoiceQuestion,
    createDecimalQuestion,
    createFieldQuestion,
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

const DECIMAL_PLACE_VALUES = [
    { name: '十分位', unitLabel: '0.1', denominator: 10, scale: 1 },
    { name: '百分位', unitLabel: '0.01', denominator: 100, scale: 2 },
    { name: '千分位', unitLabel: '0.001', denominator: 1000, scale: 3 }
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

const createRandomIntroDecimal = () => {
    const scale = randomInt(1, 3);
    const maxUnits = (10 ** scale) - 1;
    const candidates = Array.from({ length: maxUnits }, (_, index) => index + 1)
        .filter((candidate) => scale === 1 || candidate % 10 !== 0);

    return createDecimalValue(pickRandom(candidates), scale);
};

const createRandomMultiDigitIntroDecimal = () => {
    const scale = randomInt(2, 3);
    const maxUnits = (10 ** scale) - 1;
    const candidates = Array.from({ length: maxUnits }, (_, index) => index + 1)
        .filter((candidate) => candidate % 10 !== 0);

    return createDecimalValue(pickRandom(candidates), scale);
};

const createRandomDecimalUpTo100 = () => {
    const scale = randomInt(0, 3);
    const maxUnits = 100 * (10 ** scale);

    return createDecimalValue(randomInt(0, maxUnits), scale);
};

const createDecimalField = ({ id, label, expectedValue }) => ({
    id,
    label,
    answerKind: 'decimal',
    expectedValue,
    displayValue: formatDecimalValue(expectedValue),
    inputMode: 'decimal'
});

const createIntegerField = ({ id, label, expectedValue }) => ({
    id,
    label,
    answerKind: 'integer',
    expectedValue,
    displayValue: String(expectedValue),
    inputMode: 'numeric'
});

const getDecimalDigits = (value) =>
    String(value.units).padStart(value.scale, '0').split('').map(Number);

const createSmallestDecimalUnitQuestion = () => {
    const value = createRandomIntroDecimal();
    const place = DECIMAL_PLACE_VALUES[value.scale - 1];
    const valueLabel = formatDecimalValue(value);
    return createFieldQuestion({
        text: `${valueLabel} 是由多少個 ${place.unitLabel} 組成？換成分數是多少？`,
        fields: [
            createIntegerField({ id: 'count', label: `${place.unitLabel} 的個數`, expectedValue: value.units }),
            createIntegerField({ id: 'numerator', label: '分子', expectedValue: value.units }),
            createIntegerField({ id: 'denominator', label: '分母', expectedValue: place.denominator })
        ],
        meta: {
            promptType: 'decimal-smallest-unit',
            decimalUnits: value.units,
            decimalScale: value.scale,
            decimalLabel: valueLabel,
            smallestUnitLabel: place.unitLabel,
            fractionNumerator: value.units,
            fractionDenominator: place.denominator,
            correctInput: {
                count: String(value.units),
                numerator: String(value.units),
                denominator: String(place.denominator)
            }
        }
    });
};

const createDecimalExpandedFormQuestion = () => {
    const value = createRandomIntroDecimal();
    const valueLabel = formatDecimalValue(value);
    const digits = getDecimalDigits(value);
    const terms = digits
        .map((digit, index) => ({
            digit,
            place: DECIMAL_PLACE_VALUES[index]
        }))
        .filter((term) => term.digit > 0);

    return createFieldQuestion({
        text: `${valueLabel} 可以拆成哪些小數？`,
        fields: terms.map((term, index) =>
            createIntegerField({
                id: `digit${index}`,
                label: `${term.place.unitLabel} 的個數`,
                expectedValue: term.digit
            })
        ),
        meta: {
            promptType: 'decimal-expanded-form',
            decimalUnits: value.units,
            decimalScale: value.scale,
            decimalLabel: valueLabel,
            terms: terms.map((term, index) => ({
                fieldId: `digit${index}`,
                placeName: term.place.name,
                placeValueLabel: term.place.unitLabel,
                digit: term.digit
            })),
            correctInput: Object.fromEntries(
                terms.map((term, index) => [`digit${index}`, String(term.digit)])
            )
        },
        formulaPreview: {
            parts: terms.map((term, index) => ({
                fieldId: `digit${index}`,
                multiplierLabel: term.place.unitLabel
            }))
        }
    });
};

const createDecimalPlaceValueQuestion = () => {
    const value = createRandomMultiDigitIntroDecimal();
    const valueLabel = formatDecimalValue(value);
    const digits = getDecimalDigits(value);
    const placeIndex = randomInt(0, value.scale - 1);
    const place = DECIMAL_PLACE_VALUES[placeIndex];
    const digit = digits[placeIndex];
    const representedValue = createDecimalValue(digit, place.scale);

    return createFieldQuestion({
        text: `${valueLabel} 的${place.name}數字是多少？代表多少？`,
        fields: [
            createIntegerField({ id: 'digit', label: '數字', expectedValue: digit }),
            createDecimalField({ id: 'value', label: '代表的小數', expectedValue: representedValue })
        ],
        meta: {
            promptType: 'decimal-place-value',
            decimalUnits: value.units,
            decimalScale: value.scale,
            decimalLabel: valueLabel,
            placeName: place.name,
            placeValueLabel: place.unitLabel,
            digit,
            representedValueLabel: formatDecimalValue(representedValue),
            correctInput: {
                digit: String(digit),
                value: formatDecimalValue(representedValue)
            }
        }
    });
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

const createProperFractionIntegerMultipleOperand = (denominator, multiplier) => {
    const numerators = Array.from({ length: denominator - 1 }, (_, index) => index + 1)
        .filter((numerator) =>
            numerator * multiplier > denominator
            && (numerator * multiplier) % denominator !== 0
        );

    if (numerators.length === 0) {
        return null;
    }

    return createFractionOperand(pickRandom(numerators), denominator);
};

const createImproperFractionIntegerMultipleOperand = (denominator, multiplier) => {
    const candidates = Array.from({ length: denominator * 4 - 1 }, (_, index) => denominator + 1 + index)
        .filter((numerator) =>
            numerator % denominator !== 0
            && (numerator * multiplier) % denominator !== 0
        );

    if (candidates.length === 0) {
        return null;
    }

    return createFractionOperand(pickRandom(candidates), denominator);
};

const createMixedFractionIntegerMultipleOperand = (denominator, multiplier) => {
    const candidates = Array.from({ length: 3 }, (_, wholeOffset) => wholeOffset + 1)
        .flatMap((whole) =>
            Array.from({ length: denominator - 1 }, (_, numeratorOffset) => numeratorOffset + 1)
                .filter((numerator) => ((whole * denominator) + numerator) * multiplier % denominator !== 0)
                .map((numerator) => ({ whole, numerator }))
        );

    if (candidates.length === 0) {
        return null;
    }

    const candidate = pickRandom(candidates);
    return createMixedOperand(candidate.whole, candidate.numerator, denominator);
};

const createFractionIntegerMultipleOperand = (operandKind, denominator, multiplier) => {
    if (operandKind === 'proper') {
        return createProperFractionIntegerMultipleOperand(denominator, multiplier);
    }

    if (operandKind === 'improper') {
        return createImproperFractionIntegerMultipleOperand(denominator, multiplier);
    }

    return createMixedFractionIntegerMultipleOperand(denominator, multiplier);
};

const createFractionIntegerMultipleQuestion = () => {
    const operandKind = pickRandom(['proper', 'improper', 'mixed']);
    let denominator;
    let multiplier;
    let leftOperand;

    do {
        denominator = randomInt(2, 9);
        multiplier = randomInt(2, 5);
        leftOperand = createFractionIntegerMultipleOperand(operandKind, denominator, multiplier);
    } while (!leftOperand);

    const answerTotalNumerator = leftOperand.totalNumerator * multiplier;
    const answerValue = createFractionValue(answerTotalNumerator, denominator);
    const displayAnswerLabel = formatFractionValueWithOriginalDenominator(
        answerTotalNumerator,
        denominator
    );

    return createFractionQuestion({
        text: `${leftOperand.label} × ${multiplier} = ?`,
        answerValue,
        standardAnswerLabel: displayAnswerLabel,
        requiredKind: 'mixed',
        placeholder: '例如 1 1/2',
        meta: {
            promptType: 'fraction-integer-multiple',
            operandKind,
            multiplier,
            denominator,
            leftTotalNumerator: leftOperand.totalNumerator,
            answerTotalNumerator,
            displayAnswerLabel
        }
    });
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

const createFractionIntegerMultipleUnit = () => ({
    id: 'fraction_integer_multiple',
    name: '分數的整數倍',
    description: '真分數、假分數與帶分數乘以整數',
    generateQuestion: () => createFractionIntegerMultipleQuestion()
});

const createDecimalIntroductionQuestion = () => {
    const promptType = pickRandom([
        'decimal-smallest-unit',
        'decimal-expanded-form',
        'decimal-place-value'
    ]);

    if (promptType === 'decimal-smallest-unit') {
        return createSmallestDecimalUnitQuestion();
    }

    if (promptType === 'decimal-expanded-form') {
        return createDecimalExpandedFormQuestion();
    }

    return createDecimalPlaceValueQuestion();
};

const createDecimalIntroductionUnit = () => ({
    id: 'decimal_introduction',
    name: '認識小數',
    description: '練習小數的位值、組成與分數表示',
    generateQuestion: () => createDecimalIntroductionQuestion()
});

const createDecimalAddSubQuestion = () => {
    const operator = Math.random() < 0.5 ? '+' : '-';
    let leftValue = createRandomDecimalUpTo100();
    let rightValue = createRandomDecimalUpTo100();

    if (operator === '-' && compareDecimalOrder(leftValue, rightValue) < 0) {
        [leftValue, rightValue] = [rightValue, leftValue];
    }

    const answerValue = operator === '+'
        ? addDecimalValues(leftValue, rightValue)
        : subtractDecimalValues(leftValue, rightValue);

    return createDecimalQuestion({
        text: `${formatDecimalValue(leftValue)} ${operator} ${formatDecimalValue(rightValue)} = ?`,
        answerValue,
        meta: {
            promptType: 'decimal-add-subtract',
            operator,
            leftUnits: leftValue.units,
            leftScale: leftValue.scale,
            leftLabel: formatDecimalValue(leftValue),
            rightUnits: rightValue.units,
            rightScale: rightValue.scale,
            rightLabel: formatDecimalValue(rightValue),
            answerUnits: answerValue.units,
            answerScale: answerValue.scale,
            answerLabel: formatDecimalValue(answerValue)
        }
    });
};

const createDecimalAddSubUnit = () => ({
    id: 'decimal_add_subtract',
    name: '小數加減',
    description: '兩個 0 到 100 的小數加減，答案不會是負數',
    generateQuestion: () => createDecimalAddSubQuestion()
});

const createDecimalPointShiftQuestion = () => {
    const operator = Math.random() < 0.5 ? '×' : '÷';
    let value;
    let exponent;
    let answerValue;

    do {
        value = createRandomDecimalUpTo100();
        exponent = randomInt(1, 4);
        answerValue = operator === '×'
            ? multiplyDecimalByPowerOfTen(value, exponent)
            : divideDecimalByPowerOfTen(value, exponent);
    } while (
        operator === '×'
        && compareDecimalOrder(answerValue, createDecimalValue(10000, 0)) > 0
    );

    const multiplier = 10 ** exponent;

    return createDecimalQuestion({
        text: `${formatDecimalValue(value)} ${operator} ${multiplier} = ?`,
        answerValue,
        meta: {
            promptType: 'decimal-point-shift',
            operator,
            exponent,
            multiplier,
            valueUnits: value.units,
            valueScale: value.scale,
            valueLabel: formatDecimalValue(value),
            answerUnits: answerValue.units,
            answerScale: answerValue.scale,
            answerLabel: formatDecimalValue(answerValue)
        }
    });
};

const createDecimalPointShiftUnit = () => ({
    id: 'decimal_point_shift',
    name: '小數點移動',
    description: '練習小數乘除 10、100、1000 等 10 的倍數',
    generateQuestion: () => createDecimalPointShiftQuestion()
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
        description: '真分數、假分數、帶分數、整數倍與同分母加減',
        icon: '🥧',
        color: '#f6b93b',
        units: [
            createProperFractionUnit(),
            createImproperFractionUnit(),
            createMixedFractionUnit(),
            createFractionIntegerMultipleUnit(),
            createFractionAddSubUnit()
        ]
    },
    {
        id: 'decimals',
        name: '小數',
        description: '認識小數、小數加減與小數點移動',
        icon: '🔢',
        color: '#55efc4',
        units: [
            createDecimalIntroductionUnit(),
            createDecimalAddSubUnit(),
            createDecimalPointShiftUnit()
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
