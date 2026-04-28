import { test } from 'vitest';
import assert from 'node:assert/strict';

import { categories, getCategoryById, getUnitById } from './categories.js';
import {
    createDecimalValue,
    compareDecimalOrder,
    formatDecimalValue,
    multiplyDecimalByInteger,
    multiplyDecimalByPowerOfTen,
    divideDecimalByPowerOfTen,
    addDecimalValues,
    subtractDecimalValues
} from './decimalUtils.js';

test('all categories expose units and helpers resolve category / unit ids', () => {
    assert.ok(categories.length >= 7);
    assert.ok(categories.every((category) => Array.isArray(category.units) && category.units.length > 0));

    const fractions = getCategoryById('fractions');
    const mixedFractionUnit = getUnitById('fractions', 'mixed_fraction');
    const decimals = getCategoryById('decimals');
    const decimalIntroUnit = getUnitById('decimals', 'decimal_introduction');
    const arithmetic = getCategoryById('arithmetic');
    const arithmeticUnit = getUnitById('arithmetic', 'integer_order_of_operations');

    assert.equal(fractions?.name, '分數');
    assert.equal(mixedFractionUnit?.name, '帶分數');
    assert.equal(decimals?.name, '小數');
    assert.equal(decimalIntroUnit?.name, '認識小數');
    assert.equal(arithmetic?.name, '四則運算');
    assert.equal(arithmeticUnit?.name, '基礎整數運算');
});

test('fraction category unit input modes match the plan requirements', () => {
    const proper = getUnitById('fractions', 'proper_fraction');
    const improper = getUnitById('fractions', 'improper_fraction');
    const mixed = getUnitById('fractions', 'mixed_fraction');
    const integerMultiple = getUnitById('fractions', 'fraction_integer_multiple');
    const addSub = getUnitById('fractions', 'fraction_add_subtract');

    assert.equal(proper.generateQuestion().inputMode, 'choice');
    assert.equal(improper.generateQuestion().inputMode, 'choice');
    assert.equal(mixed.generateQuestion().inputMode, 'fraction');
    assert.equal(integerMultiple.generateQuestion().inputMode, 'fraction');
    assert.equal(addSub.generateQuestion().inputMode, 'fraction');
});

test('approximation questions only use hundreds, thousands, or ten-thousands', () => {
    const unit = getUnitById('approximation', 'rounding');
    const seenPlaces = new Set();
    const seenMethods = new Set();

    for (let index = 0; index < 200; index += 1) {
        const question = unit.generateQuestion();
        seenPlaces.add(question.meta.placeName);
        seenMethods.add(question.meta.methodName);

        assert.match(question.text, /(百位|千位|萬位)/);
        assert.doesNotMatch(question.text, /十位/);
    }

    assert.deepEqual([...seenPlaces].sort(), ['千位', '百位', '萬位'].sort());
    assert.deepEqual(
        [...seenMethods].sort(),
        ['四捨五入法', '無條件進入法', '無條件捨去法'].sort()
    );
});

test('fraction add/subtract never uses identical operands or zero-result subtraction prompts', () => {
    const unit = getUnitById('fractions', 'fraction_add_subtract');
    const seenPatterns = new Set();
    let sawMixedPrompt = false;

    for (let index = 0; index < 300; index += 1) {
        const question = unit.generateQuestion();
        const {
            operandPattern,
            operator,
            leftKind,
            rightKind,
            leftTotalNumerator,
            rightTotalNumerator,
            resultNumerator
        } = question.meta;

        seenPatterns.add(operandPattern);
        sawMixedPrompt = sawMixedPrompt || leftKind === 'mixed' || rightKind === 'mixed';

        assert.notEqual(leftTotalNumerator, rightTotalNumerator);

        if (operator === '-') {
            assert.ok(leftTotalNumerator > rightTotalNumerator);
            assert.ok(resultNumerator > 0);
        }
    }

    assert.equal(sawMixedPrompt, true);
    assert.deepEqual(
        [...seenPatterns].sort(),
        ['fraction-fraction', 'fraction-mixed', 'mixed-fraction', 'mixed-mixed'].sort()
    );
});

