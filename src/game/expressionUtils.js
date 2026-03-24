const OPERATOR_LABELS = {
    add: '+',
    subtract: '-',
    multiply: '×',
    divide: '÷'
};

const OPERATOR_TEX = {
    add: '+',
    subtract: '-',
    multiply: '\\times',
    divide: '\\div'
};

const OPENING_BRACKETS = new Set(['paren', 'square', 'curly']);

const BRACKET_TEXT = {
    paren: ['(', ')'],
    square: ['[', ']'],
    curly: ['{', '}']
};

const BRACKET_TEX = {
    paren: ['(', ')'],
    square: ['[', ']'],
    curly: ['\\{', '\\}']
};

export const createValueNode = (value) => ({
    type: 'value',
    value
});

export const createBinaryNode = (operator, left, right, options = {}) => ({
    type: 'binary',
    operator,
    left,
    right,
    implicit: Boolean(options.implicit)
});

export const createGroupNode = (expression, bracket = 'paren') => {
    if (!OPENING_BRACKETS.has(bracket)) {
        throw new Error(`Unsupported bracket type: ${bracket}`);
    }

    return {
        type: 'group',
        bracket,
        expression
    };
};

const ensurePositiveInteger = (value, message) => {
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(message);
    }
};

export const evaluateExpression = (node) => {
    if (node.type === 'value') {
        ensurePositiveInteger(node.value, 'Expression values must be positive integers.');
        return {
            value: node.value,
            steps: [node.value]
        };
    }

    if (node.type === 'group') {
        return evaluateExpression(node.expression);
    }

    if (node.type !== 'binary') {
        throw new Error(`Unsupported expression node type: ${node.type}`);
    }

    const left = evaluateExpression(node.left);
    const right = evaluateExpression(node.right);

    if (node.operator === 'add') {
        const value = left.value + right.value;
        return {
            value,
            steps: [...left.steps, ...right.steps, value]
        };
    }

    if (node.operator === 'subtract') {
        const value = left.value - right.value;
        ensurePositiveInteger(value, 'Subtraction results must stay positive.');
        return {
            value,
            steps: [...left.steps, ...right.steps, value]
        };
    }

    if (node.operator === 'multiply') {
        const value = left.value * right.value;
        return {
            value,
            steps: [...left.steps, ...right.steps, value]
        };
    }

    if (node.operator === 'divide') {
        if (right.value === 0 || left.value % right.value !== 0) {
            throw new Error('Division steps must divide evenly.');
        }

        const value = left.value / right.value;
        ensurePositiveInteger(value, 'Division results must stay positive integers.');
        return {
            value,
            steps: [...left.steps, ...right.steps, value]
        };
    }

    throw new Error(`Unsupported expression operator: ${node.operator}`);
};

const renderExpression = (node, bracketMap, operatorMap, mode = 'text') => {
    if (node.type === 'value') {
        return `${node.value}`;
    }

    if (node.type === 'group') {
        const [open, close] = bracketMap[node.bracket];
        return `${open}${renderExpression(node.expression, bracketMap, operatorMap, mode)}${close}`;
    }

    if (node.type !== 'binary') {
        throw new Error(`Unsupported expression node type: ${node.type}`);
    }

    const left = renderExpression(node.left, bracketMap, operatorMap, mode);
    const right = renderExpression(node.right, bracketMap, operatorMap, mode);

    if (node.operator === 'multiply' && node.implicit) {
        return `${left}${right}`;
    }

    return `${left} ${operatorMap[node.operator]} ${right}`;
};

export const expressionToText = (node) =>
    renderExpression(node, BRACKET_TEXT, OPERATOR_LABELS, 'text');

export const expressionToTex = (node) =>
    renderExpression(node, BRACKET_TEX, OPERATOR_TEX, 'tex');
