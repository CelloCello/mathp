import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import GeometryDiagram, { createAreaLabels, createAreaLayout, createSymmetryLayout } from './GeometryDiagram.jsx';
import PlayScreen from './PlayScreen.jsx';
import SummaryScreen from './SummaryScreen.jsx';
import { getUnitById } from '../game/categories.js';

const polygonArea = (points) => Math.abs(points.reduce((sum, [x, y], index) => {
    const next = points[(index + 1) % points.length];
    return sum + x * next[1] - y * next[0];
}, 0)) / 2;

const areaLabelBounds = ({ point: [x, y], anchor, text }) => {
    // A CJK glyph is 20 SVG units wide. Include its white outline and font metrics.
    const width = Array.from(text).length * 20;
    const left = x - (anchor === 'end' ? width : anchor === 'middle' ? width / 2 : 0);
    return { left: left - 3, right: left + width + 3, top: y - 25, bottom: y + 11 };
};

const assertClearAreaLabels = (labels, context) => {
    const bounds = labels.map(areaLabelBounds);
    for (let index = 0; index < bounds.length; index += 1) {
        const a = bounds[index];
        assert.ok(a.left >= 0 && a.right <= 400 && a.top >= 0 && a.bottom <= 290, `Label outside figure: ${context}`);
        for (let other = index + 1; other < bounds.length; other += 1) {
            const b = bounds[other];
            assert.ok(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top,
                `Overlapping ${labels[index].text}/${labels[other].text}: ${context}`);
        }
    }
};

const renderedAreaLabels = (diagram) => {
    const html = renderToStaticMarkup(<GeometryDiagram diagram={diagram} />);
    return [...html.matchAll(/<text x="([^"]+)" y="([^"]+)" text-anchor="([^"]+)" class="geometry-label">([^<]+)<\/text>/g)]
        .map(([, x, y, anchor, text]) => ({ point: [Number(x), Number(y)], anchor, text }));
};

test('narrow trapezoid height and sloping-side labels remain separate in both mirror directions', () => {
    for (const mirrored of [false, true]) {
        const diagram = {
            kind: 'area', shape: 'trapezoid', task: 'identify', unknown: null,
            base: 5, top: 2, height: 10, skew: 2, mirrored,
            segmentLabels: ['乙', '丙', '丁', '甲'], description: '梯形辨高回歸案例'
        };
        const labels = renderedAreaLabels(diagram);
        assert.equal(labels.length, 4);
        assertClearAreaLabels(labels, JSON.stringify(diagram));
        const html = renderToStaticMarkup(<GeometryDiagram diagram={diagram} />);
        assert.match(html, /class="geometry-label-leader"/);
        assert.match(html, /細引線指向字母對應的線段/);
    }
});

test('triangle external-height and narrow parallelogram labels remain readable after mirroring', () => {
    for (const shape of ['triangle', 'parallelogram']) {
        for (const skew of [-3, 3]) {
            for (const mirrored of [false, true]) {
                const diagram = {
                    kind: 'area', shape, task: 'identify', unknown: null,
                    base: 3, top: 3, height: 2, skew, mirrored,
                    segmentLabels: ['甲', '乙', '丙', '丁'], description: '窄長與外高回歸案例'
                };
                const labels = renderedAreaLabels(diagram);
                assert.equal(labels.length, 4);
                assert.equal(labels[1].text, '乙');
                assertClearAreaLabels(labels, JSON.stringify(diagram));
            }
        }
    }
});

