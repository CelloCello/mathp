import React, { useId } from 'react';

export const createAreaLayout = (diagram) => {
    const { shape, base, top, height, skew, mirrored } = diagram;
    const topLeft = shape === 'triangle' ? base / 2 + skew
        : shape === 'trapezoid' ? (base - top + skew) / 2 : skew;
    const upper = shape === 'triangle' ? [[topLeft, height]]
        : [[topLeft + top, height], [topLeft, height]];
    const raw = [[0, 0], [base, 0], ...upper].map(([x, y]) => [mirrored ? -x : x, y]);
    const xs = raw.map(([x]) => x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const scale = Math.min(245 / (maxX - minX), 135 / height);
    const convert = ([x, y]) => [200 + (x - (minX + maxX) / 2) * scale, 205 - y * scale];
    const points = raw.map(convert);
    const heightStart = shape === 'triangle' ? points[2] : points[shape === 'parallelogram' ? 2 : 3];
    return { points, scale, heightStart, foot: [heightStart[0], 205] };
};

const midpoint = (left, right) => [(left[0] + right[0]) / 2, (left[1] + right[1]) / 2];

const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

export const createAreaLabels = (diagram, layout = createAreaLayout(diagram)) => {
    const { points, heightStart, foot } = layout;
    const { shape, task, unknown, segmentLabels, mirrored } = diagram;
    const isRecognition = task === 'identify';
    const baseCenter = midpoint(points[0], points[1]);
    const topLeft = shape === 'triangle' ? points[2] : points[3];
    const topRight = points[2];
    const leftCenter = midpoint(points[0], topLeft);
    const rightCenter = midpoint(points[1], topRight);
    const labelFor = (dimension) => unknown === dimension ? '？公分' : `${diagram[dimension]} 公分`;
    const makeLabel = (id, text, point, anchor = 'middle') => {
        // The 20px CJK font plus outline; allow extra ascent/descent for fallback fonts.
        const width = Array.from(text).length * 20;
        const left = point[0] - (anchor === 'end' ? width : anchor === 'middle' ? width / 2 : 0);
        return {
            id, text, point, anchor,
            bounds: { left: left - 4, right: left + width + 4, top: point[1] - 26, bottom: point[1] + 12 }
        };
    };
    const base = makeLabel('base', isRecognition ? `${segmentLabels[0]}（底）`
        : `${shape === 'trapezoid' ? '下底' : '底'} ${labelFor('base')}`, [baseCenter[0], 245]);
    const otherLabels = isRecognition ? [
        makeLabel('side', segmentLabels[2], [leftCenter[0] + (mirrored ? 30 : -30), leftCenter[1]]),
        makeLabel('top', segmentLabels[3], shape === 'triangle'
            ? [rightCenter[0] + (mirrored ? -30 : 30), rightCenter[1] - 16]
            : [midpoint(topLeft, topRight)[0], topLeft[1] - 20])
    ] : shape === 'trapezoid'
        ? [makeLabel('top', `上底 ${diagram.top} 公分`, [midpoint(topLeft, topRight)[0], topLeft[1] - 20])]
        : [];
    // Use the actual sides at mid-height, not the viewport centre. Mirroring can
    // put a sloping side between the height line and the old preferred label.
    const leftSpace = foot[0] - Math.min(leftCenter[0], rightCenter[0]);
    const rightSpace = Math.max(leftCenter[0], rightCenter[0]) - foot[0];
    const preferredLeft = leftSpace >= rightSpace;
    const middleY = (heightStart[1] + foot[1]) / 2;
    // Narrow triangles may crowd both sides at the midpoint. Move along the
    // same height line, staying below its upper vertex and above the right angle.
    const heightYs = [middleY, Math.min(middleY + 40, foot[1] - 12), Math.max(middleY - 40, heightStart[1] + 26)];
    const heightLabel = heightYs.flatMap((y) => [preferredLeft, !preferredLeft].map((onLeft) => makeLabel('height',
        isRecognition ? segmentLabels[1] : `高 ${labelFor('height')}`,
        [foot[0] + (onLeft ? -18 : 18), y], onLeft ? 'end' : 'start')))
        .find(({ bounds }) => bounds.left >= 0 && bounds.right <= 400 && bounds.top >= 0 && bounds.bottom <= 290
            && [base, ...otherLabels].every((label) => !overlaps(bounds, label.bounds)));
    if (!heightLabel) throw new Error('Area height label cannot be placed clearly.');
    if (isRecognition) {
        // In a narrow figure a readable label may lie beyond another side. A
        // short leader and endpoint make its connection to the height explicit.
        const y = heightLabel.point[1] - 8;
        heightLabel.leader = {
            from: [heightLabel.point[0] + (heightLabel.anchor === 'end' ? 6 : -6), y],
            to: [foot[0], y]
        };
    }
    return [base, heightLabel, ...otherLabels];
};

export const createSymmetryLayout = (diagram) => {
    const points = [{ ...diagram.point, label: 'P' }, ...diagram.candidates]
        .map((point) => ({ ...point, cx: 60 + point.x * 25, cy: 30 + point.y * 25 }));
    const offsets = [
        [12, -12, 'start'], [-12, -12, 'end'],
        [12, 24, 'start'], [-12, 24, 'end'],
        [0, -14, 'middle'], [0, 30, 'middle'],
        [16, 7, 'start'], [-16, 7, 'end']
    ];
    const choices = points.map((point) => offsets.map(([dx, dy, anchor]) => {
        const labelX = point.cx + dx;
        const labelY = point.cy + dy;
        // Bounds include the 20px letter and its white outline.
        const left = labelX - (anchor === 'end' ? 22 : anchor === 'middle' ? 11 : 0);
        return { ...point, labelX, labelY, anchor, bounds: { left, right: left + 22, top: labelY - 18, bottom: labelY + 5 } };
    }).filter(({ bounds }) => bounds.left >= 4 && bounds.right <= 366 && bounds.top >= 4 && bounds.bottom <= 306
        && points.every((other) => !overlaps(bounds, { left: other.cx - 8, right: other.cx + 8, top: other.cy - 8, bottom: other.cy + 8 }))));
    // Search all five labels together instead of fixing a collision at one point
    // and creating another at its neighbour. This is tiny (five points, eight slots).
    const place = (index, placed) => {
        if (index === points.length) return placed;
        for (const choice of choices[index]) {
            if (placed.some((other) => overlaps(choice.bounds, other.bounds))) continue;
            const result = place(index + 1, [...placed, choice]);
            if (result) return result;
        }
        return null;
    };
    const layout = place(0, []);
    if (!layout) throw new Error('Symmetry point labels cannot be placed clearly.');
    return layout;
};

function DiagramLabel({ point, children, anchor = 'middle' }) {
    return <text x={point[0]} y={point[1]} textAnchor={anchor} className="geometry-label">{children}</text>;
}

function AreaDiagram({ diagram }) {
    const layout = createAreaLayout(diagram);
    const { points, heightStart, foot } = layout;
    const labels = createAreaLabels(diagram, layout);
    const rightAngleOnLeft = foot[0] > 200;
    const baselineMin = Math.min(points[0][0], points[1][0], foot[0]);
    const baselineMax = Math.max(points[0][0], points[1][0], foot[0]);
    return (
        <>
            <polygon points={points.map((point) => point.join(',')).join(' ')} className="geometry-shape" />
            <line x1={baselineMin - 10} y1={foot[1]} x2={baselineMax + 10} y2={foot[1]} className="geometry-extension" />
            <line x1={heightStart[0]} y1={heightStart[1]} x2={foot[0]} y2={foot[1]} className="geometry-height" />
            <path d={`M ${foot[0] + (rightAngleOnLeft ? -10 : 10)} ${foot[1]} v -10 h ${rightAngleOnLeft ? 10 : -10}`} className="geometry-right-angle" />
            {labels.map((label) => (
                <React.Fragment key={label.id}>
                    {label.leader && (
                        <g aria-hidden="true" className="geometry-label-leader">
                            <line x1={label.leader.from[0]} y1={label.leader.from[1]} x2={label.leader.to[0]} y2={label.leader.to[1]} />
                            <circle cx={label.leader.to[0]} cy={label.leader.to[1]} r="2" />
                        </g>
                    )}
                    <DiagramLabel point={label.point} anchor={label.anchor}>{label.text}</DiagramLabel>
                </React.Fragment>
            ))}
        </>
    );
}

function SymmetryDiagram({ diagram }) {
    const points = createSymmetryLayout(diagram);
    const axis = 30 + diagram.axis * 25;
    return (
        <>
            {Array.from({ length: 11 }, (_, index) => (
                <React.Fragment key={index}>
                    <line x1={60 + index * 25} y1="30" x2={60 + index * 25} y2="280" className="geometry-grid" />
                    <line x1="60" y1={30 + index * 25} x2="310" y2={30 + index * 25} className="geometry-grid" />
                </React.Fragment>
            ))}
            <line x1={diagram.orientation === 'vertical' ? axis + 30 : 48} y1={diagram.orientation === 'vertical' ? 18 : axis}
                x2={diagram.orientation === 'vertical' ? axis + 30 : 322} y2={diagram.orientation === 'vertical' ? 290 : axis}
                className="geometry-axis" />
            {points.map((point) => (
                <g key={point.label}>
                    <circle cx={point.cx} cy={point.cy} r={point.label === 'P' ? 6 : 5}
                        className={point.label === 'P' ? 'geometry-original-point' : 'geometry-candidate-point'} />
                    <DiagramLabel point={[point.labelX, point.labelY]} anchor={point.anchor}>{point.label}</DiagramLabel>
                </g>
            ))}
        </>
    );
}

function GeometryDiagram({ diagram }) {
    const titleId = useId();
    const descriptionId = useId();
    if (!diagram) return null;
    const isArea = diagram.kind === 'area';
    const description = isArea ? diagram.description
        : `${diagram.description} 以左上角為起點，向右、向下數格：P 在第 ${diagram.point.x}、${diagram.point.y} 格；${diagram.candidates.map((point) => `${point.label} 在第 ${point.x}、${point.y} 格`).join('；')}。對稱軸在向${diagram.orientation === 'vertical' ? '右' : '下'}第 ${diagram.axis} 格。`;
    return (
        <figure className="geometry-diagram">
            <svg viewBox={isArea ? '0 0 400 290' : '0 0 370 310'} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
                <title id={titleId}>{isArea ? '面積練習圖' : '對稱點方格圖'}</title>
                <desc id={descriptionId}>{description}</desc>
                {isArea ? <AreaDiagram diagram={diagram} /> : <SymmetryDiagram diagram={diagram} />}
            </svg>
            <figcaption>{isArea ? diagram.task === 'identify'
                ? '小方角表示直角，細引線指向字母對應的線段。'
                : '長度單位：公分。小方角表示直角。'
                : '虛線是對稱軸，每個方格大小相同。'}</figcaption>
        </figure>
    );
}

export default GeometryDiagram;
