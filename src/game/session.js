import { getCategoryById, getUnitById } from './categories.js';

export const createQuestionSet = (categoryId, unitId, totalQuestions) => {
    const unit = getUnitById(categoryId, unitId);

    if (!unit) {
        throw new Error(`Unknown unit selection: ${categoryId}/${unitId}`);
    }

    return Array.from({ length: totalQuestions }, () => unit.generateQuestion());
};

export const getSelectionLabels = (categoryId, unitId) => {
    const category = getCategoryById(categoryId);
    const unit = getUnitById(categoryId, unitId);

    if (!category || !unit) {
        throw new Error(`Unknown selection: ${categoryId}/${unitId}`);
    }

    return {
        categoryName: category.name,
        unitName: unit.name
    };
};
