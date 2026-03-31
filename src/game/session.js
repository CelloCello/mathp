import { getCategoryById, getUnitById } from './categories.js';

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

    return Array.from({ length: totalQuestions }, () => unit.generateQuestion());
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
