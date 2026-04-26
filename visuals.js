function createSvg(size) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('fill', 'none');
  return svg;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function intRand(min, max) {
  return Math.floor(rand(min, max + 1));
}

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildVariants(factory, configs) {
  return configs.map((config) => (size) => factory(size, config));
}

function addLine(ns, svg, x1, y1, x2, y2, stroke, width, cap = 'round') {
  const line = document.createElementNS(ns, 'line');
  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', stroke);
  line.setAttribute('stroke-width', width);
  line.setAttribute('stroke-linecap', cap);
  svg.appendChild(line);
  return line;
}

function addCircle(ns, svg, cx, cy, r, fill, stroke, strokeWidth) {
  const circle = document.createElementNS(ns, 'circle');
  circle.setAttribute('cx', cx);
  circle.setAttribute('cy', cy);
  circle.setAttribute('r', r);
  if (fill) circle.setAttribute('fill', fill);
  if (stroke) circle.setAttribute('stroke', stroke);
  if (strokeWidth != null) circle.setAttribute('stroke-width', strokeWidth);
  svg.appendChild(circle);
  return circle;
}

function addRect(ns, svg, x, y, w, h, stroke, strokeWidth, fill = 'none', extra = '') {
  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('x', x);
  rect.setAttribute('y', y);
  rect.setAttribute('width', w);
  rect.setAttribute('height', h);
  rect.setAttribute('stroke', stroke);
  rect.setAttribute('stroke-width', strokeWidth);
  rect.setAttribute('fill', fill);
  if (extra) rect.setAttribute('transform', extra);
  svg.appendChild(rect);
  return rect;
}

function addPath(ns, svg, d, stroke, width, fill = 'none', extraAttrs = {}) {
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', d);
  path.setAttribute('stroke', stroke);
  path.setAttribute('stroke-width', width);
  path.setAttribute('fill', fill);
  Object.entries(extraAttrs).forEach(([key, value]) => path.setAttribute(key, value));
  svg.appendChild(path);
  return path;
}

function polar(cx, cy, r, angle) {
  return {
    x: cx + Math.cos(angle) * r,
    y: cy + Math.sin(angle) * r,
  };
}

function makeRings(size, config) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = createSvg(size);
  const cx = size / 2 + rand(-config.offset, config.offset);
  const cy = size / 2 + rand(-config.offset, config.offset);
  const count = intRand(config.countMin, config.countMax);

  for (let i = count; i >= 1; i--) {
    const ring = document.createElementNS(ns, 'ellipse');
    const radius = (i / count) * config.radiusMax;
    ring.setAttribute('cx', cx);
    ring.setAttribute('cy', cy);
    ring.setAttribute('rx', radius * config.rxScale);
    ring.setAttribute('ry', radius * config.ryScale);
    ring.setAttribute('stroke', `rgba(200,200,200,${rand(config.opacityMin, config.opacityMax)})`);
    ring.setAttribute('stroke-width', config.strokeWidth);
    ring.setAttribute('fill', Math.random() < config.fillChance ? `rgba(200,200,200,${config.fillOpacity})` : 'none');
    if (Math.random() < config.dashChance) {
      const dash = rand(config.dashMin, config.dashMax);
      ring.setAttribute('stroke-dasharray', `${dash} ${dash * config.dashSpread}`);
    }
    if (config.rotationMax) {
      ring.setAttribute('transform', `rotate(${rand(-config.rotationMax, config.rotationMax)} ${cx} ${cy})`);
    }
    svg.appendChild(ring);
  }

  return svg;
}

function makeSpokes(size, config) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = createSvg(size);
  const cx = size / 2 + rand(-config.offset, config.offset);
  const cy = size / 2 + rand(-config.offset, config.offset);
  const count = intRand(config.countMin, config.countMax);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand(-config.angleJitter, config.angleJitter);
    const inner = rand(config.innerMin, config.innerMax);
    const outer = rand(config.outerMin, config.outerMax);
    const mid = rand(config.midMin, config.midMax);
    addLine(
      ns,
      svg,
      cx + Math.cos(angle) * inner,
      cy + Math.sin(angle) * inner,
      cx + Math.cos(angle) * outer,
      cy + Math.sin(angle) * outer,
      `rgba(200,200,200,${rand(config.opacityMin, config.opacityMax)})`,
      Math.random() < config.thickChance ? config.thickWidth : config.thinWidth
    );

    if (config.doubleLayer) {
      const a2 = angle + Math.PI / count;
      addLine(
        ns,
        svg,
        cx + Math.cos(a2) * config.innerMin * 0.6,
        cy + Math.sin(a2) * config.innerMin * 0.6,
        cx + Math.cos(a2) * mid,
        cy + Math.sin(a2) * mid,
        `rgba(200,200,200,${rand(config.opacityMin * 0.7, config.opacityMax * 0.75)})`,
        0.5
      );
    }
  }

  if (config.centerDot) {
    addCircle(
      ns,
      svg,
      cx,
      cy,
      config.centerDot,
      `rgba(200,200,200,${config.centerDotOpacity})`
    );
  }

  return svg;
}

