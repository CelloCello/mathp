import React, { useEffect, useRef, useState } from 'react';
import {
    FRACTION_ENTRY_MODE_LABELS,
    serializeStructuredFractionAnswer,
    validateStructuredFractionAnswer
} from '../game/fractionForm.js';
import FractionText from './FractionText.jsx';

const createEmptyFields = () => ({
    whole: '',
    numerator: '',
    denominator: ''
});

const NumericField = ({ label, value, onChange, inputRef, disabled }) => (
    <label className="fraction-field">
        <span className="fraction-field-label">{label}</span>
        <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="fraction-field-input"
        />
    </label>
);

function FractionAnswerForm({ fractionSpec, feedback, validationError, onValidationError, onSubmit }) {
    const [entryMethod, setEntryMethod] = useState('structured');
    const [entryMode, setEntryMode] = useState(fractionSpec.preferredEntryMode);
    const [fields, setFields] = useState(createEmptyFields);
    const [directText, setDirectText] = useState('');

    const primaryInputRef = useRef(null);

    useEffect(() => {
        if (!feedback) {
            primaryInputRef.current?.focus();
        }
    }, [feedback, entryMethod, entryMode]);

    const updateField = (key, value) => {
        setFields((previous) => ({
            ...previous,
            [key]: value
        }));
        onValidationError('');
    };

    const handleStructuredSubmit = (event) => {
        event.preventDefault();

        if (feedback) {
            return;
        }

        if (entryMethod === 'direct') {
            onSubmit(directText);
            return;
        }

        const nextError = validateStructuredFractionAnswer({ entryMode, fields });

        if (nextError) {
            onValidationError(nextError);
            return;
        }

        onSubmit(serializeStructuredFractionAnswer({ entryMode, fields }));
    };

    const renderStructuredFields = () => {
        if (entryMode === 'integer') {
            return (
                <div className="fraction-structured-layout fraction-structured-layout-single">
                    <NumericField
                        label="整數"
                        value={fields.whole}
                        onChange={(event) => updateField('whole', event.target.value)}
                        inputRef={primaryInputRef}
                        disabled={!!feedback}
                    />
                </div>
            );
        }

        if (entryMode === 'fraction') {
            return (
                <div className="fraction-structured-layout fraction-structured-layout-fraction">
                    <div className="fraction-composite">
                        <NumericField
                            label="分子"
                            value={fields.numerator}
                            onChange={(event) => updateField('numerator', event.target.value)}
                            inputRef={primaryInputRef}
                            disabled={!!feedback}
                        />
                        <div className="fraction-entry-divider" />
                        <NumericField
                            label="分母"
                            value={fields.denominator}
                            onChange={(event) => updateField('denominator', event.target.value)}
                            disabled={!!feedback}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className="fraction-structured-layout fraction-structured-layout-mixed">
                <NumericField
                    label="整數"
                    value={fields.whole}
                    onChange={(event) => updateField('whole', event.target.value)}
                    inputRef={primaryInputRef}
                    disabled={!!feedback}
                />
                <div className="fraction-composite">
                    <NumericField
                        label="分子"
                        value={fields.numerator}
                        onChange={(event) => updateField('numerator', event.target.value)}
                        disabled={!!feedback}
                    />
                    <div className="fraction-entry-divider" />
                    <NumericField
                        label="分母"
                        value={fields.denominator}
                        onChange={(event) => updateField('denominator', event.target.value)}
                        disabled={!!feedback}
                    />
                </div>
            </div>
        );
    };

    return (
        <form onSubmit={handleStructuredSubmit} className="fraction-answer-form">
            <div className="fraction-answer-toolbar">
                <div className="fraction-answer-hint">
                    <p>{fractionSpec.formatHint}</p>
                    <p className="fraction-answer-example">
                        例：
                        <FractionText text={fractionSpec.example} />
                    </p>
                </div>
                {fractionSpec.allowDirectText && (
                    <div className="fraction-entry-method-switch" role="tablist" aria-label="作答方式">
                        <button
                            type="button"
                            className={`fraction-entry-method-button${entryMethod === 'structured' ? ' is-active' : ''}`}
                            onClick={() => {
                                setEntryMethod('structured');
                                setDirectText('');
                                onValidationError('');
                            }}
                            disabled={!!feedback}
                        >
                            結構化作答
                        </button>
                        <button
                            type="button"
                            className={`fraction-entry-method-button${entryMethod === 'direct' ? ' is-active' : ''}`}
                            onClick={() => {
                                setEntryMethod('direct');
                                onValidationError('');
                            }}
                            disabled={!!feedback}
                        >
                            直接輸入
                        </button>
                    </div>
                )}
            </div>

            {entryMethod === 'structured' ? (
                <>
                    {fractionSpec.allowedEntryModes.length > 1 ? (
                        <div className="fraction-entry-mode-switch" role="tablist" aria-label="分數格式">
                            {fractionSpec.allowedEntryModes.map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    className={`fraction-entry-mode-button${entryMode === mode ? ' is-active' : ''}`}
                                    onClick={() => {
                                        setEntryMode(mode);
                                        setFields(createEmptyFields());
                                        onValidationError('');
                                    }}
                                    disabled={!!feedback}
                                >
                                    {FRACTION_ENTRY_MODE_LABELS[mode]}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="fraction-entry-mode-badge">
                            本題格式：{FRACTION_ENTRY_MODE_LABELS[entryMode]}
                        </p>
                    )}

                    {renderStructuredFields()}
                </>
            ) : (
                <div className="fraction-direct-entry">
                    <input
                        ref={primaryInputRef}
                        type="text"
                        inputMode="text"
                        value={directText}
                        onChange={(event) => {
                            setDirectText(event.target.value);
                            onValidationError('');
                        }}
                        disabled={!!feedback}
                        className={`answer-input${feedback ? (feedback.isCorrect ? ' is-correct' : ' is-wrong') : ''}`}
                        placeholder={fractionSpec.directTextPlaceholder}
                    />
                </div>
            )}

            <div className="fraction-answer-actions">
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

export default FractionAnswerForm;
