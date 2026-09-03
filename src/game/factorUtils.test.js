import { test } from 'vitest';
import assert from 'node:assert/strict';

import { gcd, getFactors, getMultiples, lcm } from './factorUtils.js';

test('getFactors returns every positive factor once in ascending order', () => {
    assert.deepEqual(getFactors(1), [1]);
    assert.deepEqual(getFactors(24), [1, 2, 3, 4, 6, 8, 12, 24]);
    assert.deepEqual(getFactors(36), [1, 2, 3, 4, 6, 9, 12, 18, 36]);
});

test('getFactors matches direct divisibility across the practice range', () => {
    for (let value = 1; value <= 100; value += 1) {
        const expected = [];

        for (let candidate = 1; candidate <= value; candidate += 1) {
            if (value % candidate === 0) {
                expected.push(candidate);
            }
        }

        assert.deepEqual(getFactors(value), expected);
    }
});

test('getMultiples starts at the first positive multiple and respects count', () => {
    assert.deepEqual(getMultiples(7, 5), [7, 14, 21, 28, 35]);
    assert.deepEqual(getMultiples(9, 0), []);
});

test('gcd and lcm support shared integer number theory calculations', () => {
    assert.equal(gcd(24, 18), 6);
    assert.equal(gcd(-24, 18), 6);
    assert.equal(gcd(0, 18), 18);
    assert.throws(() => gcd(0, 0), /at least one non-zero integer/);
    assert.equal(lcm(4, 6), 12);
    assert.equal(lcm(-4, 6), 12);
    assert.equal(lcm(0, 6), 0);
});

test('gcd and lcm match independent exhaustive calculations in question ranges', () => {
    for (let left = 1; left <= 60; left += 1) {
        for (let right = 1; right <= 60; right += 1) {
            let expectedGcd = 1;

            for (let candidate = 1; candidate <= Math.min(left, right); candidate += 1) {
                if (left % candidate === 0 && right % candidate === 0) {
                    expectedGcd = candidate;
                }
            }

            assert.equal(gcd(left, right), expectedGcd);

            if (left <= 12 && right <= 12) {
                let expectedLcm = Math.max(left, right);

                while (expectedLcm % left !== 0 || expectedLcm % right !== 0) {
                    expectedLcm += 1;
                }

                assert.equal(lcm(left, right), expectedLcm);
            }
        }
    }
});

test('factor utilities reject values outside their integer contracts', () => {
    assert.throws(() => getFactors(0), /greater than 0/);
    assert.throws(() => getMultiples(3, -1), /must not be negative/);
    assert.throws(() => gcd(3.5, 2), /must be an integer/);
});
