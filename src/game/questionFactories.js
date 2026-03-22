import {
    createFractionSpec,
    REQUIRED_KIND_LABELS
} from './fractionForm.js';
import { compareFractionValues, parseFractionInput } from './fractionUtils.js';

const INTEGER_PATTERN = /^-?\d+$/;

const formatNumberLabel = (value) => Number(value).toLocaleString();

const matchesRequiredKind = (parsed, requiredKind) => {
    if (requiredKind === 'any') {
        return true;
    }

    if (requiredKind === 'mixed') {
        return parsed.kind === 'mixed';
    }

    if (requiredKind === 'integer') {
        return parsed.kind === 'integer';
    }

    if (requiredKind === 'fraction') {
        return parsed.kind === 'fraction';
    }

    if (requiredKind === 'proper') {
        return parsed.kind === 'fraction' && parsed.value.numerator < parsed.value.denominator;
    }

    if (requiredKind === 'improper') {
        return parsed.kind === 'fraction' && parsed.value.numerator >= parsed.value.denominator;
    }

    return false;
};

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
    meta,
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
