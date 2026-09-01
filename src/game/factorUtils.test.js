import { test } from 'vitest';
import assert from 'node:assert/strict';

import { gcd, getFactors, getMultiples, lcm } from './factorUtils.js';

test('getFactors returns every positive factor once in ascending order', () => {
    assert.deepEqual(getFactors(1), [1]);
    assert.deepEqual(getFactors(24), [1, 2, 3, 4, 6, 8, 12, 24]);
    assert.deepEqual(getFactors(36), [1, 2, 3, 4, 6, 9, 12, 18, 36]);
});

test('getMultiples starts at the first positive multiple and respects count', () => {
    assert.deepEqual(getMultiples(7, 5), [7, 14, 21, 28, 35]);
    assert.deepEqual(getMultiples(9, 0), []);
});

test('gcd and lcm support shared integer number theory calculations', () => {
    assert.equal(gcd(24, 18), 6);
    assert.equal(gcd(-24, 18), 6);
    assert.equal(gcd(0, 0), 1);
    assert.equal(lcm(4, 6), 12);
    assert.equal(lcm(-4, 6), 12);
    assert.equal(lcm(0, 6), 0);
});

test('factor utilities reject values outside their integer contracts', () => {
    assert.throws(() => getFactors(0), /greater than 0/);
    assert.throws(() => getMultiples(3, -1), /must not be negative/);
    assert.throws(() => gcd(3.5, 2), /must be an integer/);
});