function makeDotFields(size, config) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = createSvg(size);
  const cols = config.cols;
  const rows = config.rows;
  const sx = size / (cols + 1);
  const sy = size / (rows + 1);

  for (let x = 1; x <= cols; x++) {
    for (let y = 1; y <= rows; y++) {
      const cx = x - cols / 2;
      const cy = y - rows / 2;
      const dist = Math.hypot(cx, cy);
      const falloff = 1 - dist / Math.hypot(cols / 2, rows / 2);
      const px = x * sx + rand(-config.jitter, config.jitter) * sx + (config.stagger && y % 2 ? sx * 0.35 : 0);
      const py = y * sy + rand(-config.jitter, config.jitter) * sy;
      const opacity = config.opacityMin + falloff * (config.opacityMax - config.opacityMin);
      const sizeScale = config.sizeMin + falloff * (config.sizeMax - config.sizeMin);

      if (config.mode === 'rect') {
        const rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('x', px - sizeScale / 2);
        rect.setAttribute('y', py - sizeScale / 2);
        rect.setAttribute('width', sizeScale);
        rect.setAttribute('height', sizeScale);
        rect.setAttribute('rx', config.rounded ? sizeScale * 0.35 : 0);
        rect.setAttribute('fill', `rgba(200,200,200,${opacity})`);
        svg.appendChild(rect);
      } else if (config.mode === 'diamond') {
        const path = document.createElementNS(ns, 'path');
        const half = sizeScale * 0.7;
        const d = [
          `M ${px} ${py - half}`,
          `L ${px + half} ${py}`,
          `L ${px} ${py + half}`,
          `L ${px - half} ${py}`,
          'Z',
        ].join(' ');
        path.setAttribute('d', d);
        path.setAttribute('fill', `rgba(200,200,200,${opacity})`);
        svg.appendChild(path);
      } else {
        addCircle(ns, svg, px, py, sizeScale, `rgba(200,200,200,${opacity})`);
      }
    }
  }

  return svg;
}

function makeWaves(size, config) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = createSvg(size);
  const count = intRand(config.countMin, config.countMax);
  const step = config.step;
  const axis = config.axis;
  const start = config.startMin;
  const end = config.startMax;

  for (let i = 0; i < count; i++) {
    const base = start + (i / Math.max(count - 1, 1)) * (end - start);
    const amp = rand(config.amplitudeMin, config.amplitudeMax);
    const freq = rand(config.frequencyMin, config.frequencyMax);
    const phase = rand(0, Math.PI * 2);
    let d = axis === 'vertical' ? `M ${base} 10` : `M 10 ${base}`;

    if (axis === 'vertical') {
      for (let y = 10; y <= size - 10; y += step) {
        const x = base + Math.sin(y * freq + phase) * amp;
        d += ` L ${x} ${y}`;
      }
    } else {
      for (let x = 10; x <= size - 10; x += step) {
        const y = base + Math.sin(x * freq + phase) * amp;
        d += ` L ${x} ${y}`;
      }
    }

    addPath(
      ns,
      svg,
      d,
      `rgba(200,200,200,${rand(config.opacityMin, config.opacityMax)})`,
      config.strokeWidth,
      'none',
      { 'stroke-linecap': 'round' }
    );

    if (config.mirror) {
      const offset = axis === 'vertical' ? size - base : size - base;
      let md = axis === 'vertical' ? `M ${offset} 10` : `M 10 ${offset}`;
      const mirrorPhase = phase + Math.PI / 2;
      const mirrorAmp = amp * config.mirrorScale;

      if (axis === 'vertical') {
        for (let y = 10; y <= size - 10; y += step) {
          const x = offset + Math.sin(y * freq + mirrorPhase) * mirrorAmp;
          md += ` L ${x} ${y}`;
        }
      } else {
        for (let x = 10; x <= size - 10; x += step) {
          const y = offset + Math.sin(x * freq + mirrorPhase) * mirrorAmp;
          md += ` L ${x} ${y}`;
        }
      }

      addPath(
        ns,
        svg,
        md,
        `rgba(200,200,200,${rand(config.opacityMin, config.opacityMax) * 0.75})`,
        config.strokeWidth * 0.85,
        'none',
        { 'stroke-linecap': 'round' }
      );
    }
  }

  return svg;
}

