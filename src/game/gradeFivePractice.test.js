import { test } from 'vitest';
import assert from 'node:assert/strict';
import { categories, getUnitById } from './categories.js';
import { createQuestionSet } from './session.js';

const practiceUnits = categories.flatMap((category) => category.units
    .filter((unit) => unit.practiceVariants)
    .map((unit) => ({ categoryId: category.id, unit })));

test('the agreed thirteen units are registered and each session meets quotas without duplicate questions', () => {
    assert.equal(practiceUnits.length, 13);
    assert.equal(getUnitById('fractions', 'fraction_add_subtract_unlike').name, '異分母通分練習');
    for (const { categoryId, unit } of practiceUnits) {
        const variants = unit.practiceVariants;
        const totalWeight = variants.reduce((sum, item) => sum + item.weight, 0);
        for (const size of [5, 10, 20, 50]) {
            for (let sample = 0; sample < 10; sample += 1) {
                const questions = createQuestionSet(categoryId, unit.id, size);
                assert.equal(questions.length, size);
                assert.equal(new Set(questions.map((question) => question.meta.practiceKey ?? question.text)).size, size, unit.id);
                for (let index = 1; index < questions.length; index += 1) {
                    assert.ok(questions[index].meta.practiceLevel >= questions[index - 1].meta.practiceLevel);
                }
                for (const variant of variants) {
                    const count = questions.filter((question) => question.meta.practiceType === variant.id).length;
                    const expected = size * variant.weight / totalWeight;
                    assert.ok(count === Math.floor(expected) || count === Math.ceil(expected), `${unit.id}/${variant.id}: ${count} of ${size}`);
                }
                assert.ok(questions.every((question) => question.meta.feedbackAdvance === 'manual-on-wrong'));
            }
        }
    }
});

test('fraction arithmetic uses unlike denominators and correct equivalent answers for every learning goal', () => {
    for (const id of ['fraction_add_subtract_independent', 'fraction_mixed_add_subtract', 'fraction_word_problems']) {
        const unit = getUnitById('fractions', id);
        const stories = new Set();
        for (const variant of unit.practiceVariants) {
            for (let index = 0; index < 150; index += 1) {
                const question = unit.generateQuestion({ variantId: variant.id });
                const m = question.meta;
                assert.notEqual(m.leftDenominator, m.rightDenominator);
                assert.ok(m.leftDenominator >= 2 && m.leftDenominator <= 12);
                assert.ok(m.rightDenominator >= 2 && m.rightDenominator <= 12);
                assert.ok(m.commonDenominator <= 60);
                const numerator = m.leftNumerator * m.rightDenominator
                    + (m.operator === '+' ? 1 : -1) * m.rightNumerator * m.leftDenominator;
                const denominator = m.leftDenominator * m.rightDenominator;
                assert.ok(numerator > 0);
                assert.equal(question.evaluate(`${numerator}/${denominator}`).isCorrect, true);
                assert.equal(question.evaluate(`${numerator * 2}/${denominator * 2}`).isCorrect, true);
                assert.equal(question.evaluate(`${numerator + 1}/${denominator}`).isCorrect, false);
                assert.notEqual(question.evaluate('').validationError, null);
                if (variant.id === 'proper-add' || variant.id === 'proper-subtract') assert.ok(numerator < denominator);
                if (variant.id === 'overflow-add') assert.ok(numerator > denominator);
                if (variant.id === 'integer-add') {
                    assert.equal(numerator % denominator, 0);
                    assert.equal(question.evaluate(String(numerator / denominator)).isCorrect, true);
                }
                if (id === 'fraction_mixed_add_subtract') {
                    assert.ok(m.leftWhole >= 1 && m.leftWhole <= 5);
                    assert.ok(m.rightWhole >= 1 && m.rightWhole <= 5);
                    const leftPart = m.leftNumerator % m.leftDenominator / m.leftDenominator;
                    const rightPart = m.rightNumerator % m.rightDenominator / m.rightDenominator;
                    if (variant.id === 'carry') assert.ok(leftPart + rightPart > 1);
                    if (variant.id === 'borrow') assert.ok(leftPart < rightPart);
                    if (variant.id === 'plain-add') assert.ok(leftPart + rightPart < 1);
                    if (variant.id === 'plain-subtract') assert.ok(leftPart > rightPart);
                }
                stories.add(question.text.replace(/\d+/g, '#'));
            }
        }
        if (id === 'fraction_word_problems') assert.ok(stories.size >= 12);
    }
});

test('scaffolding sessions balance operators and denominator relationships', () => {
    const questions = createQuestionSet('fractions', 'fraction_add_subtract_unlike', 10);
    assert.equal(questions.filter((q) => q.meta.operator === '+').length, 5);
    assert.equal(questions.filter((q) => Math.max(q.meta.leftDenominator, q.meta.rightDenominator)
        % Math.min(q.meta.leftDenominator, q.meta.rightDenominator) === 0).length, 6);
});