test('all generated area dimensions and poses have non-overlapping labels for recognition, calculation and inverse tasks', () => {
    for (const shape of ['triangle', 'parallelogram', 'trapezoid']) {
        for (let base = shape === 'trapezoid' ? 5 : 3; base <= 20; base += 1) {
            const tops = shape === 'trapezoid' ? Array.from({ length: base - 2 }, (_, index) => index + 2) : [base];
            for (const top of tops) {
                for (let height = 2; height <= 20; height += 1) {
                    const area = shape === 'triangle' ? base * height / 2
                        : shape === 'trapezoid' ? (base + top) * height / 2 : base * height;
                    if (height < base / 2 || height > base * 2 || !Number.isInteger(area)) continue;
                    for (const skew of [-3, -2, -1, 1, 2, 3]) {
                        if (shape === 'triangle' && (base / 2 + skew === 0 || base / 2 + skew === base)) continue;
                        if (shape === 'trapezoid' && Math.abs(skew) === base - top) continue;
                        for (const mirrored of [false, true]) {
                            const tasks = [
                                { task: 'identify', unknown: null }, { task: 'area', unknown: null },
                                { task: 'inverse', unknown: 'height' },
                                ...(shape === 'trapezoid' ? [] : [{ task: 'inverse', unknown: 'base' }])
                            ];
                            for (const { task, unknown } of tasks) {
                                const diagram = {
                                    kind: 'area', shape, base, top, height, skew, mirrored, task, unknown,
                                    segmentLabels: ['甲', '乙', '丙', '丁']
                                };
                                const context = JSON.stringify(diagram);
                                let labels;
                                assert.doesNotThrow(() => { labels = createAreaLabels(diagram); }, context);
                                assert.equal(labels.length, task === 'identify' ? 4 : shape === 'trapezoid' ? 3 : 2);
                                assertClearAreaLabels(labels, context);
                                const heightLabel = labels.find((label) => label.id === 'height');
                                if (task === 'identify') {
                                    const { heightStart, foot } = createAreaLayout(diagram);
                                    assert.equal(heightLabel.leader.to[0], foot[0], context);
                                    assert.ok(heightLabel.leader.to[1] > heightStart[1] && heightLabel.leader.to[1] < foot[1], context);
                                } else {
                                    assert.equal(heightLabel.leader, undefined);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
});

test('rendered polygons preserve the labelled dimensions and have just one perpendicular height candidate', () => {
    for (const shape of ['triangle', 'parallelogram', 'trapezoid']) {
        const unit = getUnitById('area', `${shape}_area`);
        for (let index = 0; index < 200; index += 1) {
            const question = unit.generateQuestion();
            const d = question.meta.diagram;
            const { points, scale, heightStart, foot } = createAreaLayout(d);
            const actual = polygonArea(points) / scale ** 2;
            const expected = shape === 'triangle' ? d.base * d.height / 2
                : shape === 'trapezoid' ? (d.base + d.top) * d.height / 2 : d.base * d.height;
            assert.ok(Math.abs(actual - expected) < 0.000001);
            assert.ok(Math.abs(Math.abs(points[0][0] - points[1][0]) / scale - d.base) < 0.000001);
            assert.ok(Math.abs((foot[1] - heightStart[1]) / scale - d.height) < 0.000001);
            assert.equal(heightStart[0], foot[0]);
            assert.equal(points[0][1], points[1][1]);
            // None of the sloping sides can accidentally be another valid height.
            for (let i = 0; i < points.length; i += 1) {
                assert.notEqual(points[i][0], points[(i + 1) % points.length][0]);
            }
            assert.ok(points.every(([x, y]) => x >= 60 && x <= 340 && y >= 60 && y <= 205));
        }
    }
});

test('inverse area diagrams hide the unknown length in text and accessible descriptions', () => {
    for (const shape of ['triangle', 'parallelogram', 'trapezoid']) {
        const unit = getUnitById('area', `${shape}_area`);
        for (let index = 0; index < 40; index += 1) {
            const question = unit.generateQuestion({ variantId: 'inverse' });
            const d = question.meta.diagram;
            const html = renderToStaticMarkup(<GeometryDiagram diagram={d} />);
            assert.match(html, /role="img"/);
            assert.match(html, /aria-labelledby=/);
            assert.match(html, /？公分/);
            assert.ok(!html.includes(`${d.unknown === 'base' ? '底' : '高'} ${d[d.unknown]} 公分`));
            assert.match(html, /未知/);
        }
    }
});

test('symmetry labels avoid all five points and each other even at dense and boundary positions', () => {
    const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const unit = getUnitById('symmetry', 'symmetry_points');
    for (const variantId of ['vertical', 'horizontal']) {
        for (let index = 0; index < 2000; index += 1) {
            const d = unit.generateQuestion({ variantId }).meta.diagram;
            const labels = createSymmetryLayout(d);
            assert.equal(labels.length, 5);
            for (const label of labels) {
                assert.ok(label.bounds.left >= 4 && label.bounds.right <= 366 && label.bounds.top >= 4 && label.bounds.bottom <= 306);
                for (const other of labels) {
                    if (other !== label) assert.equal(intersects(label.bounds, other.bounds), false);
                    assert.equal(intersects(label.bounds, { left: other.cx - 8, right: other.cx + 8, top: other.cy - 8, bottom: other.cy + 8 }), false);
                }
            }
        }
    }
    // Regression: the original desktop capture's adjacent candidates collided.
    const dense = {
        point: { x: 1, y: 3 },
        candidates: [{ x: 2, y: 5, label: 'A' }, { x: 1, y: 4, label: 'B' }, { x: 1, y: 5, label: 'C' }, { x: 2, y: 3, label: 'D' }]
    };
    assert.equal(createSymmetryLayout(dense).length, 5);
});

test('both play and wrong-answer review render the original diagram, labels and explanation', () => {
    for (const [categoryId, unitId] of [['area', 'trapezoid_area'], ['symmetry', 'symmetry_points']]) {
        const question = getUnitById(categoryId, unitId).generateQuestion();
        const play = renderToStaticMarkup(<PlayScreen categoryId={categoryId} unitId={unitId} questions={[question]} />);
        const summary = renderToStaticMarkup(<SummaryScreen result={{
            categoryName: '練習', unitName: '圖形', correct: 0, wrong: 1, total: 1, timeSpentMs: 1000,
            wrongList: [{ text: question.text, questionMeta: question.meta, userAnswer: '錯誤', correctAnswer: '正確' }]
        }} />);
        assert.match(play, /<svg/);
        assert.match(summary, /<svg/);
        assert.match(summary, /practice-explanation/);
        if (categoryId === 'symmetry') {
            for (const label of ['P', 'A', 'B', 'C', 'D']) {
                assert.ok(play.includes(`>${label}</text>`));
                assert.ok(summary.includes(`>${label}</text>`));
            }
        }
    }
    assert.equal(renderToStaticMarkup(<GeometryDiagram />), '');
});
