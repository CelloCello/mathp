import React from 'react';
import { getCategoryById, getUnitById } from '../game/categories.js';

function SettingsScreen({ categoryId, unitId, onStart, onBack }) {
    const options = [5, 10, 20, 50];
    const category = getCategoryById(categoryId);
    const unit = getUnitById(categoryId, unitId);

    return (
        <div className="settings-screen animate-pop" style={{ textAlign: 'center' }}>
            <div className="selection-header">
                <p className="selection-kicker">Step 3</p>
                <h2 style={{ marginBottom: '8px', color: '#a18cd1' }}>要挑戰幾題呢？</h2>
                {category && unit && (
                    <p className="selection-description">{category.name} / {unit.name}</p>
                )}
            </div>

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
                    返回單元 ⬅️
                </button>
            </div>
        </div>
    );
}

export default SettingsScreen;
