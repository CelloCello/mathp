import { test } from 'vitest';
import assert from 'node:assert/strict';

import { categories, getCategoryById, getUnitById } from './categories.js';

test('all categories expose units and helpers resolve category / unit ids', () => {
    assert.ok(categories.length >= 5);
    assert.ok(categories.every((category) => Array.isArray(category.units) && category.units.length > 0));

    const fractions = getCategoryById('fractions');
    const mixedFractionUnit = getUnitById('fractions', 'mixed_fraction');

    assert.equal(fractions?.name, '分數');
    assert.equal(mixedFractionUnit?.name, '帶分數');
});

test('fraction category unit input modes match the plan requirements', () => {
    const proper = getUnitById('fractions', 'proper_fraction');
    const improper = getUnitById('fractions', 'improper_fraction');
    const mixed = getUnitById('fractions', 'mixed_fraction');
    const addSub = getUnitById('fractions', 'fraction_add_subtract');

    assert.equal(proper.generateQuestion().inputMode, 'choice');
    assert.equal(improper.generateQuestion().inputMode, 'choice');
    assert.equal(mixed.generateQuestion().inputMode, 'fraction');
    assert.equal(addSub.generateQuestion().inputMode, 'fraction');
});

test('approximation questions only use hundreds, thousands, or ten-thousands', () => {
    const unit = getUnitById('approximation', 'rounding');
    const seenPlaces = new Set();
    const seenMethods = new Set();

    for (let index = 0; index < 200; index += 1) {
        const question = unit.generateQuestion();
        seenPlaces.add(question.meta.placeName);
        seenMethods.add(question.meta.methodName);

        assert.match(question.text, /(百位|千位|萬位)/);
        assert.doesNotMatch(question.text, /十位/);
    }

    assert.deepEqual([...seenPlaces].sort(), ['千位', '百位', '萬位'].sort());
    assert.deepEqual(
        [...seenMethods].sort(),
        ['四捨五入法', '無條件進入法', '無條件捨去法'].sort()
    );
});

test('fraction add/subtract never uses identical operands or zero-result subtraction prompts', () => {
    const unit = getUnitById('fractions', 'fraction_add_subtract');
    const seenPatterns = new Set();
    let sawMixedPrompt = false;

    for (let index = 0; index < 300; index += 1) {
        const question = unit.generateQuestion();
        const {
            operandPattern,
            operator,
            leftKind,
            rightKind,
            leftTotalNumerator,
            rightTotalNumerator,
            resultNumerator
        } = question.meta;

        seenPatterns.add(operandPattern);
        sawMixedPrompt = sawMixedPrompt || leftKind === 'mixed' || rightKind === 'mixed';

        assert.notEqual(leftTotalNumerator, rightTotalNumerator);

        if (operator === '-') {
            assert.ok(leftTotalNumerator > rightTotalNumerator);
            assert.ok(resultNumerator > 0);
        }
    }

    assert.equal(sawMixedPrompt, true);
    assert.deepEqual(
        [...seenPatterns].sort(),
        ['fraction-fraction', 'fraction-mixed', 'mixed-fraction', 'mixed-mixed'].sort()
    );
});

test('fraction units expose fractionSpec that matches the expected answer format', () => {
    const mixedUnit = getUnitById('fractions', 'mixed_fraction');
    const addSubUnit = getUnitById('fractions', 'fraction_add_subtract');
    const mixedPromptTypes = new Set();
    const addSubResultKinds = new Set();

    for (let index = 0; index < 300; index += 1) {
        const mixedQuestion = mixedUnit.generateQuestion();
        mixedPromptTypes.add(mixedQuestion.meta.promptType);

        if (mixedQuestion.meta.promptType === 'improper-to-mixed') {
            assert.equal(mixedQuestion.fractionSpec.requiredKind, 'mixed');
            assert.equal(mixedQuestion.fractionSpec.preferredEntryMode, 'mixed');
        }

        if (mixedQuestion.meta.promptType === 'mixed-to-improper') {
            assert.equal(mixedQuestion.fractionSpec.requiredKind, 'improper');
            assert.equal(mixedQuestion.fractionSpec.preferredEntryMode, 'fraction');
        }

        const addSubQuestion = addSubUnit.generateQuestion();
        addSubResultKinds.add(addSubQuestion.meta.resultKind);

        if (addSubQuestion.meta.resultKind === 'mixed') {
            assert.equal(addSubQuestion.fractionSpec.preferredEntryMode, 'mixed');
        }

        if (addSubQuestion.meta.resultKind === 'fraction') {
            assert.equal(addSubQuestion.fractionSpec.preferredEntryMode, 'fraction');
        }

        if (addSubQuestion.meta.resultKind === 'integer') {
            assert.equal(addSubQuestion.fractionSpec.preferredEntryMode, 'integer');
        }
    }

    assert.deepEqual([...mixedPromptTypes].sort(), ['improper-to-mixed', 'mixed-to-improper'].sort());
    assert.deepEqual([...addSubResultKinds].sort(), ['fraction', 'integer', 'mixed'].sort());
});