test('fraction units expose fractionSpec that matches the expected answer format', () => {
    const mixedUnit = getUnitById('fractions', 'mixed_fraction');
    const integerMultipleUnit = getUnitById('fractions', 'fraction_integer_multiple');
    const addSubUnit = getUnitById('fractions', 'fraction_add_subtract');
    const mixedPromptTypes = new Set();
    const integerMultipleOperandKinds = new Set();
    const addSubResultKinds = new Set();

    for (let index = 0; index < 300; index += 1) {
        const mixedQuestion = mixedUnit.generateQuestion();
        mixedPromptTypes.add(mixedQuestion.meta.promptType);

        if (mixedQuestion.meta.promptType === 'improper-to-mixed') {
            assert.equal(mixedQuestion.fractionSpec.requiredKind, 'mixed');
            assert.equal(mixedQuestion.fractionSpec.preferredEntryMode, 'mixed');
        }

        if (mixedQuestion.meta.promptType === 'mixed-to-improper') {
            assert.equal(mixedQuestion.fractionSpec.requiredKind, 'improper');
            assert.equal(mixedQuestion.fractionSpec.preferredEntryMode, 'fraction');
        }

        const integerMultipleQuestion = integerMultipleUnit.generateQuestion();
        const {
            promptType,
            operandKind,
            multiplier,
            denominator,
            leftTotalNumerator,
            answerTotalNumerator,
            displayAnswerLabel
        } = integerMultipleQuestion.meta;
        const displayAnswerEvaluation = integerMultipleQuestion.evaluate(displayAnswerLabel);

        integerMultipleOperandKinds.add(operandKind);

        assert.equal(promptType, 'fraction-integer-multiple');
        assert.equal(integerMultipleQuestion.fractionSpec.requiredKind, 'mixed');
        assert.equal(integerMultipleQuestion.fractionSpec.preferredEntryMode, 'mixed');
        assert.ok(multiplier >= 2 && multiplier <= 5);
        assert.ok(denominator >= 2 && denominator <= 9);
        assert.ok(answerTotalNumerator > denominator);
        assert.notEqual((leftTotalNumerator * multiplier) % denominator, 0);
        assert.equal(answerTotalNumerator, leftTotalNumerator * multiplier);
        assert.equal(displayAnswerEvaluation.isCorrect, true);
        assert.equal(displayAnswerEvaluation.correctAnswerLabel, displayAnswerLabel);

        const addSubQuestion = addSubUnit.generateQuestion();
        addSubResultKinds.add(addSubQuestion.meta.resultKind);

        if (addSubQuestion.meta.resultKind === 'mixed') {
            assert.equal(addSubQuestion.fractionSpec.preferredEntryMode, 'mixed');
        }

        if (addSubQuestion.meta.resultKind === 'fraction') {
            assert.equal(addSubQuestion.fractionSpec.preferredEntryMode, 'fraction');
        }

        if (addSubQuestion.meta.resultKind === 'integer') {
            assert.equal(addSubQuestion.fractionSpec.preferredEntryMode, 'integer');
        }
    }

    assert.deepEqual([...mixedPromptTypes].sort(), ['improper-to-mixed', 'mixed-to-improper'].sort());
    assert.deepEqual([...integerMultipleOperandKinds].sort(), ['improper', 'mixed', 'proper'].sort());
    assert.deepEqual([...addSubResultKinds].sort(), ['fraction', 'integer', 'mixed'].sort());
});

test('arithmetic unit emits all order-of-operations rule types with integer-safe answers', () => {
    const unit = getUnitById('arithmetic', 'integer_order_of_operations');
    const seenRuleTypes = new Set();
    let sawImplicitMultiplication = false;

    for (let index = 0; index < 400; index += 1) {
        const question = unit.generateQuestion();
        const answer = question.meta.answer;

        seenRuleTypes.add(question.meta.ruleType);
        sawImplicitMultiplication = sawImplicitMultiplication || question.meta.usesImplicitMultiplication;

        assert.equal(question.inputMode, 'number');
        assert.equal(question.meta.renderKind, 'expression');
        assert.ok(Number.isInteger(answer));
        assert.ok(answer > 0);
        assert.ok(question.meta.evaluationSteps.every((step) => Number.isInteger(step) && step > 0));
    }

    assert.deepEqual(
        [...seenRuleTypes].sort(),
        ['left-to-right', 'nested-brackets', 'parentheses', 'precedence'].sort()
    );
    assert.equal(sawImplicitMultiplication, true);
});