function makeFrames(size, config) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = createSvg(size);
  const count = intRand(config.countMin, config.countMax);

  for (let i = count; i >= 1; i--) {
    const inset = (i / count) * config.maxInset;
    const width = size - inset * 2;
    const height = size - inset * 2;
    const opacity = rand(config.opacityMin, config.opacityMax) * (i / count);
    const cx = size / 2 + rand(-config.offset, config.offset);
    const cy = size / 2 + rand(-config.offset, config.offset);

    if (config.mode === 'diamond') {
      const half = Math.min(width, height) / 2;
      const d = [
        `M ${cx} ${cy - half}`,
        `L ${cx + half} ${cy}`,
        `L ${cx} ${cy + half}`,
        `L ${cx - half} ${cy}`,
        'Z',
      ].join(' ');
      addPath(
        ns,
        svg,
        d,
        `rgba(200,200,200,${opacity})`,
        config.strokeWidth,
        'none',
        { transform: `rotate(${rand(-config.rotationMax, config.rotationMax)} ${cx} ${cy})` }
      );
    } else {
      addRect(
        ns,
        svg,
        cx - width / 2,
        cy - height / 2,
        width,
        height,
        `rgba(200,200,200,${opacity})`,
        config.strokeWidth,
        'none',
        `rotate(${rand(-config.rotationMax, config.rotationMax)} ${cx} ${cy}) skewX(${rand(-config.skewMax, config.skewMax)}) skewY(${rand(-config.skewMax, config.skewMax)})`
      );
    }
  }

  return svg;
}

function makeSpirals(size, config) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = createSvg(size);
  const cx = size / 2 + rand(-config.offset, config.offset);
  const cy = size / 2 + rand(-config.offset, config.offset);
  const arms = config.arms;

  for (let arm = 0; arm < arms; arm++) {
    const direction = config.clockwise ? 1 : -1;
    const phase = (arm / arms) * Math.PI * 2;
    const turns = config.turns + rand(-config.turnJitter, config.turnJitter);
    const step = config.step;
    const a = config.innerRadius;
    const b = config.spread / (Math.PI * 2);
    let d = '';

    for (let t = 0; t <= turns * Math.PI * 2; t += step) {
      const theta = phase + direction * t;
      const r = a + b * t;
      const p = polar(cx, cy, r, theta);
      d += d ? ` L ${p.x} ${p.y}` : `M ${p.x} ${p.y}`;
    }

    addPath(
      ns,
      svg,
      d,
      `rgba(200,200,200,${rand(config.opacityMin, config.opacityMax)})`,
      config.strokeWidth,
      'none',
      { 'stroke-linecap': 'round' }
    );
  }

  if (config.centerDot) {
    addCircle(ns, svg, cx, cy, config.centerDot, `rgba(200,200,200,${config.centerDotOpacity})`);
  }

  return svg;
}

function makeArcs(size, config) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = createSvg(size);
  const cx = size / 2 + rand(-config.offset, config.offset);
  const cy = size / 2 + rand(-config.offset, config.offset);
  const count = intRand(config.countMin, config.countMax);

  for (let i = count; i >= 1; i--) {
    const r = (i / count) * config.radiusMax;
    const start = rand(0, Math.PI * 2);
    const span = rand(config.spanMin, config.spanMax);
    const end = start + span;
    const p1 = polar(cx, cy, r, start);
    const p2 = polar(cx, cy, r, end);
    const largeArc = span > Math.PI ? 1 : 0;
    const sweep = config.sweep;
    const d = `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y}`;
    addPath(
      ns,
      svg,
      d,
      `rgba(200,200,200,${rand(config.opacityMin, config.opacityMax)})`,
      config.strokeWidth,
      'none',
      { 'stroke-linecap': 'round' }
    );

    if (config.broken && Math.random() < 0.6) {
      const split = rand(0.2, 0.8);
      const mid = start + span * split;
      const m1 = polar(cx, cy, r, start);
      const m2 = polar(cx, cy, r, mid - 0.04);
      const m3 = polar(cx, cy, r, mid + 0.04);
      const m4 = polar(cx, cy, r, end);
      addPath(
        ns,
        svg,
        `M ${m1.x} ${m1.y} A ${r} ${r} 0 ${span > Math.PI ? 1 : 0} ${sweep} ${m2.x} ${m2.y}`,
        `rgba(200,200,200,${rand(config.opacityMin, config.opacityMax) * 0.8})`,
        config.strokeWidth * 0.8,
        'none'
      );
      addPath(
        ns,
        svg,
        `M ${m3.x} ${m3.y} A ${r} ${r} 0 ${span > Math.PI ? 1 : 0} ${sweep} ${m4.x} ${m4.y}`,
        `rgba(200,200,200,${rand(config.opacityMin, config.opacityMax) * 0.8})`,
        config.strokeWidth * 0.8,
        'none'
      );
    }
  }

  return svg;
}

