import katex from 'katex';

import { expressionToTex } from '../game/expressionUtils.js';

const CORE_NUMBER_PATTERN = /\d+\s+\d+\/\d+|\d+\/\d+|\d+/g;
const MATH_CONTEXT_PATTERN = /[0-9+\-×÷=(){}\[\]＋－（）［］｛｝?？\s]/;
const TOKEN_PATTERN = /\d+\s+\d+\/\d+|\d+\/\d+|\d+|[+\-×÷=(){}\[\]?]/g;
const OPENING_PATTERN = /^[([{]$/;
const CLOSING_PATTERN = /^[)\]}]$/;

const normalizeMathCharacters = (value) => String(value ?? '')
    .replace(/＋/g, '+')
    .replace(/－/g, '-')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/［/g, '[')
    .replace(/］/g, ']')
    .replace(/｛/g, '{')
    .replace(/｝/g, '}')
    .replace(/？/g, '?')
    .replace(/\s+/g, ' ')
    .trim();

const isMathContext = (char) => Boolean(char && MATH_CONTEXT_PATTERN.test(char));

const needsImplicitAdjacency = (previous, current) => (
    (previous.type === 'atom' || previous.type === 'close')
        && current.type === 'open'
);

const needsTightSpacing = (previous, current) => (
    previous.type === 'open'
        || current.type === 'close'
        || needsImplicitAdjacency(previous, current)
);

const tokenToMathPiece = (token) => {
    const mixedMatch = token.match(/^(\d+)\s+(\d+)\/(\d+)$/);

    if (mixedMatch) {
        return {
            type: 'atom',
            tex: `${mixedMatch[1]}\\frac{${mixedMatch[2]}}{${mixedMatch[3]}}`
        };
    }

    const fractionMatch = token.match(/^(\d+)\/(\d+)$/);

    if (fractionMatch) {
        return {
            type: 'atom',
            tex: `\\frac{${fractionMatch[1]}}{${fractionMatch[2]}}`
        };
    }

    if (/^\d+$/.test(token)) {
        return {
            type: 'atom',
            tex: token
        };
    }

    if (token === '×') {
        return { type: 'operator', tex: '\\times' };
    }

    if (token === '÷') {
        return { type: 'operator', tex: '\\div' };
    }

    if (token === '{') {
        return { type: 'open', tex: '\\{' };
    }

    if (token === '}') {
        return { type: 'close', tex: '\\}' };
    }

    if (OPENING_PATTERN.test(token)) {
        return { type: 'open', tex: token };
    }

    if (CLOSING_PATTERN.test(token)) {
        return { type: 'close', tex: token };
    }

    return {
        type: 'operator',
        tex: token
    };
};

const expandMathRange = (source, start, end) => {
    let nextStart = start;
    let nextEnd = end;

    while (nextStart > 0 && isMathContext(source[nextStart - 1])) {
        nextStart -= 1;
    }

    while (nextEnd < source.length && isMathContext(source[nextEnd])) {
        nextEnd += 1;
    }

    return {
        start: nextStart,
        end: nextEnd
    };
};

const collectMathRanges = (source) => {
    const matches = Array.from(source.matchAll(CORE_NUMBER_PATTERN));

    if (matches.length === 0) {
        return [];
    }

    const ranges = [];

    matches.forEach((match) => {
        const [matchedText] = match;
        const expanded = expandMathRange(source, match.index ?? 0, (match.index ?? 0) + matchedText.length);

        if (!/\d/.test(source.slice(expanded.start, expanded.end))) {
            return;
        }

        const previous = ranges[ranges.length - 1];

        if (previous && expanded.start <= previous.end) {
            previous.end = Math.max(previous.end, expanded.end);
            return;
        }

        ranges.push(expanded);
    });

    return ranges;
};

export const convertMathSegmentToTex = (value) => {
    const normalized = normalizeMathCharacters(value);
    const tokens = normalized.match(TOKEN_PATTERN);

    if (!tokens || tokens.length === 0) {
        return null;
    }

    const pieces = tokens.map(tokenToMathPiece);
    let result = '';

    pieces.forEach((piece, index) => {
        const previous = pieces[index - 1];

        if (index > 0 && !needsTightSpacing(previous, piece)) {
            result += ' ';
        }

        result += piece.tex;
    });

    return result || null;
};

export const tokenizeMathContent = (text) => {
    const source = String(text ?? '');
    const ranges = collectMathRanges(source);

    if (ranges.length === 0) {
        return source ? [{ type: 'text', value: source }] : [];
    }

    const tokens = [];
    let cursor = 0;

    ranges.forEach((range) => {
        if (range.start > cursor) {
            tokens.push({
                type: 'text',
                value: source.slice(cursor, range.start)
            });
        }

        const raw = source.slice(range.start, range.end);
        const leadingWhitespace = raw.match(/^\s+/)?.[0] ?? '';
        const trailingWhitespace = raw.match(/\s+$/)?.[0] ?? '';
        const trimmedRaw = raw.trim();

        if (leadingWhitespace) {
            tokens.push({
                type: 'text',
                value: leadingWhitespace
            });
        }

        const tex = convertMathSegmentToTex(trimmedRaw);

        if (tex) {
            tokens.push({
                type: 'math',
                raw: trimmedRaw,
                tex
            });
        } else {
            tokens.push({
                type: 'text',
                value: trimmedRaw
            });
        }

        if (trailingWhitespace) {
            tokens.push({
                type: 'text',
                value: trailingWhitespace
            });
        }

        cursor = range.end;
    });

    if (cursor < source.length) {
        tokens.push({
            type: 'text',
            value: source.slice(cursor)
        });
    }

    return tokens
        .filter((token) => token.type !== 'text' || token.value)
        .reduce((accumulator, token) => {
            const previous = accumulator[accumulator.length - 1];

            if (token.type === 'text' && previous?.type === 'text') {
                previous.value += token.value;
                return accumulator;
            }

            accumulator.push(token);
            return accumulator;
        }, []);
};

export const renderTexToMarkup = (tex) => {
    if (!tex) {
        return null;
    }

    return katex.renderToString(tex, {
        displayMode: false,
        output: 'html',
        throwOnError: false,
        strict: 'ignore',
        trust: false
    });
};

export const createExpressionPromptTex = (mathModel, text) => {
    if (!mathModel) {
        return null;
    }

    const expressionTex = expressionToTex(mathModel);

    if (String(text ?? '').includes('?')) {
        return `${expressionTex} = ?`;
    }

    return expressionTex;
};