test('decimal category exposes the expected units and input modes', () => {
    const introduction = getUnitById('decimals', 'decimal_introduction');
    const addSub = getUnitById('decimals', 'decimal_add_subtract');
    const integerMultiply = getUnitById('decimals', 'decimal_integer_multiply');
    const pointShift = getUnitById('decimals', 'decimal_point_shift');

    assert.equal(introduction.generateQuestion().inputMode, 'fields');
    assert.equal(addSub.generateQuestion().inputMode, 'decimal');
    assert.equal(integerMultiply.generateQuestion().inputMode, 'decimal');
    assert.equal(pointShift.generateQuestion().inputMode, 'decimal');
});

test('decimal introduction emits all prompt types with self-validating field answers', () => {
    const unit = getUnitById('decimals', 'decimal_introduction');
    const seenPromptTypes = new Set();

    for (let index = 0; index < 500; index += 1) {
        const question = unit.generateQuestion();
        const { meta } = question;

        seenPromptTypes.add(meta.promptType);

        assert.equal(question.inputMode, 'fields');
        assert.ok(meta.decimalUnits > 0);
        assert.ok(meta.decimalScale >= 1 && meta.decimalScale <= 3);
        assert.equal(formatDecimalValue(createDecimalValue(meta.decimalUnits, meta.decimalScale)), meta.decimalLabel);

        const evaluation = question.evaluate(meta.correctInput);
        assert.equal(evaluation.isCorrect, true);
        assert.equal(evaluation.validationError, null);

        if (meta.promptType === 'decimal-smallest-unit') {
            assert.equal(meta.fractionNumerator, meta.decimalUnits);
            assert.equal(meta.fractionDenominator, 10 ** meta.decimalScale);
            assert.equal(meta.smallestUnitLabel, formatDecimalValue(createDecimalValue(1, meta.decimalScale)));
            assert.deepEqual(
                question.fields.map((field) => field.id),
                ['count', 'numerator', 'denominator']
            );
            assert.equal(question.fields[0].label, `${meta.smallestUnitLabel} 的個數`);
        }

        if (meta.promptType === 'decimal-expanded-form') {
            assert.ok(meta.terms.length > 0);
            assert.ok(meta.terms.every((term) => term.digit > 0));
            assert.ok(meta.terms.every((term) => term.placeValueLabel));
            assert.deepEqual(
                question.formulaPreview.parts,
                meta.terms.map((term) => ({
                    fieldId: term.fieldId,
                    multiplierLabel: term.placeValueLabel
                }))
            );
        }

        if (meta.promptType === 'decimal-place-value') {
            assert.ok(meta.decimalScale >= 2);
            assert.equal(
                meta.representedValueLabel,
                formatDecimalValue(createDecimalValue(meta.digit, { '十分位': 1, '百分位': 2, '千分位': 3 }[meta.placeName]))
            );
        }
    }

    assert.deepEqual(
        [...seenPromptTypes].sort(),
        ['decimal-expanded-form', 'decimal-place-value', 'decimal-smallest-unit'].sort()
    );
});

test('decimal add/subtract questions stay in range and never subtract below zero', () => {
    const unit = getUnitById('decimals', 'decimal_add_subtract');

    for (let index = 0; index < 400; index += 1) {
        const question = unit.generateQuestion();
        const {
            operator,
            leftUnits,
            leftScale,
            rightUnits,
            rightScale,
            answerUnits,
            answerScale,
            answerLabel
        } = question.meta;
        const left = createDecimalValue(leftUnits, leftScale);
        const right = createDecimalValue(rightUnits, rightScale);
        const expected = operator === '+'
            ? addDecimalValues(left, right)
            : subtractDecimalValues(left, right);

        assert.equal(question.inputMode, 'decimal');
        assert.ok(leftScale <= 3);
        assert.ok(rightScale <= 3);
        assert.ok(leftUnits <= 100 * (10 ** leftScale));
        assert.ok(rightUnits <= 100 * (10 ** rightScale));
        assert.equal(formatDecimalValue(expected), answerLabel);
        assert.equal(answerUnits, expected.units);
        assert.equal(answerScale, expected.scale);
        assert.equal(question.evaluate(answerLabel.includes('.') ? `${answerLabel}0` : `${answerLabel}.0`).isCorrect, true);
    }
});

