import React, { useEffect, useRef, useMemo } from 'react';
import { GAME_OBJECTS } from '../data/gameData.js';

// ── Helpers ──────────────────────────────────────────────────
function getDisplayRow(n) { return 9 - Math.floor((n - 1) / 10); }
function getDisplayCol(n) {
  const br = Math.floor((n - 1) / 10);
  return br % 2 === 0 ? (n - 1) % 10 : 9 - (n - 1) % 10;
}
function getCellNumber(dRow, col) {
  const br = 9 - dRow;
  return br * 10 + (br % 2 === 0 ? col : 9 - col) + 1;
}
function svgPos(n) {
  return { x: (getDisplayCol(n) + 0.5) * 100, y: (getDisplayRow(n) + 0.5) * 100 };
}

// ── Row palette — richer, gradient-ready ──────────────────────
const ROW_COLORS = [
  '#fce7f3', // row 0 (top)  = aulas 91-100: rosa vibrante
  '#dbeafe', // row 1        = aulas 81-90:  azul brillante
  '#dcfce7', // row 2        = aulas 71-80:  verde fresco
  '#fefce8', // row 3        = aulas 61-70:  amarillo solar
  '#ede9fe', // row 4        = aulas 51-60:  violeta suave
  '#cffafe', // row 5        = aulas 41-50:  cian luminoso
  '#fee2e2', // row 6        = aulas 31-40:  rojo suave
  '#ecfccb', // row 7        = aulas 21-30:  lima brillante
  '#ffedd5', // row 8        = aulas 11-20:  naranja cálido
  '#e0e7ff', // row 9 (bot)  = aulas 1-10:   índigo claro
];
const ROW_BORDER = [
  '#f472b6','#60a5fa','#34d399','#facc15','#a78bfa',
  '#22d3ee','#f87171','#a3e635','#fb923c','#818cf8',
];

// ── Decorative emojis per cell ────────────────────────────────
const CELL_DECORS = [
  '📚','🖥️','✏️','🎓','📐','🔬','💡','🎯','📱','🎮',
  '⚽','🎵','🎨','🚀','⭐','🌟','📷','🎲','🎪','🧩',
  '🍕','🎭','🏆','🔑','🎧','💻','📏','🧮','🔭','📡',
  '🎤','🎬','🎹','🎸','🏀','🎾','🛵','♿','🩼','🎢',
  '🔥','💎','👑','🌈','🦋','🐉','🦄','🌺','🍀','🎁',
];

// ── Number colors — saturated & punchy ───────────────────────
const NUM_COLORS = [
  '#dc2626','#ea580c','#ca8a04','#16a34a','#0284c7',
  '#7c3aed','#db2777','#0d9488','#2563eb','#7c3aed',
];

