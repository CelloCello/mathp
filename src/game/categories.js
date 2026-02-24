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
    },
    {
        id: 'approximation',
        name: '概數',
        description: '四捨五入、無條件進入/捨去',
        icon: '🎯',
        color: '#74b9ff',
        generateQuestion: () => {
            const methods = [
                { name: '四捨五入法', fn: (n, unit) => Math.round(n / unit) * unit },
                { name: '無條件進入法', fn: (n, unit) => Math.ceil(n / unit) * unit },
                { name: '無條件捨去法', fn: (n, unit) => Math.floor(n / unit) * unit }
            ];
            const places = [
                { name: '十位', unit: 10 },
                { name: '百位', unit: 100 },
                { name: '千位', unit: 1000 },
                { name: '萬位', unit: 10000 }
            ];

            const method = methods[Math.floor(Math.random() * methods.length)];
            const place = places[Math.floor(Math.random() * places.length)];

            // Ensure the number is larger than the unit so the question is meaningful
            const minNum = place.unit + 1;
            const maxNum = 99999;
            const num = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;

            const answer = method.fn(num, place.unit);

            return {
                text: `${num.toLocaleString()} 以「${method.name}」取概數到${place.name} = ?`,
                answers: [answer],
                type: 'number'
            };
        }
    }
];

export const getCategoryById = (id) => categories.find(c => c.id === id);
