import { createChoiceQuestion, createNumberQuestion } from './questionFactories.js';
import { createPracticeUnit, pickRandom, randomInt, shuffle } from './practiceUtils.js';

export const AREA_SHAPES = {
    parallelogram: '平行四邊形',
    triangle: '三角形',
    trapezoid: '梯形'
};

export const calculateArea = ({ shape, base, top, height }) => {
    if (shape === 'triangle') return base * height / 2;
    if (shape === 'trapezoid') return (base + top) * height / 2;
    return base * height;
};

const createAreaQuestion = (shape, task) => {
    // All labelled dimensions are 2–20 cm; keep the figure readable and area integral.
    const base = randomInt(shape === 'trapezoid' ? 5 : 3, 20);
    const top = shape === 'trapezoid' ? randomInt(2, base - 1) : base;
    const heights = Array.from({ length: 19 }, (_, index) => index + 2)
        .filter((height) => height >= base / 2 && height <= base * 2
            && Number.isInteger(calculateArea({ shape, base, top, height })));
    const height = pickRandom(heights);
    const unknown = task === 'inverse' ? shape === 'trapezoid' ? 'height' : pickRandom(['base', 'height']) : null;
    const skews = [-3, -2, -1, 1, 2, 3].filter((skew) => shape === 'triangle'
        ? base / 2 + skew !== 0 && base / 2 + skew !== base
        : shape === 'trapezoid' ? Math.abs(skew) !== base - top : true);
    const diagram = {
        kind: 'area', shape, base, top, height, task, unknown,
        skew: pickRandom(skews),
        mirrored: Math.random() < 0.5,
        segmentLabels: shuffle(['甲', '乙', '丙', '丁'])
    };
    const area = calculateArea(diagram);
    const shapeName = AREA_SHAPES[shape];
    const dimensions = shape === 'trapezoid' ? `(${top} + ${base}) × ${height} ÷ 2`
        : `${base} × ${height}${shape === 'triangle' ? ' ÷ 2' : ''}`;
    const formula = shape === 'trapezoid' ? '（上底 + 下底）× 高 ÷ 2'
        : shape === 'triangle' ? '底 × 高 ÷ 2' : '底 × 高';
    const description = task === 'identify'
        ? `${shapeName}，底邊標為${diagram.segmentLabels[0]}。${diagram.segmentLabels[1]}與底邊或其延長線交會，交會處標有直角；${diagram.segmentLabels[2]}是斜邊，${diagram.segmentLabels[3]}是${shape === 'triangle' ? '另一條斜邊' : '與底平行的上邊'}。`
        : `${shapeName}，${shape === 'trapezoid' ? `上底 ${top} 公分，下底` : '底'} ${unknown === 'base' ? '未知' : `${base} 公分`}，高 ${unknown === 'height' ? '未知' : `${height} 公分`}。`;
    const meta = {
        promptType: 'area', diagram: { ...diagram, description }, area,
        explanation: `${shapeName}面積 = ${formula}：${dimensions} = ${area} 平方公分。`,
        // Labels and pose vary, but a numerical task still needs fresh dimensions.
        practiceKey: `area:${shape}:${task}:${base}:${top}:${height}:${unknown}`
    };
    if (task === 'identify') {
        const correctValue = diagram.segmentLabels[1];
        meta.explanation = `高是和底邊垂直的線段。圖中的直角標記表示${correctValue}與底邊或其延長線垂直，所以高是${correctValue}。`;
        // For recognition, the arrangement is part of the learning task.
        meta.practiceKey += `:${diagram.skew}:${diagram.mirrored}:${diagram.segmentLabels.join('')}`;
        return createChoiceQuestion({
            text: `以圖中標示的底邊為底，哪一條線段是這個${shapeName}的高？`,
            options: ['甲', '乙', '丙', '丁'].map((value) => ({ value, label: value })),
            correctValue,
            meta
        });
    }
    const answer = unknown ? diagram[unknown] : area;
    if (unknown) {
        meta.explanation = shape === 'trapezoid'
            ? `高 = 面積 × 2 ÷（上底 + 下底）= ${area} × 2 ÷ (${top} + ${base}) = ${height} 公分。`
            : `${unknown === 'base' ? '底' : '高'} = 面積${shape === 'triangle' ? ' × 2' : ''} ÷ ${unknown === 'base' ? '高' : '底'} = ${area}${shape === 'triangle' ? ' × 2' : ''} ÷ ${unknown === 'base' ? height : base} = ${answer} 公分。`;
    }
    return createNumberQuestion({
        text: unknown ? `這個${shapeName}的面積是 ${area} 平方公分，${unknown === 'base' ? '底' : '高'}是多少公分？`
            : `這個${shapeName}的面積是多少平方公分？`,
        answer,
        placeholder: `輸入${unknown ? '公分數' : '平方公分數'}`,
        meta: { ...meta, answer }
    });
};