// ── SVG Snake — Premium ──────────────────────────────────────
function SnakeSVG({ snake }) {
  const h = svgPos(snake.head), t = svgPos(snake.tail);
  const dx = t.x - h.x, dy = t.y - h.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const px = (-dy / len) * 62, py = (dx / len) * 62;
  const cp1 = { x: h.x + dx * 0.28 + px, y: h.y + dy * 0.28 + py };
  const cp2 = { x: t.x - dx * 0.28 - px, y: t.y - dy * 0.28 - py };
  const d = `M${h.x},${h.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${t.x},${t.y}`;
  const ang = Math.atan2(cp1.y - h.y, cp1.x - h.x);
  const ex = Math.cos(ang), ey = Math.sin(ang);
  return (
    <g>
      {/* Drop shadow */}
      <path d={d} stroke="rgba(0,0,0,0.3)" strokeWidth="18" fill="none" strokeLinecap="round" transform="translate(3,5)" />
      {/* Outer body — dark green */}
      <path d={d} stroke="#052e16" strokeWidth="16" fill="none" strokeLinecap="round" />
      {/* Mid body */}
      <path d={d} stroke="#15803d" strokeWidth="13" fill="none" strokeLinecap="round" />
      {/* Inner highlight */}
      <path d={d} stroke="#22c55e" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* Scale dashes */}
      <path d={d} stroke="#4ade80" strokeWidth="4" fill="none" strokeLinecap="round"
        strokeDasharray="14 22" opacity="0.8" />
      {/* Bright shimmer */}
      <path d={d} stroke="rgba(187,247,208,0.45)" strokeWidth="2" fill="none" strokeLinecap="round"
        strokeDasharray="6 30" strokeDashoffset="3" />

      {/* HEAD */}
      <ellipse cx={h.x} cy={h.y} rx="17" ry="13"
        transform={`rotate(${ang * 180 / Math.PI},${h.x},${h.y})`}
        fill="#15803d" stroke="#052e16" strokeWidth="2" />
      {/* Head highlight */}
      <ellipse cx={h.x - ex*3} cy={h.y - ey*3} rx="9" ry="6"
        transform={`rotate(${ang * 180 / Math.PI},${h.x - ex*3},${h.y - ey*3})`}
        fill="rgba(74,222,128,0.35)" />
      {/* Eyes — white sclera */}
      <circle cx={h.x + ex*5 - ey*7} cy={h.y + ey*5 + ex*7} r="4" fill="white" stroke="#052e16" strokeWidth="0.8" />
      <circle cx={h.x + ex*5 + ey*7} cy={h.y + ey*5 - ex*7} r="4" fill="white" stroke="#052e16" strokeWidth="0.8" />
      {/* Eyes — pupil */}
      <circle cx={h.x + ex*6 - ey*7} cy={h.y + ey*6 + ex*7} r="2.2" fill="#1a1a1a" />
      <circle cx={h.x + ex*6 + ey*7} cy={h.y + ey*6 - ex*7} r="2.2" fill="#1a1a1a" />
      {/* Eyes — glint */}
      <circle cx={h.x + ex*5.5 - ey*6.5} cy={h.y + ey*5.5 + ex*6.5} r="0.9" fill="white" />
      <circle cx={h.x + ex*5.5 + ey*6.5} cy={h.y + ey*5.5 - ex*6.5} r="0.9" fill="white" />
      {/* Tongue — forked */}
      <line x1={h.x + ex*15} y1={h.y + ey*15} x2={h.x + ex*25 - ey*6} y2={h.y + ey*25 + ex*6}
        stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
      <line x1={h.x + ex*15} y1={h.y + ey*15} x2={h.x + ex*25 + ey*6} y2={h.y + ey*25 - ex*6}
        stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
      {/* Tongue base */}
      <line x1={h.x + ex*10} y1={h.y + ey*10} x2={h.x + ex*16} y2={h.y + ey*16}
        stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />

      {/* Tail tip */}
      <circle cx={t.x} cy={t.y} r="7" fill="#15803d" stroke="#052e16" strokeWidth="2" />
      <circle cx={t.x} cy={t.y} r="3" fill="#4ade80" />
    </g>
  );
}

// ── SVG Ladder — Premium ──────────────────────────────────────
function LadderSVG({ ladder }) {
  const b = svgPos(ladder.base), t = svgPos(ladder.top);
  const dx = t.x - b.x, dy = t.y - b.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = (-dy / len) * 13, ny = (dx / len) * 13;
  const rungs = Math.max(3, Math.round(len / 22));
  const rungColors = ['#fbbf24','#f59e0b','#fcd34d','#f59e0b','#fbbf24'];
  return (
    <g>
      {/* Shadow rails */}
      <line x1={b.x+nx+3} y1={b.y+ny+5} x2={t.x+nx+3} y2={t.y+ny+5} stroke="rgba(0,0,0,0.25)" strokeWidth="9" strokeLinecap="round" />
      <line x1={b.x-nx+3} y1={b.y-ny+5} x2={t.x-nx+3} y2={t.y-ny+5} stroke="rgba(0,0,0,0.25)" strokeWidth="9" strokeLinecap="round" />
      {/* Rails — dark base */}
      <line x1={b.x+nx} y1={b.y+ny} x2={t.x+nx} y2={t.y+ny} stroke="#78350f" strokeWidth="9" strokeLinecap="round" />
      <line x1={b.x-nx} y1={b.y-ny} x2={t.x-nx} y2={t.y-ny} stroke="#78350f" strokeWidth="9" strokeLinecap="round" />
      {/* Rails — mid shine */}
      <line x1={b.x+nx} y1={b.y+ny} x2={t.x+nx} y2={t.y+ny} stroke="#a16207" strokeWidth="5.5" strokeLinecap="round" />
      <line x1={b.x-nx} y1={b.y-ny} x2={t.x-nx} y2={t.y-ny} stroke="#a16207" strokeWidth="5.5" strokeLinecap="round" />
      {/* Rails — highlight strip */}
      <line x1={b.x+nx*0.3} y1={b.y+ny*0.3} x2={t.x+nx*0.3} y2={t.y+ny*0.3}
        stroke="rgba(251,191,36,0.55)" strokeWidth="2" strokeLinecap="round" />
      {/* Rungs */}
      {Array.from({ length: rungs }).map((_, i) => {
        const f = (i + 1) / (rungs + 1);
        const col = rungColors[i % rungColors.length];
        return <g key={i}>
          <line
            x1={b.x+dx*f+nx+2} y1={b.y+dy*f+ny+2} x2={b.x+dx*f-nx+2} y2={b.y+dy*f-ny+2}
            stroke="rgba(0,0,0,0.2)" strokeWidth="6.5" strokeLinecap="round" />
          <line
            x1={b.x+dx*f+nx} y1={b.y+dy*f+ny} x2={b.x+dx*f-nx} y2={b.y+dy*f-ny}
            stroke={col} strokeWidth="6" strokeLinecap="round" />
          <line
            x1={b.x+dx*f+nx*0.5} y1={b.y+dy*f+ny*0.5} x2={b.x+dx*f-nx*0.5} y2={b.y+dy*f-ny*0.5}
            stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
        </g>;
      })}
      {/* Base marker — green glow */}
      <circle cx={b.x} cy={b.y} r="14" fill="rgba(34,197,94,0.22)" stroke="none" />
      <circle cx={b.x} cy={b.y} r="10" fill="rgba(34,197,94,0.45)" stroke="#22c55e" strokeWidth="2.5" />
      <circle cx={b.x} cy={b.y} r="5" fill="#4ade80" />
      {/* Top marker — gold glow */}
      <circle cx={t.x} cy={t.y} r="14" fill="rgba(234,179,8,0.22)" stroke="none" />
      <circle cx={t.x} cy={t.y} r="10" fill="rgba(234,179,8,0.5)" stroke="#f59e0b" strokeWidth="2.5" />
      <circle cx={t.x} cy={t.y} r="5" fill="#fcd34d" />
    </g>
  );
}

