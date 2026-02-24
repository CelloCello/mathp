import React from 'react';
import { categories } from '../game/categories';

function MenuScreen({ onSelectCategory }) {
    return (
        <div className="menu-screen animate-pop">
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#a18cd1' }}>選擇挑戰項目</h2>
            <div className="category-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px'
            }}>
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
                    </button>
                ))}
            </div>
        </div>
    );
}

export default MenuScreen;