export const createAreaUnit = (shape) => createPracticeUnit({
    id: `${shape}_area`,
    name: `${AREA_SHAPES[shape]}面積`,
    description: `辨認底與高，計算${AREA_SHAPES[shape]}面積，再反求${shape === 'trapezoid' ? '高' : '底或高'}`,
    variants: [
        { id: 'identify', weight: 20, level: 1, generate: () => createAreaQuestion(shape, 'identify') },
        { id: 'area', weight: 60, level: 1, generate: () => createAreaQuestion(shape, 'area') },
        { id: 'inverse', weight: 20, level: 2, generate: () => createAreaQuestion(shape, 'inverse') }
    ]
});

export const createAreaReviewUnit = () => createPracticeUnit({
    id: 'area_review',
    name: '面積綜合練習',
    description: '混合三種基本圖形，選擇正確的方法計算面積',
    variants: Object.keys(AREA_SHAPES).map((shape) => ({
        id: shape, weight: 1, level: 1, generate: () => createAreaQuestion(shape, 'area')
    }))
});

export const reflectPoint = (point, orientation, axis) => orientation === 'vertical'
    ? { x: 2 * axis - point.x, y: point.y }
    : { x: point.x, y: 2 * axis - point.y };

const createSymmetryQuestion = (orientation) => {
    const axis = randomInt(4, 6);
    const distance = randomInt(1, 4);
    const side = pickRandom([-1, 1]);
    const cross = randomInt(1, 9);
    const point = orientation === 'vertical'
        ? { x: axis + side * distance, y: cross }
        : { x: cross, y: axis + side * distance };
    const reflected = reflectPoint(point, orientation, axis);
    const delta = reflected.x === 0 || reflected.y === 0 ? 1
        : reflected.x === 10 || reflected.y === 10 ? -1 : pickRandom([-1, 1]);
    const wrongDistance = orientation === 'vertical'
        ? { x: reflected.x + delta, y: reflected.y }
        : { x: reflected.x, y: reflected.y + delta };
    const wrongDirection = orientation === 'vertical'
        ? { x: reflected.x, y: cross === 9 ? cross - 1 : cross + 1 }
        : { x: cross === 9 ? cross - 1 : cross + 1, y: reflected.y };
    const sameSide = orientation === 'vertical'
        ? { x: point.x, y: cross === 1 ? cross + 1 : cross - 1 }
        : { x: cross === 1 ? cross + 1 : cross - 1, y: point.y };
    const candidates = shuffle([
        { ...reflected, correct: true },
        { ...wrongDistance, misconception: 'distance' },
        { ...wrongDirection, misconception: 'direction' },
        { ...sameSide, misconception: 'same-side' }
    ]).map((candidate, index) => ({ ...candidate, label: ['A', 'B', 'C', 'D'][index] }));
    const correctValue = candidates.find((candidate) => candidate.correct).label;
    const diagram = {
        kind: 'symmetry', orientation, axis, point, candidates,
        description: `方格圖中有${orientation === 'vertical' ? '垂直' : '水平'}的虛線對稱軸、原始點 P，以及候選點 A、B、C、D。請依各點在方格中的位置作答。`
    };
    return createChoiceQuestion({
        text: '以虛線為對稱軸，P 點的對稱點是哪一個？',
        options: candidates.map(({ label }) => ({ value: label, label })),
        correctValue,
        meta: {
            promptType: 'symmetry-point', diagram, distance,
            practiceLevel: distance <= 2 ? 1 : 2,
            practiceKey: `symmetry:${orientation}:${axis}:${point.x}:${point.y}`,
            explanation: `P 點離對稱軸 ${distance} 格，對稱點也要在軸的另一側、距離 ${distance} 格，而且位於同一${orientation === 'vertical' ? '橫列' : '直行'}，所以是 ${correctValue}。`
        }
    });
};

export const createSymmetryUnit = () => createPracticeUnit({
    id: 'symmetry_points',
    name: '方格上的對稱點',
    description: '看水平或垂直對稱軸，找出方向與距離都正確的點',
    variants: [
        { id: 'vertical', weight: 50, level: 1, generate: () => createSymmetryQuestion('vertical') },
        { id: 'horizontal', weight: 50, level: 1, generate: () => createSymmetryQuestion('horizontal') }
    ]
});
