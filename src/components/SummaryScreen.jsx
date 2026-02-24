import React from 'react';

function SummaryScreen({ result, onRestart }) {
    const { correct, wrong, total, timeSpentMs } = result;

    const accuracy = Math.round((correct / total) * 100);
    const timeSecs = Math.round(timeSpentMs / 1000);
    const mins = Math.floor(timeSecs / 60);
    const secs = timeSecs % 60;

    let message = '';
    let emoji = '';
    if (accuracy === 100) { message = '太棒了！全對！'; emoji = '🌟'; }
    else if (accuracy >= 80) { message = '做得很棒唷！'; emoji = '👏'; }
    else { message = '繼續加油！'; emoji = '💪'; }

    return (
        <div className="summary-screen animate-pop" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: '#ff9a9e' }}>{emoji} {message}</h2>

            <div className="card" style={{ fontSize: '1.5rem', marginBottom: '30px' }}>
                <p style={{ margin: '10px 0' }}>💡 正確率: <strong style={{ color: '#a18cd1' }}>{accuracy}%</strong></p>
                <p style={{ margin: '10px 0' }}>✅ 答對: <strong style={{ color: '#84fab0' }}>{correct} 題</strong></p>
                <p style={{ margin: '10px 0' }}>⏱ 使用時間: <strong>{mins > 0 ? `${mins}分 ` : ''}{secs}秒</strong></p>
            </div>

            <button className="btn btn-large" onClick={onRestart}>
                再來一次 🔄
            </button>
        </div>
    );
}

export default SummaryScreen;
