import React, { useEffect, useRef, useState } from 'react';

import MathContent from './MathContent.jsx';

const createFormulaPreviewText = (formulaPreview, values) => {
    if (!formulaPreview?.parts?.length) {
        return null;
    }

    return formulaPreview.parts
        .map((part) => `${part.multiplierLabel} × ${String(values[part.fieldId] ?? '').trim() || '?'}`)
        .join(' + ');
};

const feedbackClassName = (feedback) =>
    `field-answer-input${feedback ? (feedback.isCorrect ? ' is-correct' : ' is-wrong') : ''}`;

const choiceButtonClassName = (feedback, isSelected) =>
    `field-segmented-choice-option${isSelected ? ' is-selected' : ''}${feedback && isSelected ? (feedback.isCorrect ? ' is-correct' : ' is-wrong') : ''}`;

const isNumeratorField = (field) => field.id.toLowerCase().includes('numerator');

const isDenominatorField = (field) => field.id.toLowerCase().includes('denominator');

const isLegacyFractionPair = (numeratorField, denominatorField) =>
    numeratorField.id === 'numerator' && denominatorField.id === 'denominator';

const isTaggedFractionPair = (numeratorField, denominatorField) =>
    Boolean(
        numeratorField.fractionPairId
        && denominatorField.fractionPairId === numeratorField.fractionPairId
        && isNumeratorField(numeratorField)
        && isDenominatorField(denominatorField)
    );

const isFractionPairStart = (field, nextField) => {
    if (!nextField) {
        return false;
    }

    return isLegacyFractionPair(field, nextField) || isTaggedFractionPair(field, nextField);
};

const isFractionPairEnd = (field, previousField) => {
    if (!previousField) {
        return false;
    }

    return isFractionPairStart(previousField, field);
};

