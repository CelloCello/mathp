import React from 'react';

import MathContent from './MathContent.jsx';

function FractionText({ text, className = '', as: Component = 'span' }) {
    return (
        <MathContent
            text={text}
            className={['fraction-text', className].filter(Boolean).join(' ')}
            as={Component}
        />
    );
}

export default FractionText;
