import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
    compareFractionValues,
    createFractionValue,
    formatFractionValue,
    formatFractionValueWithOriginalDenominator,
    parseFractionInput
} from './fractionUtils.js';
import { createFractionQuestion } from './questionFactories.js';

test('parseFractionInput supports integer, fraction, and mixed-number formats', () => {
    const integer = parseFractionInput('7');
    const fraction = parseFractionInput(' 6/8 ');
    const mixed = parseFractionInput('2   3/5');

    assert.equal(integer.isValid, true);
    assert.deepEqual(integer.value, { numerator: 7, denominator: 1 });

    assert.equal(fraction.isValid, true);
    assert.deepEqual(fraction.value, { numerator: 3, denominator: 4 });
    assert.equal(fraction.displayLabel, '6/8');

    assert.equal(mixed.isValid, true);
    assert.deepEqual(mixed.value, { numerator: 13, denominator: 5 });
    assert.equal(mixed.displayLabel, '2 3/5');
});

test('parseFractionInput rejects unsupported fraction syntax', () => {
    assert.equal(parseFractionInput('').error, '請先輸入答案。');
    assert.equal(parseFractionInput('3/0').error, '分母不能是 0。');
    assert.equal(parseFractionInput('1 4/4').error, '帶分數的小分數部分要是真分數。');
    assert.equal(parseFractionInput('abc').error, '請用整數、a/b 或 w a/b 的格式作答。');
});

test('fraction question accepts equivalent answers but can still enforce answer format', () => {
    const addQuestion = createFractionQuestion({
        text: '1/4 + 1/4 = ?',
        answerValue: createFractionValue(1, 2),
        standardAnswerLabel: formatFractionValue(createFractionValue(1, 2))
    });
    const mixedQuestion = createFractionQuestion({
        text: '把 7/3 化成帶分數',
        answerValue: createFractionValue(7, 3),
        standardAnswerLabel: '2 1/3',
        requiredKind: 'mixed'
    });

    const equivalentAnswer = addQuestion.evaluate('2/4');
    const formatMismatch = mixedQuestion.evaluate('7/3');

    assert.equal(addQuestion.fractionSpec.preferredEntryMode, 'fraction');
    assert.equal(mixedQuestion.fractionSpec.requiredKind, 'mixed');
    assert.equal(mixedQuestion.fractionSpec.example, '1 1/2');

    assert.equal(equivalentAnswer.isCorrect, true);
    assert.equal(equivalentAnswer.validationError, null);

    assert.equal(formatMismatch.isCorrect, false);
    assert.equal(formatMismatch.validationError, null);
    assert.equal(formatMismatch.note, '這題要用帶分數作答。');
});

test('fraction integer multiple answers can preserve display denominator while accepting equivalent mixed answers', () => {
    const displayAnswerLabel = formatFractionValueWithOriginalDenominator(45, 6);
    const question = createFractionQuestion({
        text: '9/6 × 5 = ?',
        answerValue: createFractionValue(45, 6),
        standardAnswerLabel: displayAnswerLabel,
        requiredKind: 'mixed'
    });

    const equivalentMixedAnswer = question.evaluate('7 1/2');
    const improperAnswer = question.evaluate('45/6');

    assert.equal(displayAnswerLabel, '7 3/6');
    assert.equal(formatFractionValueWithOriginalDenominator(15, 9), '1 6/9');
    assert.equal(equivalentMixedAnswer.isCorrect, true);
    assert.equal(equivalentMixedAnswer.correctAnswerLabel, '7 3/6');
    assert.equal(improperAnswer.isCorrect, false);
    assert.equal(improperAnswer.validationError, null);
    assert.equal(improperAnswer.note, '這題要用帶分數作答。');
});

test('compareFractionValues normalizes equivalent fractions', () => {
    assert.equal(
        compareFractionValues(createFractionValue(2, 4), createFractionValue(1, 2)),
        true
    );
});
