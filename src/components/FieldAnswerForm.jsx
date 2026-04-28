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

function FieldAnswerForm({ fields, formulaPreview, feedback, validationError, onValidationError, onSubmit }) {
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

    return (
        <form className="field-answer-form" onSubmit={handleSubmit}>
            <div className="field-answer-grid">
                {fields.map((field, index) => {
                    const nextField = fields[index + 1];

                    if (field.id === 'denominator' && fields[index - 1]?.id === 'numerator') {
                        return null;
                    }

                    if (field.id === 'numerator' && nextField?.id === 'denominator') {
                        return (
                            <div key="fraction-answer" className="field-answer-fraction-pair" role="group" aria-label="分數">
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
