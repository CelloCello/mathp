import {
    createFractionSpec,
    REQUIRED_KIND_LABELS
} from './fractionForm.js';
import { compareFractionValues, parseFractionInput } from './fractionUtils.js';

const INTEGER_PATTERN = /^-?\d+$/;

const formatNumberLabel = (value) => Number(value).toLocaleString();

const REQUIRED_KIND_MATCHERS = {
    any: () => true,
    mixed: (parsed) => parsed.kind === 'mixed',
    integer: (parsed) => parsed.kind === 'integer',
    fraction: (parsed) => parsed.kind === 'fraction',
    proper: (parsed) => parsed.kind === 'fraction' && parsed.value.numerator < parsed.value.denominator,
    improper: (parsed) => parsed.kind === 'fraction' && parsed.value.numerator >= parsed.value.denominator
};

const matchesRequiredKind = (parsed, requiredKind) =>
    (REQUIRED_KIND_MATCHERS[requiredKind] ?? (() => false))(parsed);

export const createNumberQuestion = ({ text, answer, placeholder = '輸入答案', meta = {} }) => ({
    text,
    inputMode: 'number',
    placeholder,
    meta,
    evaluate: (rawInput) => {
        const value = String(rawInput ?? '').trim();

        if (!value) {
            return { isCorrect: false, validationError: '請先輸入答案。' };
        }

        if (!INTEGER_PATTERN.test(value)) {
            return { isCorrect: false, validationError: '請輸入整數。' };
        }

        const parsedValue = Number(value);

        return {
            isCorrect: parsedValue === answer,
            userAnswerLabel: formatNumberLabel(parsedValue),
            correctAnswerLabel: formatNumberLabel(answer),
            validationError: null
        };
    }
});

export const createChoiceQuestion = ({ text, options, correctValue, meta = {} }) => ({
    text,
    inputMode: 'choice',
    options,
    correctValue,
    meta,
    evaluate: (rawInput) => {
        const selectedOption = options.find((option) => option.value === rawInput);
        const correctOption = options.find((option) => option.value === correctValue);

        if (!selectedOption || !correctOption) {
            return { isCorrect: false, validationError: '請先選擇一個答案。' };
        }

        return {
            isCorrect: rawInput === correctValue,
            userAnswerLabel: selectedOption.label,
            correctAnswerLabel: correctOption.label,
            validationError: null
        };
    }
});

export const createFractionQuestion = ({
    text,
    answerValue,
    standardAnswerLabel,
    requiredKind = 'any',
    placeholder = '例如 3/4',
    meta = {}
}) => ({
    text,
    inputMode: 'fraction',
    placeholder,
    meta: {
        renderKind: 'fraction-rich',
        ...meta
    },
    fractionSpec: createFractionSpec(requiredKind),
    evaluate: (rawInput) => {
        const parsed = parseFractionInput(rawInput);

        if (!parsed.isValid) {
            return { isCorrect: false, validationError: parsed.error };
        }

        const formatMatches = matchesRequiredKind(parsed, requiredKind);

        return {
            isCorrect: formatMatches && compareFractionValues(parsed.value, answerValue),
            userAnswerLabel: parsed.displayLabel,
            correctAnswerLabel: standardAnswerLabel,
            validationError: null,
            note: formatMatches ? null : REQUIRED_KIND_LABELS[requiredKind]
        };
    }
});
