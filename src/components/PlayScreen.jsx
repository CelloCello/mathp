import React, { useState, useEffect, useRef } from 'react';
import { getCategoryById } from '../game/categories';

function PlayScreen({ categoryId, totalQuestions, onFinish }) {
    const category = getCategoryById(categoryId);

    const [currentIdx, setCurrentIdx] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [stats, setStats] = useState({ correct: 0, wrong: 0, startTime: Date.now(), wrongList: [] });
    // feedback: null | { isCorrect, correctAnswer }
    const [feedback, setFeedback] = useState(null);

    const inputRef = useRef(null);

    // Initialize questions on mount
    useEffect(() => {
        const generated = [];
        for (let i = 0; i < totalQuestions; i++) {
            generated.push(category.generateQuestion());
        }
        setQuestions(generated);
    }, []);

    // Auto focus input when moving to next question (not during feedback)
    useEffect(() => {
        if (!feedback && inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentIdx, questions, feedback]);

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
        setTimeout(() => advance(newStats), delay);
    };

    if (questions.length === 0) return <div>準備中...</div>;

    const currentQ = questions[currentIdx];
    const progressPercent = ((currentIdx) / totalQuestions) * 100;

    return (
        <div className="play-screen animate-pop" style={{ textAlign: 'center' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '20px',
                fontWeight: 'bold',
                color: '#a18cd1'
            }}>
                <span>進度: {currentIdx + 1} / {totalQuestions}</span>
                <span>✅ {stats.correct}</span>
            </div>

            <div style={{ background: '#eee', height: '10px', borderRadius: '5px', marginBottom: '20px' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: '#84fab0', borderRadius: '5px', transition: 'width 0.3s' }}></div>
            </div>

            <div className="card" style={{ padding: '40px 20px', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '3rem', margin: 0 }}>{currentQ.text}</h2>
            </div>

            {feedback && (
                <div className={`feedback-banner ${feedback.isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
                    {feedback.isCorrect
                        ? <span>✅ 答對了！</span>
                        : <span>❌ 答錯了！正確答案是 <strong>{feedback.correctAnswer.toLocaleString()}</strong></span>
                    }
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input
                    ref={inputRef}
                    type="number"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={!!feedback}
                    style={{
                        flex: 1,
                        padding: '20px',
                        fontSize: '2rem',
                        borderRadius: '20px',
                        border: `2px solid ${feedback ? (feedback.isCorrect ? '#00b894' : '#e17055') : '#a18cd1'}`,
                        textAlign: 'center',
                        opacity: feedback ? 0.6 : 1
                    }}
                    placeholder="輸入答案"
                />
                <button type="submit" className="btn" disabled={!!feedback} style={{ padding: '20px 30px', fontSize: '2rem', opacity: feedback ? 0.6 : 1 }}>送出</button>
            </form>
        </div>
    );
}

export default PlayScreen;