test('decimal integer multiplication questions stay in range and use exact answers', () => {
    const unit = getUnitById('decimals', 'decimal_integer_multiply');
    const seenPatterns = new Set();
    const seenScales = new Set();
    let sawFriendlyMultiplier = false;
    let sawLargerMultiplier = false;

    for (let index = 0; index < 800; index += 1) {
        const question = unit.generateQuestion();
        const {
            promptType,
            pattern,
            decimalUnits,
            decimalScale,
            decimalLabel,
            multiplier,
            answerUnits,
            answerScale,
            answerLabel
        } = question.meta;
        const value = createDecimalValue(decimalUnits, decimalScale);
        const expected = multiplyDecimalByInteger(value, multiplier);
        const equivalentAnswer = answerLabel.includes('.') ? `${answerLabel}0` : `${answerLabel}.0`;

        seenPatterns.add(pattern);
        seenScales.add(decimalScale);
        sawFriendlyMultiplier = sawFriendlyMultiplier || multiplier <= 12 || multiplier % 10 === 0;
        sawLargerMultiplier = sawLargerMultiplier || multiplier > 12;

        assert.equal(question.inputMode, 'decimal');
        assert.equal(promptType, 'decimal-integer-multiply');
        assert.equal(question.text, `${decimalLabel} × ${multiplier} = ?`);
        assert.ok(decimalUnits > 0);
        assert.ok(decimalScale >= 1 && decimalScale <= 2);
        assert.ok(decimalUnits < 100 * (10 ** decimalScale));
        assert.equal(formatDecimalValue(value), decimalLabel);
        assert.ok(multiplier >= 1 && multiplier <= 99);
        assert.equal(formatDecimalValue(expected), answerLabel);
        assert.equal(answerUnits, expected.units);
        assert.equal(answerScale, expected.scale);
        assert.equal(question.evaluate(answerLabel).isCorrect, true);
        assert.equal(question.evaluate(equivalentAnswer).isCorrect, true);
    }

    assert.deepEqual(
        [...seenPatterns].sort(),
        ['easy-one-decimal', 'easy-two-decimal', 'mixed-two-decimal'].sort()
    );
    assert.deepEqual([...seenScales].sort(), [1, 2]);
    assert.equal(sawFriendlyMultiplier, true);
    assert.equal(sawLargerMultiplier, true);
});

test('decimal point shift questions use powers of ten and exact answers', () => {
    const unit = getUnitById('decimals', 'decimal_point_shift');
    const seenOperators = new Set();

    for (let index = 0; index < 400; index += 1) {
        const question = unit.generateQuestion();
        const {
            operator,
            exponent,
            multiplier,
            valueUnits,
            valueScale,
            answerUnits,
            answerScale,
            answerLabel
        } = question.meta;
        const value = createDecimalValue(valueUnits, valueScale);
        const expected = operator === '×'
            ? multiplyDecimalByPowerOfTen(value, exponent)
            : divideDecimalByPowerOfTen(value, exponent);

        seenOperators.add(operator);

        assert.equal(question.inputMode, 'decimal');
        assert.ok(exponent >= 1 && exponent <= 4);
        assert.equal(multiplier, 10 ** exponent);
        assert.ok(multiplier <= 10000);
        assert.ok(valueScale <= 3);
        assert.ok(valueUnits <= 100 * (10 ** valueScale));
        assert.equal(formatDecimalValue(expected), answerLabel);
        assert.equal(answerUnits, expected.units);
        assert.equal(answerScale, expected.scale);
        if (operator === '×') {
            assert.ok(compareDecimalOrder(expected, createDecimalValue(10000, 0)) <= 0);
        }
        assert.equal(question.evaluate(answerLabel).isCorrect, true);
    }

    assert.deepEqual([...seenOperators].sort(), ['×', '÷'].sort());
});
