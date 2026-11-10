export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const pickRandom = (items) => items[randomInt(0, items.length - 1)];

export const shuffle = (items) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const other = randomInt(0, index);
        [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
};

// A unit's variants describe learning goals as well as session quotas.
export const createPracticeUnit = ({ id, name, description, variants }) => ({
    id,
    name,
    description,
    practiceVariants: variants.map(({ id: variantId, weight, level = 1 }) => ({ id: variantId, weight, level })),
    generateQuestion: ({ variantId } = {}) => {
        let variant = variants.find((item) => item.id === variantId);
        if (variantId && !variant) {
            throw new Error(`Unknown practice variant: ${id}/${variantId}`);
        }
        if (!variant) {
            let roll = Math.random() * variants.reduce((sum, item) => sum + item.weight, 0);
            variant = variants.find((item) => (roll -= item.weight) < 0) ?? variants.at(-1);
        }
        const question = variant.generate();
        return {
            ...question,
            meta: {
                ...question.meta,
                practiceType: variant.id,
                practiceLevel: question.meta?.practiceLevel ?? variant.level ?? 1,
                feedbackAdvance: 'manual-on-wrong'
            }
        };
    }
});

export const allocatePracticeVariants = (variants, totalQuestions) => {
    const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
    const allocations = shuffle(variants).map((variant) => {
        const exact = totalQuestions * variant.weight / totalWeight;
        return { ...variant, count: Math.floor(exact), remainder: exact % 1 };
    });
    const remaining = totalQuestions - allocations.reduce((sum, item) => sum + item.count, 0);
    allocations.sort((left, right) => right.remainder - left.remainder);
    for (let index = 0; index < remaining; index += 1) {
        allocations[index].count += 1;
    }
    return shuffle(allocations.flatMap((variant) => Array(variant.count).fill(variant)))
        .sort((left, right) => left.level - right.level);
};
