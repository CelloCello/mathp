import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
    addDecimalValues,
    compareDecimalOrder,
    compareDecimalValues,
    createDecimalValue,
    divideDecimalByPowerOfTen,
    formatDecimalValue,
    multiplyDecimalByPowerOfTen,
    parseDecimalInput,
    subtractDecimalValues
} from './decimalUtils.js';

test('parseDecimalInput accepts integers, decimals, and equivalent trailing zeros', () => {
    const base = parseDecimalInput('4.56');
    const trailingZeros = parseDecimalInput('4.560');
    const integer = parseDecimalInput('3420');

    assert.equal(base.isValid, true);
    assert.equal(trailingZeros.isValid, true);
    assert.equal(integer.isValid, true);
    assert.equal(compareDecimalValues(base.value, trailingZeros.value), true);
    assert.equal(formatDecimalValue(trailingZeros.value), '4.56');
    assert.equal(formatDecimalValue(integer.value), '3420');
});

test('parseDecimalInput rejects unsupported formats', () => {
    assert.equal(parseDecimalInput('').error, '請先輸入答案。');
    assert.equal(parseDecimalInput('1/2').error, '請輸入小數或整數。');
    assert.equal(parseDecimalInput('1,000').error, '請輸入小數或整數。');
    assert.equal(parseDecimalInput('.5').error, '請輸入小數或整數。');
    assert.equal(parseDecimalInput('-0.5').error, '請輸入小數或整數。');
});

test('decimal arithmetic uses scaled integer operations', () => {
    const oneTenth = createDecimalValue(1, 1);
    const twoTenths = createDecimalValue(2, 1);
    const sum = addDecimalValues(oneTenth, twoTenths);
    const difference = subtractDecimalValues(createDecimalValue(100, 2), createDecimalValue(1, 3));

    assert.equal(formatDecimalValue(sum), '0.3');
    assert.equal(formatDecimalValue(difference), '0.999');
    assert.equal(compareDecimalOrder(createDecimalValue(123, 2), createDecimalValue(1229, 3)), 1);
});

test('power-of-ten shifting keeps exact decimal values', () => {
    assert.equal(formatDecimalValue(multiplyDecimalByPowerOfTen(createDecimalValue(342, 2), 3)), '3420');
    assert.equal(formatDecimalValue(multiplyDecimalByPowerOfTen(createDecimalValue(456, 1), 1)), '456');
    assert.equal(formatDecimalValue(divideDecimalByPowerOfTen(createDecimalValue(456, 1), 1)), '4.56');
});
