import React, { useEffect, useRef, useState } from 'react';
import { getCategoryById, getUnitById } from '../game/categories.js';
import FractionAnswerForm from './FractionAnswerForm.jsx';
import MathContent from './MathContent.jsx';

function PlayScreen({ categoryId, unitId, questions, onFinish, onGoHome, onRestart }) {
    const category = getCategoryById(categoryId);
    const unit = getUnitById(categoryId, unitId);
    const totalQuestions = questions.length;

    const [currentIdx, setCurrentIdx] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [validationError, setValidationError] = useState('');
    const [stats, setStats] = useState({
        correct: 0,
        wrong: 0,
        startTime: Date.now(),
        wrongList: []
    });
    const [feedback, setFeedback] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);

    const inputRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    }, []);

    useEffect(() => {
        if (!feedback && !confirmDialog && inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentIdx, feedback, confirmDialog]);

    if (!category || !unit || totalQuestions === 0) {
        return <div>準備中...</div>;
    }

    const currentQuestion = questions[currentIdx];

    const advance = (nextStats) => {
        setFeedback(null);
        setValidationError('');
        setUserInput('');

        if (currentIdx + 1 < totalQuestions) {
            setCurrentIdx((previous) => previous + 1);
            return;
        }

        const endTime = Date.now();
        onFinish({
            ...nextStats,
            endTime,
            timeSpentMs: endTime - nextStats.startTime,
            total: totalQuestions
        });
    };

    const submitAnswer = (rawInput) => {
        if (feedback) {
            return;
        }

        const evaluation = currentQuestion.evaluate(rawInput);

        if (evaluation.validationError) {
            setValidationError(evaluation.validationError);
            return;
        }

        const nextWrongList = evaluation.isCorrect
            ? stats.wrongList
            : [
                ...stats.wrongList,
                {
                    text: currentQuestion.text,
                    questionMeta: currentQuestion.meta,
                    userAnswer: evaluation.userAnswerLabel,
                    correctAnswer: evaluation.correctAnswerLabel
                }
            ];

        const nextStats = {
            ...stats,
            correct: stats.correct + (evaluation.isCorrect ? 1 : 0),
            wrong: stats.wrong + (evaluation.isCorrect ? 0 : 1),
            wrongList: nextWrongList
        };

        setStats(nextStats);
        setValidationError('');
        setFeedback({
            ...evaluation,
            selectedValue: currentQuestion.inputMode === 'choice' ? rawInput : null
        });

        const delay = evaluation.isCorrect ? 1000 : 1600;
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            advance(nextStats);
        }, delay);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        submitAnswer(userInput);
    };

    const openConfirmDialog = (message, onConfirm) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        setConfirmDialog({ message, onConfirm });
    };

    const progressPercent = (currentIdx / totalQuestions) * 100;

    return (
        <>
            <div className="play-screen animate-pop" style={{ textAlign: 'center' }}>
                <div className="selection-header" style={{ marginBottom: '16px' }}>
                    <p className="selection-kicker">Step 4</p>
                    <h2 style={{ marginBottom: '8px' }}>{category.name} / {unit.name}</h2>
                    <p className="selection-description">{unit.description}</p>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            type="button"
                            onClick={() => openConfirmDialog('確定要回到首頁嗎？目前的測驗進度將不會保留。', onGoHome)}
                            className="btn-nav"
                            title="回到首頁"
                        >🏠 首頁</button>
                        <button
                            type="button"
                            onClick={() => openConfirmDialog('確定要重新選擇題數嗎？目前的測驗進度將不會保留。', onRestart)}
                            className="btn-nav"
                            title="重新測驗"
                        >🔄 重選題數</button>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#a18cd1' }}>✅ {stats.correct}</span>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontWeight: 'bold',
                    color: '#a18cd1',
                    fontSize: '0.95rem'
                }}>
                    <span>進度: {currentIdx + 1} / {totalQuestions}</span>
                    <span>{currentQuestion.inputMode === 'choice' ? '選擇題' : currentQuestion.inputMode === 'fraction' ? '分數作答' : '數字作答'}</span>
                </div>

                <div style={{ background: '#eee', height: '10px', borderRadius: '5px', marginBottom: '20px' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: '#84fab0', borderRadius: '5px', transition: 'width 0.3s' }} />
                </div>

                <div className="card" style={{ padding: '40px 20px', marginBottom: '24px' }}>
                    <h2 style={{
                        fontSize: currentQuestion.text.length <= 10
                            ? 'clamp(2rem, 8vw, 3rem)'
                            : currentQuestion.text.length <= 18
                                ? 'clamp(1.6rem, 6vw, 2.2rem)'
                                : 'clamp(1.3rem, 4.5vw, 1.8rem)',
                        margin: 0,
                        lineHeight: 1.4,
                        wordBreak: 'keep-all'
                    }}>
                        <MathContent
                            text={currentQuestion.text}
                            renderKind={currentQuestion.meta?.renderKind}
                            mathModel={currentQuestion.meta?.mathModel}
                        />
                    </h2>
                </div>

                {currentQuestion.inputMode === 'choice' ? (
                    <div className="choice-grid">
                        {currentQuestion.options.map((option) => {
                            const isSelected = feedback?.selectedValue === option.value;
                            const isCorrectOption = feedback && option.value === currentQuestion.correctValue;
                            const isWrongSelected = feedback && isSelected && !feedback.isCorrect;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`choice-option${isCorrectOption ? ' is-correct' : ''}${isWrongSelected ? ' is-wrong' : ''}${isSelected ? ' is-selected' : ''}`}
                                    disabled={!!feedback}
                                    onClick={() => submitAnswer(option.value)}
                                >
                                    <MathContent text={option.label} />
                                </button>
                            );
                        })}
                    </div>
                ) : currentQuestion.inputMode === 'fraction' ? (
                    <FractionAnswerForm
                        key={currentIdx}
                        fractionSpec={currentQuestion.fractionSpec}
                        feedback={feedback}
                        validationError={validationError}
                        onValidationError={setValidationError}
                        onSubmit={submitAnswer}
                    />
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', position: 'relative', marginBottom: '10px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <input
                                ref={inputRef}
                                type={currentQuestion.inputMode === 'number' ? 'number' : 'text'}
                                inputMode={currentQuestion.inputMode === 'number' ? 'numeric' : 'text'}
                                value={userInput}
                                onChange={(event) => {
                                    setUserInput(event.target.value);
                                    setValidationError('');
                                }}
                                disabled={!!feedback}
                                className={`answer-input${feedback ? (feedback.isCorrect ? ' is-correct' : ' is-wrong') : ''}`}
                                placeholder={currentQuestion.placeholder}
                            />
                        </div>
                        <button type="submit" className="btn" disabled={!!feedback} style={{ padding: '20px 30px', fontSize: '2rem', opacity: feedback ? 0.6 : 1 }}>送出</button>
                    </form>
                )}

                {validationError && currentQuestion.inputMode !== 'fraction' && (
                    <p className="inline-error">{validationError}</p>
                )}

                {feedback && (
                    <div className={`feedback-banner ${feedback.isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
                        <p>
                            {feedback.isCorrect ? (
                                '答對了！'
                            ) : (
                                <>
                                    答錯了，正確答案是 <MathContent text={feedback.correctAnswerLabel} className="feedback-answer-text" />
                                </>
                            )}
                        </p>
                        {!feedback.isCorrect && (
                            <p style={{ fontSize: '1rem', marginTop: '8px' }}>
                                你的答案：<MathContent text={feedback.userAnswerLabel} className="feedback-answer-text" />
                                {feedback.note ? `｜${feedback.note}` : ''}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {confirmDialog && (
                <div className="confirm-overlay" onClick={() => setConfirmDialog(null)}>
                    <div className="confirm-dialog animate-pop" onClick={(event) => event.stopPropagation()}>
                        <p className="confirm-message">{confirmDialog.message}</p>
                        <div className="confirm-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setConfirmDialog(null)}>取消</button>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => {
                                    const { onConfirm } = confirmDialog;
                                    setConfirmDialog(null);
                                    onConfirm();
                                }}
                            >
                                確定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default PlayScreen;