function makeNetworks(size, config) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = createSvg(size);
  const points = [];
  const margin = config.margin;
  const count = intRand(config.nodeMin, config.nodeMax);

  for (let i = 0; i < count; i++) {
    points.push({
      x: rand(margin, size - margin),
      y: rand(margin, size - margin),
      r: rand(config.nodeRadiusMin, config.nodeRadiusMax),
    });
  }

  points.forEach((point, index) => {
    const neighbors = points
      .map((other, otherIndex) => ({
        other,
        otherIndex,
        dist: Math.hypot(point.x - other.x, point.y - other.y),
      }))
      .filter((entry) => entry.otherIndex !== index)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, config.linksPerNode);

    neighbors.forEach((neighbor) => {
      addLine(
        ns,
        svg,
        point.x,
        point.y,
        neighbor.other.x,
        neighbor.other.y,
        `rgba(200,200,200,${rand(config.opacityMin, config.opacityMax)})`,
        config.strokeWidth
      );
    });
  });

  if (config.hull) {
    const sorted = [...points].sort((a, b) => a.x - b.x);
    const top = sorted.slice(0, Math.max(3, Math.floor(sorted.length / 2)));
    const bottom = [...sorted].reverse().slice(0, Math.max(3, Math.floor(sorted.length / 2)));
    const strip = [...top, ...bottom].map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    addPath(
      ns,
      svg,
      strip,
      `rgba(200,200,200,${config.hullOpacity})`,
      config.strokeWidth * 0.8,
      'none'
    );
  }

  points.forEach((point) => {
    addCircle(ns, svg, point.x, point.y, point.r, `rgba(200,200,200,${config.nodeOpacity})`);
  });

  return svg;
}

function makeRain(size, config) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = createSvg(size);
  const count = intRand(config.countMin, config.countMax);

  for (let i = 0; i < count; i++) {
    const x = rand(10, size - 10);
    const y1 = rand(8, 50);
    const len = rand(config.lenMin, config.lenMax);
    const drift = rand(-config.drift, config.drift);
    const y2 = y1 + len;
    const x2 = x + drift;
    addLine(
      ns,
      svg,
      x,
      y1,
      x2,
      y2,
      `rgba(200,200,200,${rand(config.opacityMin, config.opacityMax)})`,
      rand(config.strokeMin, config.strokeMax)
    );

    if (Math.random() < config.dropChance) {
      addCircle(ns, svg, x2, y2, rand(0.4, 1.2), `rgba(200,200,200,${config.dropOpacity})`);
    }
  }

  if (config.haze) {
    addCircle(ns, svg, size / 2, size / 2, config.haze, `rgba(200,200,200,${config.hazeOpacity})`);
  }

  return svg;
}

function makeShards(size, config) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = createSvg(size);
  const count = intRand(config.countMin, config.countMax);

  for (let i = 0; i < count; i++) {
    const cx = size / 2 + rand(-config.centerSpread, config.centerSpread);
    const cy = size / 2 + rand(-config.centerSpread, config.centerSpread);
    const points = [];
    const verts = intRand(config.vertMin, config.vertMax);
    const baseR = rand(config.radiusMin, config.radiusMax);

    for (let j = 0; j < verts; j++) {
      const angle = (j / verts) * Math.PI * 2 + rand(-config.angleJitter, config.angleJitter);
      const radius = baseR * rand(config.radiusMinScale, config.radiusMaxScale);
      const p = polar(cx, cy, radius, angle);
      points.push(`${p.x},${p.y}`);
    }

    const poly = document.createElementNS(ns, config.mode === 'line' ? 'polyline' : 'polygon');
    poly.setAttribute('points', points.join(' '));
    poly.setAttribute('stroke', `rgba(200,200,200,${rand(config.opacityMin, config.opacityMax)})`);
    poly.setAttribute('stroke-width', config.strokeWidth);
    poly.setAttribute('fill', config.mode === 'line' ? 'none' : `rgba(200,200,200,${config.fillOpacity})`);
    if (config.rotateMax) {
      poly.setAttribute('transform', `rotate(${rand(-config.rotateMax, config.rotateMax)} ${cx} ${cy})`);
    }
    svg.appendChild(poly);
  }

  return svg;
}

