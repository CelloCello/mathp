import { test } from 'vitest';
import assert from 'node:assert/strict';

import { tokenizeFractionText } from './fractionTextUtils.js';

test('tokenizeFractionText extracts fractions and mixed numbers from prompts', () => {
    const tokens = tokenizeFractionText('把 2 1/3 + 1/3 = ?');

    assert.deepEqual(
        tokens.filter((token) => token.type !== 'text'),
        [
            {
                type: 'mixed',
                raw: '2 1/3',
                whole: '2',
                numerator: '1',
                denominator: '3'
            },
            {
                type: 'fraction',
                raw: '1/3',
                numerator: '1',
                denominator: '3'
            }
        ]
    );
});

test('tokenizeFractionText falls back safely for plain text and standalone integers', () => {
    assert.deepEqual(tokenizeFractionText('下面哪一個是真分數？'), [
        { type: 'text', value: '下面哪一個是真分數？' }
    ]);
    assert.deepEqual(tokenizeFractionText('2'), [
        { type: 'integer', value: '2' }
    ]);
});
