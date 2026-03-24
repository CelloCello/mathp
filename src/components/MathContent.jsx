import React from 'react';

import {
    createExpressionPromptTex,
    renderTexToMarkup,
    tokenizeMathContent
} from './mathContentUtils.js';

function MathContent({
    text,
    className = '',
    as: Component = 'span',
    renderKind = 'fraction-rich',
    mathModel = null
}) {
    const classes = ['math-content', className].filter(Boolean).join(' ');

    if (renderKind === 'expression' && mathModel) {
        const markup = renderTexToMarkup(createExpressionPromptTex(mathModel, text));

        if (markup) {
            return (
                <Component className={classes}>
                    <span
                        className="math-content-inline"
                        aria-label={String(text ?? '')}
                        dangerouslySetInnerHTML={{ __html: markup }}
                    />
                </Component>
            );
        }
    }

    const segments = tokenizeMathContent(text);

    return (
        <Component className={classes}>
            {segments.map((segment, index) => {
                if (segment.type === 'text') {
                    return <React.Fragment key={`text-${index}`}>{segment.value}</React.Fragment>;
                }

                const markup = renderTexToMarkup(segment.tex);

                if (!markup) {
                    return <React.Fragment key={`fallback-${index}`}>{segment.raw}</React.Fragment>;
                }

                return (
                    <span
                        key={`math-${index}`}
                        className="math-content-inline"
                        aria-label={segment.raw}
                        dangerouslySetInnerHTML={{ __html: markup }}
                    />
                );
            })}
        </Component>
    );
}

export default MathContent;