// ── Board ─────────────────────────────────────────────────────
export default function Board({ state, myPlayerId, focusCell }) {
  const { players, board } = state;
  const scrollRef = useRef(null);

  const playersByCell = useMemo(() => {
    const m = {};
    players?.forEach(p => { (m[p.position] = m[p.position] || []).push(p); });
    return m;
  }, [players]);

  // Scroll to focus
  useEffect(() => {
    if (!scrollRef.current || !focusCell) return;
    const dRow = getDisplayRow(focusCell);
    const rowH = scrollRef.current.scrollHeight / 10;
    const viewH = scrollRef.current.clientHeight;
    scrollRef.current.scrollTo({ top: Math.max(0, dRow * rowH - viewH / 2 + rowH / 2), behavior: 'smooth' });
  }, [focusCell]);

  // Start at bottom
  useEffect(() => {
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 100);
  }, []);

  // Build cells
  const cells = [];
  for (let dRow = 0; dRow < 10; dRow++) {
    for (let col = 0; col < 10; col++) {
      const cellNum = getCellNumber(dRow, col);
      const here = playersByCell[cellNum] || [];
      const isStart = cellNum === 1, isFinish = cellNum === 100;
      const bg = isStart ? '#bfdbfe' : isFinish ? '#fef08a' : ROW_COLORS[dRow];
      const border = isStart ? '#3b82f6' : isFinish ? '#ca8a04' : ROW_BORDER[dRow];
      const numColor = NUM_COLORS[cellNum % 10];
      const decor = CELL_DECORS[cellNum % CELL_DECORS.length];

      cells.push(
        <div key={cellNum} id={`cell-${cellNum}`}
          className={`cell ${isStart ? 'cell-start' : isFinish ? 'cell-finish' : ''}`}
          style={{ background: bg, '--border-c': border }}
          data-cell={cellNum}>
          {/* Number badge */}
          <div className="cell-num-badge" style={{ background: border, color: '#fff' }}>
            {cellNum}
          </div>
          {/* Decorative emoji — hidden when player present */}
          {here.length === 0 && !isStart && !isFinish && (
            <span className="cell-decor">{decor}</span>
          )}
          {/* Start / finish */}
          {isStart  && <div className="cell-special-icon">🚀<span>INICIO</span></div>}
          {isFinish && <div className="cell-special-icon">🏆<span>META</span></div>}
          {/* Player tokens */}
          {here.length > 0 && (
            <div className="cell-tokens">
              {here.map(p => {
                const obj = GAME_OBJECTS.find(o => o.id === p.objectId);
                return (
                  <div key={p.id} className={`token-wrap ${p.id === myPlayerId ? 'token-me' : ''}`}
                    style={{ '--tc': obj?.color || '#888' }} title={p.name}>
                    <span className="token-emoji">{obj?.emoji || '🎯'}</span>
                    <span className="token-name">{p.name.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="board-viewport" ref={scrollRef}>
      <div className="board-frame-bar">
        <span>🐍 Serpientes y Escaleras UTCH</span>
        <span>🎲 Casillas 1 – 100</span>
      </div>
      <div className="board-inner">
        <div className="board-cell-grid">{cells}</div>
        {board && (
          <svg className="board-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
            {board.ladders.map(l => <LadderSVG key={l.id} ladder={l} />)}
            {board.snakes.map(s => <SnakeSVG key={s.id} snake={s} />)}
          </svg>
        )}
      </div>
    </div>
  );
}
