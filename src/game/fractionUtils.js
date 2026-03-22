export const gcd = (left, right) => {
    let a = Math.abs(left);
    let b = Math.abs(right);

    while (b !== 0) {
        [a, b] = [b, a % b];
    }

    return a || 1;
};

export const createFractionValue = (numerator, denominator = 1) => {
    if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) {
        throw new Error('Fraction value must use a non-zero integer denominator.');
    }

    if (numerator === 0) {
        return { numerator: 0, denominator: 1 };
    }

    const sign = denominator < 0 ? -1 : 1;
    const safeNumerator = numerator * sign;
    const safeDenominator = Math.abs(denominator);
    const divisor = gcd(safeNumerator, safeDenominator);

    return {
        numerator: safeNumerator / divisor,
        denominator: safeDenominator / divisor
    };
};

export const compareFractionValues = (left, right) =>
    left.numerator * right.denominator === right.numerator * left.denominator;

export const toMixedNumber = (value) => {
    const normalized = createFractionValue(value.numerator, value.denominator);
    const whole = Math.trunc(normalized.numerator / normalized.denominator);
    const remainder = Math.abs(normalized.numerator % normalized.denominator);

    return {
        whole,
        numerator: remainder,
        denominator: normalized.denominator
    };
};

export const formatFractionValue = (value, { style = 'auto' } = {}) => {
    const normalized = createFractionValue(value.numerator, value.denominator);

    if (style === 'mixed') {
        const mixed = toMixedNumber(normalized);

        if (mixed.numerator === 0) {
            return `${mixed.whole}`;
        }

        if (mixed.whole === 0) {
            return `${mixed.numerator}/${mixed.denominator}`;
        }

        return `${mixed.whole} ${mixed.numerator}/${mixed.denominator}`;
    }

    if (normalized.denominator === 1) {
        return `${normalized.numerator}`;
    }

    return `${normalized.numerator}/${normalized.denominator}`;
};

const normalizeInputWhitespace = (rawInput) => String(rawInput ?? '').trim().replace(/\s+/g, ' ');

export const parseFractionInput = (rawInput) => {
    const normalized = normalizeInputWhitespace(rawInput);

    if (!normalized) {
        return { isValid: false, error: '請先輸入答案。' };
    }

    const mixedMatch = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
        const whole = Number(mixedMatch[1]);
        const numerator = Number(mixedMatch[2]);
        const denominator = Number(mixedMatch[3]);

        if (denominator === 0) {
            return { isValid: false, error: '分母不能是 0。' };
        }

        if (numerator === 0 || numerator >= denominator) {
            return { isValid: false, error: '帶分數的小分數部分要是真分數。' };
        }

        return {
            isValid: true,
            kind: 'mixed',
            value: createFractionValue(whole * denominator + numerator, denominator),
            displayLabel: `${whole} ${numerator}/${denominator}`
        };
    }

    const fractionMatch = normalized.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
        const numerator = Number(fractionMatch[1]);
        const denominator = Number(fractionMatch[2]);

        if (denominator === 0) {
            return { isValid: false, error: '分母不能是 0。' };
        }

        return {
            isValid: true,
            kind: 'fraction',
            value: createFractionValue(numerator, denominator),
            displayLabel: `${numerator}/${denominator}`
        };
    }

    const integerMatch = normalized.match(/^(\d+)$/);
    if (integerMatch) {
        const value = Number(integerMatch[1]);

        return {
            isValid: true,
            kind: 'integer',
            value: createFractionValue(value, 1),
            displayLabel: `${value}`
        };
    }

    return {
        isValid: false,
        error: '請用整數、a/b 或 w a/b 的格式作答。'
    };
};
