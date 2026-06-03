import React, { useState, useEffect } from 'react';

const DICE_EMOJIS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const DICE_NUMS   = [1, 2, 3, 4, 5, 6];

// Dot positions for each face
const DOTS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 22], [75, 22], [25, 50], [75, 50], [25, 78], [75, 78]],
};

function DieFace({ value, size = 100, glowing = false, spinning = false }) {
  const dots = DOTS[value] || DOTS[1];
  const dotR = size * 0.09;
  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100"
      className={`die-svg ${glowing ? 'die-glow' : ''} ${spinning ? 'die-spinning' : ''}`}
      aria-label={`Dado: ${value}`}
    >
      <defs>
        <linearGradient id="diceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d4d0f0" />
        </linearGradient>
        <filter id="diceShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.4)" />
        </filter>
        {glowing && (
          <filter id="diceGlow" x="-20%" y="-20%" width="150%" height="150%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>
      {/* Die body */}
      <rect x="5" y="5" width="90" height="90" rx="18" ry="18"
        fill="url(#diceGrad)" filter="url(#diceShadow)" />
      {/* Border */}
      <rect x="5" y="5" width="90" height="90" rx="18" ry="18"
        fill="none" stroke={glowing ? '#a78bfa' : '#9ca3af'} strokeWidth="2" />
      {/* Top shine */}
      <rect x="12" y="8" width="55" height="18" rx="8" fill="rgba(255,255,255,0.6)" />
      {/* Dots */}
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={dotR}
          fill={glowing ? '#4c1d95' : '#1e1b4b'} />
      ))}
    </svg>
  );
}

export default function Dice({ isMyTurn, onRoll, rolling, result }) {
  const [displayVal, setDisplayVal] = useState(1);
  const [frame, setFrame] = useState(0);

  // Animate randomize while rolling
  useEffect(() => {
    if (!rolling) return;
    const id = setInterval(() => setDisplayVal(Math.ceil(Math.random() * 6)), 80);
    return () => clearInterval(id);
  }, [rolling]);

  // Show result when done
  useEffect(() => {
    if (!rolling && result) setDisplayVal(result);
  }, [rolling, result]);

  const handleClick = () => {
    if (!isMyTurn || rolling) return;
    onRoll();
  };

  return (
    <div className="dice-container">
      <div
        id="dice"
        className={`die-wrapper ${isMyTurn && !rolling ? 'die-clickable' : ''}`}
        onClick={handleClick}
        role="button"
        aria-label="Tirar dado"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleClick()}
      >
        <DieFace
          value={displayVal}
          size={120}
          glowing={isMyTurn && !rolling}
          spinning={rolling}
        />
      </div>
      {isMyTurn && !rolling && (
        <p className="dice-hint">🎲 ¡Toca para tirar!</p>
      )}
      {rolling && (
        <p className="dice-hint" style={{ color: 'var(--pink)' }}>⚡ Tirando...</p>
      )}
      {!rolling && result && (
        <p className="dice-result">Sacaste un <strong style={{ fontSize: '18px', color: 'var(--purple-l)' }}>{result}</strong></p>
      )}
    </div>
  );
}
