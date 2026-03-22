const DIGIT_PATTERN = /^\d+$/;

export const REQUIRED_KIND_LABELS = {
    mixed: '這題要用帶分數作答。',
    improper: '這題要用假分數作答。',
    proper: '這題要用真分數作答。',
    fraction: '這題要用分數作答。',
    integer: '這題要用整數作答。',
    any: '這題可以用整數、分數或帶分數作答。'
};

export const FRACTION_ENTRY_MODE_LABELS = {
    integer: '整數',
    fraction: '分數',
    mixed: '帶分數'
};

const ENTRY_MODE_BY_REQUIRED_KIND = {
    mixed: 'mixed',
    improper: 'fraction',
    proper: 'fraction',
    fraction: 'fraction',
    integer: 'integer',
    any: 'fraction'
};

const EXAMPLE_BY_REQUIRED_KIND = {
    mixed: '1 1/2',
    improper: '7/4',
    proper: '3/4',
    fraction: '3/4',
    integer: '2',
    any: '3/4'
};

const normalizeField = (value) => String(value ?? '').trim();

const isMissing = (value) => normalizeField(value) === '';

const isInvalidIntegerField = (value) => !DIGIT_PATTERN.test(normalizeField(value));

export const getPreferredFractionEntryMode = (requiredKind = 'any') =>
    ENTRY_MODE_BY_REQUIRED_KIND[requiredKind] ?? ENTRY_MODE_BY_REQUIRED_KIND.any;

export const createFractionSpec = (requiredKind = 'any', { allowDirectText = true } = {}) => {
    const preferredEntryMode = getPreferredFractionEntryMode(requiredKind);
    const example = EXAMPLE_BY_REQUIRED_KIND[requiredKind] ?? EXAMPLE_BY_REQUIRED_KIND.any;

    return {
        requiredKind,
        preferredEntryMode,
        allowedEntryModes: requiredKind === 'any' ? ['fraction', 'mixed', 'integer'] : [preferredEntryMode],
        example,
        allowDirectText,
        formatHint: REQUIRED_KIND_LABELS[requiredKind] ?? REQUIRED_KIND_LABELS.any,
        directTextPlaceholder: `例如 ${example}`
    };
};

export const validateStructuredFractionAnswer = ({ entryMode, fields }) => {
    const whole = normalizeField(fields?.whole);
    const numerator = normalizeField(fields?.numerator);
    const denominator = normalizeField(fields?.denominator);

    if (entryMode === 'integer') {
        if (isMissing(whole)) {
            return '請輸入整數答案。';
        }

        if (isInvalidIntegerField(whole)) {
            return '請只輸入整數數字。';
        }

        return null;
    }

    if (entryMode === 'fraction') {
        if (isMissing(numerator) || isMissing(denominator)) {
            return '請完整輸入分子和分母。';
        }

        if (isInvalidIntegerField(numerator) || isInvalidIntegerField(denominator)) {
            return '請只輸入整數數字。';
        }

        if (Number(denominator) === 0) {
            return '分母不能是 0。';
        }

        return null;
    }

    if (entryMode === 'mixed') {
        if (isMissing(whole) || isMissing(numerator) || isMissing(denominator)) {
            return '請完整輸入整數、分子和分母。';
        }

        if (
            isInvalidIntegerField(whole)
            || isInvalidIntegerField(numerator)
            || isInvalidIntegerField(denominator)
        ) {
            return '請只輸入整數數字。';
        }

        if (Number(denominator) === 0) {
            return '分母不能是 0。';
        }

        if (Number(numerator) === 0 || Number(numerator) >= Number(denominator)) {
            return '帶分數的小分數部分要是真分數。';
        }

        return null;
    }

    return '無法識別分數輸入模式。';
};

export const serializeStructuredFractionAnswer = ({ entryMode, fields }) => {
    const validationError = validateStructuredFractionAnswer({ entryMode, fields });

    if (validationError) {
        throw new Error(validationError);
    }

    const whole = normalizeField(fields?.whole);
    const numerator = normalizeField(fields?.numerator);
    const denominator = normalizeField(fields?.denominator);

    if (entryMode === 'integer') {
        return whole;
    }

    if (entryMode === 'fraction') {
        return `${numerator}/${denominator}`;
    }

    return `${whole} ${numerator}/${denominator}`;
};
