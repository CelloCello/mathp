const DECIMAL_INPUT_PATTERN = /^(0|[1-9]\d*)(?:\.(\d+))?$/;

const pow10 = (power) => 10 ** power;

export const createDecimalValue = (units, scale = 0) => {
    if (!Number.isInteger(units) || units < 0) {
        throw new Error('Decimal units must be a non-negative integer.');
    }

    if (!Number.isInteger(scale) || scale < 0) {
        throw new Error('Decimal scale must be a non-negative integer.');
    }

    let nextUnits = units;
    let nextScale = scale;

    while (nextScale > 0 && nextUnits % 10 === 0) {
        nextUnits /= 10;
        nextScale -= 1;
    }

    return {
        units: nextUnits,
        scale: nextScale
    };
};

export const parseDecimalInput = (rawInput) => {
    const input = String(rawInput ?? '').trim();

    if (!input) {
        return { isValid: false, error: '請先輸入答案。' };
    }

    const match = input.match(DECIMAL_INPUT_PATTERN);

    if (!match) {
        return { isValid: false, error: '請輸入小數或整數。' };
    }

    const [, wholePart, fractionalPart = ''] = match;
    const scale = fractionalPart.length;
    const units = Number(`${wholePart}${fractionalPart}`);

    if (!Number.isSafeInteger(units)) {
        return { isValid: false, error: '數字太大，請重新輸入。' };
    }

    const value = createDecimalValue(units, scale);

    return {
        isValid: true,
        value,
        displayLabel: formatDecimalValue(value)
    };
};

export const formatDecimalValue = (value) => {
    const normalized = createDecimalValue(value.units, value.scale);
    const digits = String(normalized.units);

    if (normalized.scale === 0) {
        return digits;
    }

    const padded = digits.padStart(normalized.scale + 1, '0');
    const wholeEnd = padded.length - normalized.scale;

    return `${padded.slice(0, wholeEnd)}.${padded.slice(wholeEnd)}`;
};

export const compareDecimalValues = (left, right) => {
    const scale = Math.max(left.scale, right.scale);
    const leftUnits = left.units * pow10(scale - left.scale);
    const rightUnits = right.units * pow10(scale - right.scale);

    return leftUnits === rightUnits;
};

export const compareDecimalOrder = (left, right) => {
    const scale = Math.max(left.scale, right.scale);
    const leftUnits = left.units * pow10(scale - left.scale);
    const rightUnits = right.units * pow10(scale - right.scale);

    return Math.sign(leftUnits - rightUnits);
};

export const addDecimalValues = (left, right) => {
    const scale = Math.max(left.scale, right.scale);

    return createDecimalValue(
        left.units * pow10(scale - left.scale) + right.units * pow10(scale - right.scale),
        scale
    );
};

export const subtractDecimalValues = (left, right) => {
    const scale = Math.max(left.scale, right.scale);
    const units = left.units * pow10(scale - left.scale) - right.units * pow10(scale - right.scale);

    if (units < 0) {
        throw new Error('Decimal subtraction result must not be negative.');
    }

    return createDecimalValue(units, scale);
};

export const multiplyDecimalByPowerOfTen = (value, exponent) => {
    if (!Number.isInteger(exponent) || exponent < 0) {
        throw new Error('Exponent must be a non-negative integer.');
    }

    if (exponent >= value.scale) {
        return createDecimalValue(value.units * pow10(exponent - value.scale), 0);
    }

    return createDecimalValue(value.units, value.scale - exponent);
};

export const divideDecimalByPowerOfTen = (value, exponent) => {
    if (!Number.isInteger(exponent) || exponent < 0) {
        throw new Error('Exponent must be a non-negative integer.');
    }

    return createDecimalValue(value.units, value.scale + exponent);
};
