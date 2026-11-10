import { getCategoryById, getUnitById } from './categories.js';
import { allocatePracticeVariants } from './practiceUtils.js';

const resolveSelection = (categoryId, unitId, errorMessage) => {
    const category = getCategoryById(categoryId);
    const unit = getUnitById(categoryId, unitId);

    if (!unit) {
        throw new Error(errorMessage);
    }

    return { category, unit };
};

export const createQuestionSet = (categoryId, unitId, totalQuestions) => {
    const { unit } = resolveSelection(
        categoryId,
        unitId,
        `Unknown unit selection: ${categoryId}/${unitId}`
    );

    if (!unit.practiceVariants) {
        return Array.from({ length: totalQuestions }, () => unit.generateQuestion());
    }

    const seen = new Set();
    return allocatePracticeVariants(unit.practiceVariants, totalQuestions).map((variant) => {
        for (let attempt = 0; attempt < 200; attempt += 1) {
            const question = unit.generateQuestion({ variantId: variant.id });
            const key = question.meta.practiceKey ?? question.text;
            if (!seen.has(key)) {
                seen.add(key);
                return question;
            }
        }
        throw new Error(`Unable to generate distinct questions for ${categoryId}/${unitId}.`);
    }).sort((left, right) => left.meta.practiceLevel - right.meta.practiceLevel);
};

export const getSelectionLabels = (categoryId, unitId) => {
    const { category, unit } = resolveSelection(
        categoryId,
        unitId,
        `Unknown selection: ${categoryId}/${unitId}`
    );

    if (!category) {
        throw new Error(`Unknown selection: ${categoryId}/${unitId}`);
    }

    return {
        categoryName: category.name,
        unitName: unit.name
    };
};
