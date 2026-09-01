import { test } from 'vitest';
import assert from 'node:assert/strict';

import { shouldAdvanceFeedbackManually } from './playScreenUtils.js';

test('manual feedback advance applies only to wrong answers that opt in', () => {
    const question = { meta: { feedbackAdvance: 'manual-on-wrong' } };

    assert.equal(shouldAdvanceFeedbackManually(question, { isCorrect: false }), true);
    assert.equal(shouldAdvanceFeedbackManually(question, { isCorrect: true }), false);
    assert.equal(shouldAdvanceFeedbackManually({ meta: {} }, { isCorrect: false }), false);
});