function buildRingConfigs() {
  return Array.from({ length: 5 }, (_, i) => ({
    countMin: 5 + i,
    countMax: 8 + i,
    radiusMax: 68 + i * 4,
    rxScale: 1 + i * 0.03,
    ryScale: 0.82 + i * 0.02,
    offset: i % 2 ? 2 : 4,
    dashChance: 0.18 + i * 0.08,
    dashMin: 2,
    dashMax: 9,
    dashSpread: 1.4 + i * 0.08,
    opacityMin: 0.07 + i * 0.01,
    opacityMax: 0.2 + i * 0.02,
    strokeWidth: i % 2 ? 0.5 : 0.35,
    fillChance: i === 3 ? 0.35 : 0.08,
    fillOpacity: 0.04 + i * 0.01,
    rotationMax: i % 2 ? 5 : 0,
  }));
}

function buildSpokeConfigs() {
  return Array.from({ length: 5 }, (_, i) => ({
    countMin: 18 + i * 2,
    countMax: 26 + i * 3,
    innerMin: 8 + i * 2,
    innerMax: 22 + i * 3,
    outerMin: 52 + i * 4,
    outerMax: 88 + i * 5,
    midMin: 24 + i * 2,
    midMax: 44 + i * 3,
    offset: i % 3 ? 1 : 4,
    angleJitter: 0.05 + i * 0.012,
    opacityMin: 0.08 + i * 0.01,
    opacityMax: 0.22 + i * 0.015,
    thickChance: 0.25 + i * 0.08,
    thickWidth: 1,
    thinWidth: 0.45,
    doubleLayer: i >= 2,
    centerDot: i % 2 ? 1.3 : 2.2,
    centerDotOpacity: 0.12 + i * 0.02,
  }));
}

function buildDotConfigs() {
  return Array.from({ length: 5 }, (_, i) => ({
    cols: 7 + i * 2,
    rows: 7 + (i % 3) * 2,
    jitter: 0.18 + i * 0.05,
    sizeMin: 0.4 + i * 0.08,
    sizeMax: 1.5 + i * 0.25,
    opacityMin: 0.07 + i * 0.01,
    opacityMax: 0.16 + i * 0.03,
    mode: choose(['circle', 'rect', 'diamond']),
    rounded: i % 2 === 0,
    stagger: i % 2 === 1,
  }));
}

function buildWaveConfigs() {
  return Array.from({ length: 5 }, (_, i) => ({
    countMin: 4 + i,
    countMax: 6 + i * 2,
    startMin: 18 + i * 3,
    startMax: 180 - i * 3,
    amplitudeMin: 10 + i * 2,
    amplitudeMax: 24 + i * 4,
    frequencyMin: 0.008 + i * 0.0015,
    frequencyMax: 0.02 + i * 0.002,
    step: 4,
    axis: i % 2 === 0 ? 'horizontal' : 'vertical',
    opacityMin: 0.08 + i * 0.01,
    opacityMax: 0.18 + i * 0.02,
    strokeWidth: i % 2 ? 0.75 : 0.55,
    mirror: i >= 2,
    mirrorScale: 0.68 + i * 0.08,
  }));
}

function buildFrameConfigs() {
  return Array.from({ length: 5 }, (_, i) => ({
    countMin: 4 + i,
    countMax: 6 + i,
    maxInset: 82 + i * 6,
    offset: i % 2 ? 1.5 : 3,
    rotationMax: 2 + i * 1.8,
    skewMax: i % 2 === 0 ? i * 0.8 : 0,
    strokeWidth: i % 2 ? 0.5 : 0.4,
    opacityMin: 0.08 + i * 0.01,
    opacityMax: 0.22 + i * 0.015,
    mode: i === 0 || i === 3 ? 'diamond' : 'rect',
  }));
}