test('word problem answers follow the quantities in their scenarios and remain elementary integers', () => {
    for (const id of ['integer_word_problems', 'average_problems']) {
        const unit = getUnitById('arithmetic', id);
        for (const variant of unit.practiceVariants) {
            for (let index = 0; index < 150; index += 1) {
                const question = unit.generateQuestion({ variantId: variant.id });
                const m = question.meta;
                let expected;
                if (id === 'average_problems') {
                    const total = m.values.reduce((sum, value) => sum + value, 0);
                    assert.equal(m.values.length, m.count);
                    assert.ok(m.values.every((value) => value >= 0 && value <= 100));
                    assert.equal(total / m.count, m.average);
                    expected = variant.id === 'average' ? total / m.count
                        : variant.id === 'total' ? m.average * m.count
                            : m.average * m.count - m.values.slice(0, -1).reduce((sum, value) => sum + value, 0);
                } else {
                    expected = {
                        'divide-twice': () => m.total / m.perGroup / m.groupsPerBox,
                        change: () => m.budget - m.quantity * m.price,
                        'group-total': () => (m.price + m.extra) * m.quantity,
                        'purchase-total': () => m.price * m.quantity + m.extra,
                        'three-step': () => m.budget - (m.quantity * m.price + m.fee)
                    }[m.operation]();
                }
                assert.ok(Number.isInteger(expected) && expected > 0 && expected <= 2000);
                assert.equal(question.evaluate(String(expected)).isCorrect, true);
                assert.equal(question.evaluate(String(expected + 1)).isCorrect, false);
            }
        }
    }
});

test('distributive blanks and choices preserve the distributive identity with one correct choice', () => {
    const unit = getUnitById('arithmetic', 'distributive_law');
    for (const variant of unit.practiceVariants) {
        for (let index = 0; index < 150; index += 1) {
            const question = unit.generateQuestion({ variantId: variant.id });
            const { factor, left, right, operator } = question.meta;
            const sign = operator === '+' ? 1 : -1;
            const expected = factor * (left + sign * right);
            if (variant.id === 'choose') {
                const values = {
                    correct: factor * left + sign * factor * right,
                    'missing-factor': factor * left + sign * right,
                    'wrong-sign': factor * left - sign * factor * right,
                    'extra-one': expected + 1
                };
                assert.equal(question.options.filter((option) => values[option.value] === expected).length, 1);
                assert.equal(question.evaluate('correct').isCorrect, true);
                for (const option of question.options.filter((item) => item.value !== 'correct')) {
                    assert.equal(question.evaluate(option.value).isCorrect, false);
                }
            } else {
                const blank = variant.id === 'expand' ? right : left + sign * right;
                assert.equal(question.evaluate({ blank: String(blank) }).isCorrect, true);
                const wrong = question.evaluate({ blank: String(blank + 1) });
                assert.equal(wrong.isCorrect, false);
                assert.equal(wrong.correctAnswerLabel, `□: ${blank}`);
            }
        }
    }
});

test('geometry answers match area formulas and reflection, with distinct in-bounds choices', () => {
    for (const { categoryId, unit } of practiceUnits.filter(({ categoryId }) => ['area', 'symmetry'].includes(categoryId))) {
        for (const variant of unit.practiceVariants) {
            for (let index = 0; index < 150; index += 1) {
                const question = unit.generateQuestion({ variantId: variant.id });
                const m = question.meta;
                const d = m.diagram;
                if (categoryId === 'area') {
                    const area = d.shape === 'triangle' ? d.base * d.height / 2
                        : d.shape === 'trapezoid' ? (d.top + d.base) * d.height / 2 : d.base * d.height;
                    assert.ok(Number.isInteger(area));
                    assert.ok([d.base, d.top, d.height].every((value) => value >= 2 && value <= 20));
                    assert.equal(m.area, area);
                    const answer = d.task === 'identify' ? d.segmentLabels[1] : String(d.unknown ? d[d.unknown] : area);
                    assert.equal(question.evaluate(answer).isCorrect, true);
                    if (d.task === 'identify') {
                        assert.equal(question.options.filter((option) => question.evaluate(option.value).isCorrect).length, 1);
                    } else {
                        assert.equal(question.evaluate(String(Number(answer) + 1)).isCorrect, false);
                    }
                } else {
                    assert.equal(d.candidates.length, 4);
                    assert.equal(new Set([...d.candidates, d.point].map((point) => `${point.x},${point.y}`)).size, 5);
                    const matches = d.candidates.filter((candidate) => d.orientation === 'vertical'
                        ? candidate.x + d.point.x === 2 * d.axis && candidate.y === d.point.y
                        : candidate.y + d.point.y === 2 * d.axis && candidate.x === d.point.x);
                    assert.equal(matches.length, 1);
                    assert.ok(d.candidates.every((point) => point.x >= 0 && point.x <= 10 && point.y >= 0 && point.y <= 10));
                    assert.equal(question.evaluate(matches[0].label).isCorrect, true);
                    for (const candidate of d.candidates.filter((point) => point !== matches[0])) {
                        assert.equal(question.evaluate(candidate.label).isCorrect, false);
                    }
                }
            }
        }
    }
});
