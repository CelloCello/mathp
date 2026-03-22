import React from 'react';
import { tokenizeFractionText } from './fractionTextUtils.js';

const FractionStack = ({ numerator, denominator }) => (
    <span className="fraction-stack" aria-label={`${numerator}/${denominator}`}>
        <span className="fraction-stack-numerator">{numerator}</span>
        <span className="fraction-stack-line" />
        <span className="fraction-stack-denominator">{denominator}</span>
    </span>
);

function FractionText({ text, className = '', as: Component = 'span' }) {
    const tokens = tokenizeFractionText(text);
    const classes = ['fraction-text', className].filter(Boolean).join(' ');

    return (
        <Component className={classes}>
            {tokens.map((token, index) => {
                if (token.type === 'text') {
                    return <React.Fragment key={`text-${index}`}>{token.value}</React.Fragment>;
                }

                if (token.type === 'integer') {
                    return (
                        <span key={`integer-${index}`} className="fraction-inline-number">
                            {token.value}
                        </span>
                    );
                }

                if (token.type === 'mixed') {
                    return (
                        <span key={`mixed-${index}`} className="fraction-mixed">
                            <span className="fraction-mixed-whole">{token.whole}</span>
                            <FractionStack numerator={token.numerator} denominator={token.denominator} />
                        </span>
                    );
                }

                return (
                    <FractionStack
                        key={`fraction-${index}`}
                        numerator={token.numerator}
                        denominator={token.denominator}
                    />
                );
            })}
        </Component>
    );
}

export default FractionText;
