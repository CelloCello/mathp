const STANDALONE_INTEGER_PATTERN = /^\d+$/;
const FRACTION_SEGMENT_PATTERN = /\d+\s+\d+\/\d+|\d+\/\d+/g;

const parseMatchedToken = (value) => {
    const mixedMatch = value.match(/^(\d+)\s+(\d+)\/(\d+)$/);

    if (mixedMatch) {
        return {
            type: 'mixed',
            raw: value,
            whole: mixedMatch[1],
            numerator: mixedMatch[2],
            denominator: mixedMatch[3]
        };
    }

    const fractionMatch = value.match(/^(\d+)\/(\d+)$/);

    if (fractionMatch) {
        return {
            type: 'fraction',
            raw: value,
            numerator: fractionMatch[1],
            denominator: fractionMatch[2]
        };
    }

    return { type: 'text', value };
};

export const tokenizeFractionText = (text) => {
    const source = String(text ?? '');
    const matches = Array.from(source.matchAll(FRACTION_SEGMENT_PATTERN));

    if (matches.length === 0) {
        const trimmed = source.trim();

        if (trimmed && trimmed === source && STANDALONE_INTEGER_PATTERN.test(trimmed)) {
            return [{ type: 'integer', value: trimmed }];
        }

        return source ? [{ type: 'text', value: source }] : [];
    }

    const tokens = [];
    let cursor = 0;

    matches.forEach((match) => {
        const [matchedText] = match;
        const start = match.index ?? 0;

        if (start > cursor) {
            tokens.push({
                type: 'text',
                value: source.slice(cursor, start)
            });
        }

        tokens.push(parseMatchedToken(matchedText));
        cursor = start + matchedText.length;
    });

    if (cursor < source.length) {
        tokens.push({
            type: 'text',
            value: source.slice(cursor)
        });
    }

    return tokens;
};
