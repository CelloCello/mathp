import React from 'react';

function SettingsScreen({ onStart, onBack }) {
    const options = [5, 10, 20, 50];

    return (
        <div className="settings-screen animate-pop" style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '20px', color: '#a18cd1' }}>要挑戰幾題呢？</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto' }}>
                {options.map((num) => (
                    <button
                        key={num}
                        className="btn btn-large"
                        onClick={() => onStart(num)}
                    >
                        {num} 題
                    </button>
                ))}

                <button
                    className="btn btn-secondary"
                    style={{ marginTop: '20px' }}
                    onClick={onBack}
                >
                    返回目錄 ⬅️
                </button>
            </div>
        </div>
    );
}

export default SettingsScreen;
