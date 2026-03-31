import React from 'react';
import MathContent from './MathContent.jsx';

const formatTimeSpent = (timeSpentMs) => {
    const timeSecs = Math.round(timeSpentMs / 1000);
    const mins = Math.floor(timeSecs / 60);
    const secs = timeSecs % 60;

    return `${mins > 0 ? `${mins}分 ` : ''}${secs}秒`;
};

const getSummaryReaction = (accuracy) => {
    if (accuracy === 100) {
        return { message: '太棒了！全對！', emoji: '🌟' };
    }

    if (accuracy >= 80) {
        return { message: '做得很棒唷！', emoji: '👏' };
    }

    return { message: '繼續加油！', emoji: '💪' };
};

function SummaryScreen({ result, onRestart }) {
    const {
        categoryName,
        unitName,
        correct,
        wrong,
        total,
        timeSpentMs,
        wrongList = []
    } = result;

    const accuracy = Math.round((correct / total) * 100);
    const { message, emoji } = getSummaryReaction(accuracy);
    const timeSpentLabel = formatTimeSpent(timeSpentMs);

    return (
        <div className="summary-screen animate-pop" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: '#ff9a9e' }}>{emoji} {message}</h2>
            <p className="selection-description" style={{ marginBottom: '20px' }}>
                {categoryName} / {unitName}
            </p>

            <div className="card" style={{ fontSize: '1.5rem', marginBottom: '30px' }}>
                <p style={{ margin: '10px 0' }}>💡 正確率: <strong style={{ color: '#a18cd1' }}>{accuracy}%</strong></p>
                <p style={{ margin: '10px 0' }}>✅ 答對: <strong style={{ color: '#84fab0' }}>{correct} 題</strong></p>
                <p style={{ margin: '10px 0' }}>❌ 答錯: <strong style={{ color: '#e17055' }}>{wrong} 題</strong></p>
                <p style={{ margin: '10px 0' }}>⏱ 使用時間: <strong>{timeSpentLabel}</strong></p>
            </div>

            {wrongList.length > 0 && (
                <div className="card wrong-review" style={{ textAlign: 'left', marginBottom: '30px' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#ff9a9e' }}>❌ 錯誤題目回顧</h3>
                    {wrongList.map((item, idx) => (
                        <div key={idx} className="wrong-review-item">
                            <p className="wrong-review-question">
                                <MathContent
                                    text={item.text}
                                    renderKind={item.questionMeta?.renderKind}
                                    mathModel={item.questionMeta?.mathModel}
                                />
                            </p>
                            <div className="wrong-review-answers">
                                <span className="wrong-review-user">
                                    你的答案: <MathContent text={item.userAnswer} />
                                </span>
                                <span className="wrong-review-correct">
                                    正確答案: <MathContent text={item.correctAnswer} />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button className="btn btn-large" onClick={onRestart}>
                再來一次 🔄
            </button>
        </div>
    );
}

export default SummaryScreen;
