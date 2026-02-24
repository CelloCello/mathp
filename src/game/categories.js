// src/game/categories.js

/**
 * Math category definitions.
 * Easily extendable by adding new objects to this array.
 */
export const categories = [
    {
        id: 'addition_basic',
        name: '基礎加法',
        description: '10以內的加法',
        icon: '🍎',
        color: '#ff9a9e',
        generateQuestion: () => {
            const a = Math.floor(Math.random() * 9) + 1; // 1 to 9
            const b = Math.floor(Math.random() * (10 - a)) + 1; // Ensures sum <= 10
            return {
                text: `${a} + ${b} = ?`,
                answers: [a + b], // Array to support multiple valid answers/formats later if needed
                type: 'number'
            };
        }
    },
    {
        id: 'subtraction_basic',
        name: '基礎減法',
        description: '10以內的減法',
        icon: '🐢',
        color: '#84fab0',
        generateQuestion: () => {
            const a = Math.floor(Math.random() * 10) + 1; // 1 to 10
            const b = Math.floor(Math.random() * a); // 0 to a-1 (ensures positive result)
            return {
                text: `${a} - ${b} = ?`,
                answers: [a - b],
                type: 'number'
            };
        }
    },
    {
        id: 'multiplication_table',
        name: '九九乘法',
        description: '1到9的乘法表',
        icon: '🚀',
        color: '#fccb90',
        generateQuestion: () => {
            const a = Math.floor(Math.random() * 9) + 1;
            const b = Math.floor(Math.random() * 9) + 1;
            return {
                text: `${a} × ${b} = ?`,
                answers: [a * b],
                type: 'number'
            };
        }
    }
];

export const getCategoryById = (id) => categories.find(c => c.id === id);
