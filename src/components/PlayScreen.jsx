import React, { useState, useEffect, useRef } from 'react';
import { getCategoryById } from '../game/categories';

function PlayScreen({ categoryId, totalQuestions, onFinish, onGoHome, onRestart }) {
    const category = getCategoryById(categoryId);

    const [currentIdx, setCurrentIdx] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [stats, setStats] = useState({ correct: 0, wrong: 0, startTime: Date.now(), wrongList: [] });
    // feedback: null | { isCorrect, correctAnswer }
    const [feedback, setFeedback] = useState(null);
    // confirmDialog: null | { message, onConfirm }
    const [confirmDialog, setConfirmDialog] = useState(null);

    const inputRef = useRef(null);
    const timerRef = useRef(null);

    // Initialize questions on mount
    useEffect(() => {
        const generated = [];
        for (let i = 0; i < totalQuestions; i++) {
            generated.push(category.generateQuestion());
        }
        setQuestions(generated);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    // Auto focus input when moving to next question (not during feedback)
    useEffect(() => {
        if (!feedback && !confirmDialog && inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentIdx, questions, feedback, confirmDialog]);

    const advance = (newStats) => {
        setFeedback(null);
        setUserInput('');
        if (currentIdx + 1 < totalQuestions) {
            setCurrentIdx(currentIdx + 1);
        } else {
            const endTime = Date.now();
            onFinish({
                ...newStats,
                endTime,
                timeSpentMs: endTime - newStats.startTime,
                total: totalQuestions
            });
        }
    };

    const handleGoHome = () => {
        // Cancel any pending feedback timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setConfirmDialog({
            message: '確定要回到首頁嗎？目前的測驗進度將不會保留。',
            onConfirm: onGoHome
        });
    };

    const handleRestart = () => {
        // Cancel any pending feedback timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setConfirmDialog({
            message: '確定要重新測驗嗎？目前的測驗進度將不會保留。',
            onConfirm: onRestart
        });
    };

    const handleDialogCancel = () => {
        setConfirmDialog(null);
    };

    const handleDialogConfirm = () => {
        const { onConfirm } = confirmDialog;
        setConfirmDialog(null);
        onConfirm();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!userInput || feedback) return;

        const currentQ = questions[currentIdx];
        const isCorrect = currentQ.answers.includes(Number(userInput));

        const newWrongList = isCorrect
            ? stats.wrongList
            : [...stats.wrongList, {
                text: currentQ.text,
                userAnswer: Number(userInput),
                correctAnswer: currentQ.answers[0]
            }];

        const newStats = {
            ...stats,
            correct: stats.correct + (isCorrect ? 1 : 0),
            wrong: stats.wrong + (isCorrect ? 0 : 1),
            wrongList: newWrongList
        };

        setStats(newStats);
        setFeedback({ isCorrect, correctAnswer: currentQ.answers[0] });

        // Show feedback then advance
        const delay = isCorrect ? 1000 : 1800;
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            advance(newStats);
        }, delay);
    };

    if (questions.length === 0) return <div>準備中...</div>;

    const currentQ = questions[currentIdx];
    const progressPercent = ((currentIdx) / totalQuestions) * 100;

    return (
        <>
            <div className="play-screen animate-pop" style={{ textAlign: 'center' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            type="button"
                            onClick={handleGoHome}
                            className="btn-nav"
                            title="回到首頁"
                        >🏠 首頁</button>
                        <button
                            type="button"
                            onClick={handleRestart}
                            className="btn-nav"
                            title="重新測驗"
                        >🔄 重新測驗</button>
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
                </div>

                <div style={{ background: '#eee', height: '10px', borderRadius: '5px', marginBottom: '20px' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: '#84fab0', borderRadius: '5px', transition: 'width 0.3s' }}></div>
                </div>

                <div className="card" style={{ padding: '40px 20px', marginBottom: '30px' }}>
                    <h2 style={{
                        fontSize: currentQ.text.length <= 10
                            ? 'clamp(2rem, 8vw, 3rem)'
                            : currentQ.text.length <= 18
                                ? 'clamp(1.6rem, 6vw, 2.2rem)'
                                : 'clamp(1.3rem, 4.5vw, 1.8rem)',
                        margin: 0,
                        lineHeight: 1.4,
                        wordBreak: 'keep-all'
                    }}>{currentQ.text}</h2>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', position: 'relative', marginBottom: '30px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            ref={inputRef}
                            type="number"
                            value={feedback ? (feedback.isCorrect ? userInput : feedback.correctAnswer) : userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            disabled={!!feedback}
                            style={{
                                width: '100%',
                                padding: '20px',
                                paddingLeft: feedback ? '50px' : '20px',
                                fontSize: '2rem',
                                borderRadius: '20px',
                                border: `3px solid ${feedback ? (feedback.isCorrect ? '#00b894' : '#e17055') : '#a18cd1'}`,
                                textAlign: 'center',
                                backgroundColor: feedback 
                                    ? (feedback.isCorrect ? 'rgba(0, 184, 148, 0.1)' : 'rgba(225, 112, 85, 0.1)') 
                                    : 'white',
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box'
                            }}
                            placeholder="輸入答案"
                        />
                        {feedback && (
                            <span style={{
                                position: 'absolute',
                                left: '15px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '1.8rem',
                                pointerEvents: 'none'
                            }}>
                                {feedback.isCorrect ? '✅' : '❌'}
                            </span>
                        )}
                        {feedback && !feedback.isCorrect && (
                            <div style={{
                                position: 'absolute',
                                bottom: '-28px',
                                left: '0',
                                right: '0',
                                textAlign: 'center',
                                fontSize: '1rem',
                                color: '#e17055',
                                fontWeight: 'bold'
                            }}>
                                你的答案：{userInput}
                            </div>
                        )}
                    </div>
                    <button type="submit" className="btn" disabled={!!feedback} style={{ padding: '20px 30px', fontSize: '2rem', opacity: feedback ? 0.6 : 1 }}>送出</button>
                </form>
            </div>

            {/* Custom Confirm Dialog - outside play-screen to avoid transform containing block issue */}
            {confirmDialog && (
                <div className="confirm-overlay" onClick={handleDialogCancel}>
                    <div className="confirm-dialog animate-pop" onClick={(e) => e.stopPropagation()}>
                        <p className="confirm-message">{confirmDialog.message}</p>
                        <div className="confirm-actions">
                            <button type="button" className="btn btn-secondary" onClick={handleDialogCancel}>取消</button>
                            <button type="button" className="btn" onClick={handleDialogConfirm}>確定</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default PlayScreen;