function buildSpiralConfigs() {
  return Array.from({ length: 5 }, (_, i) => ({
    arms: 1 + (i % 3),
    turns: 2 + i * 0.5,
    turnJitter: 0.15 + i * 0.05,
    step: 0.09 + i * 0.01,
    innerRadius: 4 + i * 2,
    spread: 10 + i * 5,
    clockwise: i % 2 === 0,
    offset: i % 3 ? 0 : 3,
    opacityMin: 0.08 + i * 0.01,
    opacityMax: 0.2 + i * 0.02,
    strokeWidth: i % 2 ? 0.7 : 0.55,
    centerDot: i % 2 ? 0 : 1.5,
    centerDotOpacity: 0.14,
  }));
}

function buildArcConfigs() {
  return Array.from({ length: 5 }, (_, i) => ({
    countMin: 5 + i,
    countMax: 8 + i,
    radiusMax: 82 + i * 7,
    spanMin: 0.6 + i * 0.2,
    spanMax: 2.4 + i * 0.4,
    sweep: i % 2,
    offset: i % 3 ? 0 : 3,
    broken: i >= 2,
    opacityMin: 0.08 + i * 0.01,
    opacityMax: 0.2 + i * 0.02,
    strokeWidth: i % 2 ? 0.65 : 0.5,
  }));
}

function buildNetworkConfigs() {
  return Array.from({ length: 5 }, (_, i) => ({
    nodeMin: 8 + i * 2,
    nodeMax: 12 + i * 3,
    nodeRadiusMin: 0.6 + i * 0.1,
    nodeRadiusMax: 1.8 + i * 0.25,
    linksPerNode: 2 + (i % 3),
    margin: 18 + i * 2,
    opacityMin: 0.08 + i * 0.008,
    opacityMax: 0.18 + i * 0.02,
    strokeWidth: i % 2 ? 0.5 : 0.4,
    nodeOpacity: 0.2 + i * 0.03,
    hull: i >= 2,
    hullOpacity: 0.07 + i * 0.01,
  }));
}

function buildRainConfigs() {
  return Array.from({ length: 5 }, (_, i) => ({
    countMin: 34 + i * 10,
    countMax: 54 + i * 12,
    lenMin: 18 + i * 4,
    lenMax: 42 + i * 6,
    drift: 1.5 + i * 0.8,
    strokeMin: 0.35,
    strokeMax: 0.85,
    opacityMin: 0.08 + i * 0.01,
    opacityMax: 0.2 + i * 0.02,
    dropChance: 0.12 + i * 0.08,
    dropOpacity: 0.16 + i * 0.02,
    haze: i >= 3 ? 74 : 0,
    hazeOpacity: 0.03 + i * 0.005,
  }));
}

function buildShardConfigs() {
  return Array.from({ length: 5 }, (_, i) => ({
    countMin: 6 + i,
    countMax: 9 + i * 2,
    centerSpread: 18 + i * 6,
    vertMin: 3,
    vertMax: 6 + i,
    radiusMin: 0.35,
    radiusMax: 0.9,
    radiusMinScale: 0.8,
    radiusMaxScale: 1.5 + i * 0.1,
    angleJitter: 0.15 + i * 0.04,
    opacityMin: 0.08 + i * 0.01,
    opacityMax: 0.2 + i * 0.02,
    strokeWidth: i % 2 ? 0.55 : 0.45,
    fillOpacity: 0.03 + i * 0.01,
    rotateMax: i % 2 ? 6 + i : 0,
    mode: i >= 3 ? 'line' : 'fill',
  }));
}

const visualGenerators = [
  ...buildVariants(makeRings, buildRingConfigs()),
  ...buildVariants(makeSpokes, buildSpokeConfigs()),
  ...buildVariants(makeDotFields, buildDotConfigs()),
  ...buildVariants(makeWaves, buildWaveConfigs()),
  ...buildVariants(makeFrames, buildFrameConfigs()),
  ...buildVariants(makeSpirals, buildSpiralConfigs()),
  ...buildVariants(makeArcs, buildArcConfigs()),
  ...buildVariants(makeNetworks, buildNetworkConfigs()),
  ...buildVariants(makeRain, buildRainConfigs()),
  ...buildVariants(makeShards, buildShardConfigs()),
];

function generateVisual() {
  const size = 220;
  const generator = choose(visualGenerators);
  return generator(size);
}
