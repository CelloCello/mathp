const assertInteger = (value, label) => {
    if (!Number.isInteger(value)) {
        throw new Error(`${label} must be an integer.`);
    }
};

const assertPositiveInteger = (value, label) => {
    assertInteger(value, label);

    if (value <= 0) {
        throw new Error(`${label} must be greater than 0.`);
    }
};

export const gcd = (left, right) => {
    assertInteger(left, 'left');
    assertInteger(right, 'right');

    let a = Math.abs(left);
    let b = Math.abs(right);

    if (a === 0 && b === 0) {
        throw new Error('gcd requires at least one non-zero integer.');
    }

    while (b !== 0) {
        [a, b] = [b, a % b];
    }

    return a;
};

export const lcm = (left, right) => {
    assertInteger(left, 'left');
    assertInteger(right, 'right');

    if (left === 0 || right === 0) {
        return 0;
    }

    return Math.abs(left * right) / gcd(left, right);
};

export const getFactors = (value) => {
    assertPositiveInteger(value, 'value');

    const lowerFactors = [];
    const upperFactors = [];

    for (let factor = 1; factor * factor <= value; factor += 1) {
        if (value % factor !== 0) {
            continue;
        }

        lowerFactors.push(factor);

        const pairedFactor = value / factor;
        if (pairedFactor !== factor) {
            upperFactors.push(pairedFactor);
        }
    }

    return [...lowerFactors, ...upperFactors.reverse()];
};

export const getMultiples = (value, count) => {
    assertPositiveInteger(value, 'value');
    assertInteger(count, 'count');

    if (count < 0) {
        throw new Error('count must not be negative.');
    }

    return Array.from({ length: count }, (_, index) => value * (index + 1));
};
