import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
    convertMathSegmentToTex,
    createExpressionPromptTex,
    tokenizeMathContent
} from './mathContentUtils.js';
import {
    createBinaryNode,
    createGroupNode,
    createValueNode
} from '../game/expressionUtils.js';

test('tokenizeMathContent groups fraction expressions and leaves plain text untouched', () => {
    assert.deepEqual(tokenizeMathContent('把 2 1/3 + 1/3 = ? 化成帶分數'), [
        { type: 'text', value: '把 ' },
        { type: 'math', raw: '2 1/3 + 1/3 = ?', tex: '2\\frac{1}{3} + \\frac{1}{3} = ?' },
        { type: 'text', value: ' 化成帶分數' }
    ]);

    assert.deepEqual(tokenizeMathContent('下面哪一個是真分數？'), [
        { type: 'text', value: '下面哪一個是真分數？' }
    ]);
});

test('convertMathSegmentToTex supports standalone integers and bracket adjacency', () => {
    assert.equal(convertMathSegmentToTex('2'), '2');
    assert.equal(convertMathSegmentToTex('6÷2(1＋2)=?'), '6 \\div 2(1 + 2) = ?');
});

test('createExpressionPromptTex renders expression models with prompt suffix', () => {
    const expression = createBinaryNode(
        'multiply',
        createBinaryNode('divide', createValueNode(6), createValueNode(2)),
        createGroupNode(
            createBinaryNode('add', createValueNode(1), createValueNode(2)),
            'paren'
        ),
        { implicit: true }
    );

    assert.equal(createExpressionPromptTex(expression, '6÷2(1+2) = ?'), '6 \\div 2(1 + 2) = ?');
});
