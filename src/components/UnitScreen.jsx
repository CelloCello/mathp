import React from 'react';
import { getCategoryById } from '../game/categories.js';

function UnitScreen({ categoryId, onSelectUnit, onBack }) {
    const category = getCategoryById(categoryId);

    if (!category) {
        return (
            <div className="card" style={{ textAlign: 'center' }}>
                <p>找不到這個分類，請回首頁重新選擇。</p>
                <button className="btn btn-secondary" onClick={onBack}>返回目錄 ⬅️</button>
            </div>
        );
    }

    return (
        <div className="menu-screen animate-pop">
            <div className="selection-header">
                <p className="selection-kicker">目前分類</p>
                <h2 style={{ color: category.color }}>{category.icon} {category.name}</h2>
                <p className="selection-description">{category.description}</p>
            </div>

            <div className="unit-grid">
                {category.units.map((unit) => (
                    <button
                        key={unit.id}
                        className="card unit-btn"
                        type="button"
                        onClick={() => onSelectUnit(unit.id)}
                        style={{
                            borderTop: `6px solid ${category.color}`
                        }}
                    >
                        <h3>{unit.name}</h3>
                        <p>{unit.description}</p>
                    </button>
                ))}
            </div>

            <button
                className="btn btn-secondary"
                style={{ marginTop: '24px', alignSelf: 'center' }}
                onClick={onBack}
            >
                返回分類 ⬅️
            </button>
        </div>
    );
}

export default UnitScreen;
