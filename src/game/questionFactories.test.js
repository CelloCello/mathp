import { test } from 'vitest';
import assert from 'node:assert/strict';

import { createDecimalValue } from './decimalUtils.js';
import { createDecimalQuestion, createFieldQuestion } from './questionFactories.js';

test('createDecimalQuestion validates decimal answers with existing question contract labels', () => {
    const question = createDecimalQuestion({
        text: '4.5 + 0.06 = ?',
        answerValue: createDecimalValue(456, 2)
    });

    const correct = question.evaluate('4.560');
    const wrong = question.evaluate('4.57');
    const invalid = question.evaluate('456/100');

    assert.equal(question.inputMode, 'decimal');
    assert.equal(correct.isCorrect, true);
    assert.equal(correct.userAnswerLabel, '4.56');
    assert.equal(correct.correctAnswerLabel, '4.56');
    assert.equal(correct.validationError, null);
    assert.equal(wrong.isCorrect, false);
    assert.equal(wrong.correctAnswerLabel, '4.56');
    assert.equal(invalid.validationError, '請輸入小數或整數。');
});

test('createFieldQuestion validates object keyed field answers', () => {
    const question = createFieldQuestion({
        text: '0.32 是幾個 0.01？',
        formulaPreview: {
            parts: [{ fieldId: 'count', multiplierLabel: '0.01' }]
        },
        fields: [
            {
                id: 'count',
                label: '幾個',
                answerKind: 'integer',
                expectedValue: 32,
                displayValue: '32'
            },
            {
                id: 'unit',
                label: '最小小數',
                answerKind: 'decimal',
                expectedValue: createDecimalValue(1, 2),
                displayValue: '0.01'
            }
        ]
    });

    const correct = question.evaluate({ count: '32', unit: '0.010' });
    const wrong = question.evaluate({ count: '31', unit: '0.01' });
    const missing = question.evaluate({ count: '', unit: '0.01' });

    assert.equal(question.inputMode, 'fields');
    assert.deepEqual(question.formulaPreview, {
        parts: [{ fieldId: 'count', multiplierLabel: '0.01' }]
    });
    assert.equal(correct.isCorrect, true);
    assert.equal(correct.userAnswerLabel, '幾個: 32、最小小數: 0.01');
    assert.equal(correct.correctAnswerLabel, '幾個: 32、最小小數: 0.01');
    assert.equal(wrong.isCorrect, false);
    assert.equal(wrong.validationError, null);
    assert.equal(missing.validationError, '請填寫「幾個」。');
});

test('createFieldQuestion accepts unordered integer lists with common Chinese separators', () => {
    const question = createFieldQuestion({
        text: '填出 12 的所有因數，順序不拘。',
        fields: [
            {
                id: 'factors',
                label: '所有因數',
                answerKind: 'integer-list',
                expectedValues: [1, 2, 3, 4, 6, 12],
                displayValue: '1、2、3、4、6、12'
            }
        ]
    });

    const correct = question.evaluate({ factors: '1, 2，3、4 6 12' });
    const spaceSeparated = question.evaluate({ factors: '12 6 4 3 2 1' });
    const duplicate = question.evaluate({ factors: '1 2 3 4 6 6' });
    const malformed = question.evaluate({ factors: '1, 2, 三, 4, 6, 12' });

    assert.equal(correct.isCorrect, true);
    assert.equal(correct.userAnswerLabel, '所有因數: 1、2、3、4、6、12');
    assert.equal(correct.correctAnswerLabel, '所有因數: 1、2、3、4、6、12');
    assert.equal(spaceSeparated.isCorrect, true);
    assert.equal(spaceSeparated.userAnswerLabel, '所有因數: 12、6、4、3、2、1');
    assert.equal(duplicate.validationError, '「所有因數」請勿重複輸入相同整數。');
    assert.equal(malformed.validationError, '「所有因數」請用逗號、頓號或空格分隔整數。');
});
