import React from 'react';
import { categories } from '../game/categories.js';

function MenuScreen({ onSelectCategory }) {
    return (
        <div className="menu-screen animate-pop">
            <div className="selection-header">
                <p className="selection-kicker">Step 1</p>
                <h2>選擇挑戰分類</h2>
                <p className="selection-description">先選分類，再選單元，最後決定題數開始練習。</p>
            </div>

            <div className="category-grid">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        className="card category-btn"
                        style={{
                            backgroundColor: cat.color,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxShadow: `0 6px 0 ${cat.color}aa`
                        }}
                        onClick={() => onSelectCategory(cat.id)}
                    >
                        <span style={{ fontSize: '3rem', marginBottom: '10px' }}>{cat.icon}</span>
                        <h3 style={{ margin: 0, color: '#fff', textShadow: '1px 1px 0 rgba(0,0,0,0.2)' }}>{cat.name}</h3>
                        <p style={{ margin: '5px 0 0 0', color: '#fff', fontSize: '0.9rem', opacity: 0.9 }}>{cat.description}</p>
                        <span className="card-chip">{cat.units.length} 個單元</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default MenuScreen;
