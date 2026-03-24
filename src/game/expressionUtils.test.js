import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
    createBinaryNode,
    createGroupNode,
    createValueNode,
    evaluateExpression,
    expressionToText,
    expressionToTex
} from './expressionUtils.js';

test('evaluateExpression uses left-to-right semantics for implicit multiplication prompts', () => {
    const expression = createBinaryNode(
        'multiply',
        createBinaryNode('divide', createValueNode(6), createValueNode(2)),
        createGroupNode(
            createBinaryNode('add', createValueNode(1), createValueNode(2)),
            'paren'
        ),
        { implicit: true }
    );

    const evaluation = evaluateExpression(expression);

    assert.equal(evaluation.value, 9);
    assert.deepEqual(evaluation.steps, [6, 2, 3, 1, 2, 3, 9]);
    assert.equal(expressionToText(expression), '6 ÷ 2(1 + 2)');
    assert.equal(expressionToTex(expression), '6 \\div 2(1 + 2)');
});

test('evaluateExpression rejects non-integer division steps', () => {
    const expression = createBinaryNode('divide', createValueNode(5), createValueNode(2));

    assert.throws(() => evaluateExpression(expression), /divide evenly/);
});