function FieldAnswerForm({ fields, fieldLayout, formulaPreview, feedback, validationError, onValidationError, onSubmit }) {
    const [values, setValues] = useState({});
    const firstInputRef = useRef(null);
    const formulaPreviewText = createFormulaPreviewText(formulaPreview, values);

    useEffect(() => {
        if (!feedback) {
            firstInputRef.current?.focus();
        }
    }, [feedback]);

    const updateValue = (fieldId, value) => {
        setValues((previous) => ({
            ...previous,
            [fieldId]: value
        }));
        onValidationError('');
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!feedback) {
            onSubmit(values);
        }
    };

    const renderSegmentedChoice = (field) => (
        <div className="field-segmented-choice" role="group" aria-label={field.label}>
            {field.options.map((option) => {
                const value = typeof option === 'string' ? option : option.value;
                const label = typeof option === 'string' ? option : option.label;
                const isSelected = values[field.id] === value;

                return (
                    <button
                        key={value}
                        type="button"
                        disabled={!!feedback}
                        className={choiceButtonClassName(feedback, isSelected)}
                        aria-pressed={isSelected}
                        onClick={() => updateValue(field.id, value)}
                    >
                        <MathContent text={label} />
                    </button>
                );
            })}
        </div>
    );

    const renderFractionInput = ({ numeratorField, denominatorField, denominatorText }) => (
        <div className="field-answer-fraction-pair field-comparison-fraction" role="group" aria-label="通分後分數">
            <label className="field-answer-field field-answer-fraction-field">
                <span className="field-answer-label">{numeratorField.label}</span>
                <input
                    ref={numeratorField.id === 'leftNumerator' ? firstInputRef : null}
                    type="text"
                    inputMode="numeric"
                    value={values[numeratorField.id] ?? ''}
                    onChange={(event) => updateValue(numeratorField.id, event.target.value)}
                    disabled={!!feedback}
                    className={feedbackClassName(feedback)}
                />
            </label>
            <div className="field-answer-fraction-divider" />
            {denominatorField ? (
                <label className="field-answer-field field-answer-fraction-field">
                    <span className="field-answer-label">{denominatorField.label}</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={values[denominatorField.id] ?? ''}
                        onChange={(event) => updateValue(denominatorField.id, event.target.value)}
                        disabled={!!feedback}
                        className={feedbackClassName(feedback)}
                    />
                </label>
            ) : (
                <div className="field-comparison-denominator-preview">
                    {denominatorText || '?'}
                </div>
            )}
        </div>
    );

    const renderComparisonLayout = () => {
        const leftNumeratorField = fields.find((field) => field.id === 'leftNumerator');
        const denominatorField = fields.find((field) => field.id === 'commonDenominator');
        const rightNumeratorField = fields.find((field) => field.id === 'rightNumerator');
        const symbolField = fields.find((field) => field.id === 'comparisonSymbol');
        const denominatorText = String(values.commonDenominator ?? '').trim();

        return (
            <div className="field-comparison-layout">
                <MathContent text={fieldLayout.leftLabel} className="field-comparison-original" />
                <span className="field-comparison-equals">=</span>
                {renderFractionInput({
                    numeratorField: leftNumeratorField,
                    denominatorField
                })}
                <div className="field-comparison-symbol">
                    <span className="field-answer-label">{symbolField.label}</span>
                    {renderSegmentedChoice(symbolField)}
                </div>
                {renderFractionInput({
                    numeratorField: rightNumeratorField,
                    denominatorText
                })}
                <span className="field-comparison-equals">=</span>
                <MathContent text={fieldLayout.rightLabel} className="field-comparison-original" />
            </div>
        );
    };

    return (
        <form className="field-answer-form" onSubmit={handleSubmit}>
            {fieldLayout?.kind === 'fraction-comparison' ? (
                renderComparisonLayout()
            ) : (
                <div className="field-answer-grid">
                {fields.map((field, index) => {
                    const nextField = fields[index + 1];
                    const previousField = fields[index - 1];

                    if (field.inputKind === 'segmented-choice') {
                        return (
                            <div key={field.id} className="field-answer-field">
                                <span className="field-answer-label">{field.label}</span>
                                {renderSegmentedChoice(field)}
                            </div>
                        );
                    }

                    if (isFractionPairEnd(field, previousField)) {
                        return null;
                    }

                    if (isFractionPairStart(field, nextField)) {
                        return (
                            <div key={`fraction-answer-${field.fractionPairId ?? field.id}`} className="field-answer-fraction-pair" role="group" aria-label="分數">
                                <label className="field-answer-field field-answer-fraction-field">
                                    <span className="field-answer-label">{field.label}</span>
                                    <input
                                        ref={index === 0 ? firstInputRef : null}
                                        type="text"
                                        inputMode={field.inputMode === 'decimal' ? 'decimal' : 'numeric'}
                                        value={values[field.id] ?? ''}
                                        onChange={(event) => updateValue(field.id, event.target.value)}
                                        disabled={!!feedback}
                                        className={feedbackClassName(feedback)}
                                    />
                                </label>
                                <div className="field-answer-fraction-divider" />
                                <label className="field-answer-field field-answer-fraction-field">
                                    <span className="field-answer-label">{nextField.label}</span>
                                    <input
                                        type="text"
                                        inputMode={nextField.inputMode === 'decimal' ? 'decimal' : 'numeric'}
                                        value={values[nextField.id] ?? ''}
                                        onChange={(event) => updateValue(nextField.id, event.target.value)}
                                        disabled={!!feedback}
                                        className={feedbackClassName(feedback)}
                                    />
                                </label>
                            </div>
                        );
                    }

                    return (
                        <label key={field.id} className="field-answer-field">
                            <span className="field-answer-label">{field.label}</span>
                            <input
                                ref={index === 0 ? firstInputRef : null}
                                type="text"
                                inputMode={field.inputMode === 'decimal' ? 'decimal' : 'numeric'}
                                value={values[field.id] ?? ''}
                                onChange={(event) => updateValue(field.id, event.target.value)}
                                disabled={!!feedback}
                                className={feedbackClassName(feedback)}
                            />
                        </label>
                    );
                })}
                </div>
            )}

            {formulaPreviewText && (
                <div className="field-formula-preview" aria-live="polite">
                    <span className="field-formula-label">算式提示</span>
                    <MathContent text={formulaPreviewText} className="field-formula-text" />
                </div>
            )}

            <div className="field-answer-actions">
                <button
                    type="submit"
                    className="btn"
                    disabled={!!feedback}
                    style={{ padding: '20px 30px', fontSize: '2rem', opacity: feedback ? 0.6 : 1 }}
                >
                    送出
                </button>
            </div>

            {validationError && (
                <p className="inline-error">{validationError}</p>
            )}
        </form>
    );
}

export default FieldAnswerForm;
