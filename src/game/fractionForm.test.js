import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
    createFractionSpec,
    serializeStructuredFractionAnswer,
    validateStructuredFractionAnswer
} from './fractionForm.js';

test('createFractionSpec maps required kinds to structured entry defaults', () => {
    const mixedSpec = createFractionSpec('mixed');
    const integerSpec = createFractionSpec('integer');
    const anySpec = createFractionSpec('any');

    assert.equal(mixedSpec.preferredEntryMode, 'mixed');
    assert.equal(mixedSpec.example, '1 1/2');
    assert.equal(integerSpec.preferredEntryMode, 'integer');
    assert.deepEqual(anySpec.allowedEntryModes, ['fraction', 'mixed', 'integer']);
    assert.equal(anySpec.allowDirectText, true);
});

test('structured fraction answers validate required fields and serialize to legacy strings', () => {
    assert.equal(
        validateStructuredFractionAnswer({
            entryMode: 'fraction',
            fields: { numerator: '', denominator: '5' }
        }),
        '請完整輸入分子和分母。'
    );
    assert.equal(
        validateStructuredFractionAnswer({
            entryMode: 'fraction',
            fields: { numerator: '3', denominator: '0' }
        }),
        '分母不能是 0。'
    );
    assert.equal(
        validateStructuredFractionAnswer({
            entryMode: 'mixed',
            fields: { whole: '1', numerator: '4', denominator: '4' }
        }),
        '帶分數的小分數部分要是真分數。'
    );

    assert.equal(
        serializeStructuredFractionAnswer({
            entryMode: 'integer',
            fields: { whole: '2' }
        }),
        '2'
    );
    assert.equal(
        serializeStructuredFractionAnswer({
            entryMode: 'fraction',
            fields: { numerator: '7', denominator: '4' }
        }),
        '7/4'
    );
    assert.equal(
        serializeStructuredFractionAnswer({
            entryMode: 'mixed',
            fields: { whole: '1', numerator: '1', denominator: '2' }
        }),
        '1 1/2'
    );
});
