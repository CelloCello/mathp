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
                {fields.map((field, index) => (
                    <label key={field.id} className="field-answer-field">
                        <span className="field-answer-label">{field.label}</span>
                        <input
                            ref={index === 0 ? firstInputRef : null}
                            type="text"
                            inputMode={field.inputMode === 'decimal' ? 'decimal' : 'numeric'}
                            value={values[field.id] ?? ''}
                            onChange={(event) => updateValue(field.id, event.target.value)}
                            disabled={!!feedback}
                            className={`field-answer-input${feedback ? (feedback.isCorrect ? ' is-correct' : ' is-wrong') : ''}`}
                        />
                    </label>
                ))}
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
