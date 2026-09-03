export const shouldAdvanceFeedbackManually = (question, evaluation) =>
    !evaluation.isCorrect && question.meta?.feedbackAdvance === 'manual-on-wrong';
