import { test } from 'vitest';
import assert from 'node:assert/strict';

import { getUnitById } from './categories.js';
import { formatFractionValue } from './fractionUtils.js';
import { createQuestionSet, getSelectionLabels } from './session.js';

const parseImproperText = (text) => {
    const match = text.match(/把 (\d+)\/(\d+) 化成帶分數/);
    if (!match) {
        return null;
    }

    return {
        numerator: Number(match[1]),
        denominator: Number(match[2])
    };
};

const findQuestion = (unit, predicate, message) => {
    for (let index = 0; index < 300; index += 1) {
        const candidate = unit.generateQuestion();
        if (predicate(candidate)) {
            return candidate;
        }
    }

    assert.fail(message);
};

test('session helpers generate questions for a selected category and unit', () => {
    const questions = createQuestionSet('addition_basic', 'within_10', 5);

    assert.equal(questions.length, 5);
    assert.ok(questions.every((question) => question.inputMode === 'number'));
    assert.deepEqual(getSelectionLabels('addition_basic', 'within_10'), {
        categoryName: '基礎加法',
        unitName: '10 以內加法'
    });
});

test('mixed fraction conversion marks equivalent but wrong-format answers as incorrect', () => {
    const unit = getUnitById('fractions', 'mixed_fraction');
    let question = null;

    for (let index = 0; index < 100; index += 1) {
        const candidate = unit.generateQuestion();
        if (candidate.meta.promptType === 'improper-to-mixed') {
            question = candidate;
            break;
        }
    }

    assert.ok(question, 'Expected an improper-to-mixed conversion question.');

    const improper = parseImproperText(question.text);
    const result = question.evaluate(`${improper.numerator}/${improper.denominator}`);

    assert.equal(result.isCorrect, false);
    assert.equal(result.validationError, null);
    assert.equal(result.note, '這題要用帶分數作答。');
});

test('fraction addition/subtraction rejects improper fractions when the result must be mixed', () => {
    const unit = getUnitById('fractions', 'fraction_add_subtract');
    const question = findQuestion(
        unit,
        (candidate) => candidate.meta.resultKind === 'mixed',
        'Expected a mixed-number result question.'
    );
    const result = question.evaluate(
        `${question.meta.resultNumerator}/${question.meta.resultDenominator}`
    );

    assert.equal(result.isCorrect, false);
    assert.equal(result.validationError, null);
    assert.equal(result.note, '這題要用帶分數作答。');
});

test('fraction addition/subtraction accepts equivalent unreduced answers for fraction results', () => {
    const unit = getUnitById('fractions', 'fraction_add_subtract');
    const question = findQuestion(
        unit,
        (candidate) => candidate.meta.resultKind === 'fraction',
        'Expected a proper-fraction result question.'
    );
    const result = question.evaluate(
        `${question.meta.resultNumerator * 2}/${question.meta.resultDenominator * 2}`
    );

    assert.equal(result.isCorrect, true);
    assert.equal(result.validationError, null);
});

test('fraction addition/subtraction requires integers for integer results', () => {
    const unit = getUnitById('fractions', 'fraction_add_subtract');
    const question = findQuestion(
        unit,
        (candidate) => candidate.meta.resultKind === 'integer',
        'Expected an integer-result question.'
    );
    const integerAnswer = formatFractionValue({
        numerator: question.meta.resultNumerator,
        denominator: question.meta.resultDenominator
    });
    const wrongFormat = question.evaluate(`${Number(integerAnswer) * 2}/2`);
    const correctFormat = question.evaluate(integerAnswer);

    assert.equal(wrongFormat.isCorrect, false);
    assert.equal(wrongFormat.validationError, null);
    assert.equal(wrongFormat.note, '這題要用整數作答。');
    assert.equal(correctFormat.isCorrect, true);
    assert.equal(correctFormat.validationError, null);
});
