import React, { useEffect, useRef, useState } from 'react';

const TIMER_SECS = 45;

export default function ChallengeModal({
  challenge,
  activePlayerId,
  myPlayerId,
  players,
  votes,
  onVote,
  result,
  myVote,
  isHostView = false,
}) {
  const [timeLeft, setTimeLeft] = useState(TIMER_SECS);
  const [localVote, setLocalVote] = useState(null);
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const intervalRef = useRef(null);

  const isActivePlayer = myPlayerId === activePlayerId;
  const activePlayer = players?.find(p => p.id === activePlayerId);
  const canVote = !isHostView && !isActivePlayer && onVote;

  const upVotes = Object.values(votes || {}).filter(v => v === 'up').length;
  const downVotes = Object.values(votes || {}).filter(v => v === 'down').length;
  const totalVoters = Math.max(1, (players?.length || 1) - 1);

  // ── Timer ──────────────────────────────────────────────
  useEffect(() => {
    setTimeLeft(TIMER_SECS);
    setLocalVote(null);
    setCoinFlipping(false);
    setShowAnswer(false);

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [challenge?.id]);

  // ── Coin flip on result ──────────────────────────────────
  useEffect(() => {
    if (result?.coinFlip) {
      setCoinFlipping(true);
      const t = setTimeout(() => setCoinFlipping(false), 1500);
      return () => clearTimeout(t);
    }
  }, [result]);

  const handleVote = (direction) => {
    if (!canVote || localVote) return;
    setLocalVote(direction);
    onVote(direction);
  };

  // ── Timer circle ────────────────────────────────────────
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / TIMER_SECS) * circumference;
  const timerColor = timeLeft > 20 ? '#22c55e' : timeLeft > 10 ? '#eab308' : '#ef4444';

  if (!challenge && !result) return null;

  // ══════════════════════════════════════════════════════
  //  RESULT SCREEN
  // ══════════════════════════════════════════════════════
  if (result) {
    return (
      <div className="challenge-overlay">
        <div className="challenge-modal result-modal">
          <div className="result-icon">
            {result.direction === 'up' ? '📈' : '📉'}
          </div>
          <h2 className="result-title">
            {result.coinFlip
              ? coinFlipping
                ? '🪙 Lanzando moneda...'
                : (result.direction === 'up' ? '🪙 ¡CARA! — Sube 5' : '🪙 ¡CRUZ! — Baja 5')
              : result.direction === 'up'
                ? '¡Correcto! Sube 5 casillas 🎉'
                : 'Incorrecto. Baja 5 casillas 😅'}
          </h2>
          {coinFlipping && <div className="coin-flip">🪙</div>}
          {!coinFlipping && (
            <>
              <div className="result-votes">
                <div className="result-vote-box up">
                  <span>✅</span>
                  <strong>{result.ups}</strong>
                  <span>correcto</span>
                </div>
                <div className="result-vote-box down">
                  <span>❌</span>
                  <strong>{result.downs}</strong>
                  <span>incorrecto</span>
                </div>
              </div>
              <p className="result-final">
                {activePlayer?.name} va al Aula <strong>{result.finalPosition}</strong>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  //  CHALLENGE SCREEN
  // ══════════════════════════════════════════════════════
  const ch = challenge?.challenge;

  return (
    <div className="challenge-overlay">
      <div className={`challenge-modal ${isHostView ? 'challenge-host' : ''}`}>

        {/* ── Header ── */}
        <div className="challenge-header">
          <span className="challenge-emoji">{ch?.emoji || '🧮'}</span>
          <div style={{ flex: 1 }}>
            <p className="challenge-player-label">
              {isHostView
                ? `🎯 ${activePlayer?.name} responde`
                : isActivePlayer
                  ? '🎯 ¡Es tu turno de responder!'
                  : `🎯 ${activePlayer?.name} tiene ${TIMER_SECS} segundos`}
            </p>
            <div className="challenge-type-badge question">
              🧮 PROBLEMA DE MATEMÁTICAS
            </div>
          </div>
          {/* Timer */}
          <div className="timer-circle">
            <svg width="90" height="90">
              <circle cx="45" cy="45" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
              <circle
                cx="45" cy="45" r={radius}
                fill="none"
                stroke={timerColor}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 1s linear, stroke 0.5s',
                  transform: 'rotate(-90deg)',
                  transformOrigin: '45px 45px',
                }}
              />
              <text x="45" y="51" textAnchor="middle" fill={timerColor} fontSize="20" fontWeight="bold" fontFamily="'Fredoka One', cursive">
                {timeLeft}
              </text>
            </svg>
          </div>
        </div>

        {/* ── Math Problem — Big & Clear ── */}
        <div className="challenge-math-box">
          <div className="challenge-math-label">📝 Pregunta:</div>
          <p className="challenge-math-text">{ch?.text}</p>
        </div>

        {/* ── Answer — host sees it, players hidden ── */}
        {isHostView && ch?.answer && (
          <div className="challenge-answer-box">
            <button
              className="challenge-answer-toggle"
              onClick={() => setShowAnswer(v => !v)}
            >
              {showAnswer ? '🙈 Ocultar respuesta' : '👁️ Ver respuesta'}
            </button>
            {showAnswer && (
              <div className="challenge-answer-reveal">
                <span className="challenge-answer-label">Respuesta:</span>
                <span className="challenge-answer-value">{ch.answer}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Voting section (non-host players, non-active) ── */}
        {canVote && (
          <div className="vote-section">
            <p className="vote-label">¿Respondió correctamente?</p>
            <div className="vote-buttons">
              <button
                id="vote-up"
                className={`vote-btn vote-up ${(myVote || localVote) === 'up' ? 'voted' : ''}`}
                onClick={() => handleVote('up')}
                disabled={!!(myVote || localVote)}
              >
                ✅ <span>Correcto</span>
              </button>
              <button
                id="vote-down"
                className={`vote-btn vote-down ${(myVote || localVote) === 'down' ? 'voted' : ''}`}
                onClick={() => handleVote('down')}
                disabled={!!(myVote || localVote)}
              >
                ❌ <span>Incorrecto</span>
              </button>
            </div>
            {(myVote || localVote) && (
              <p className="voted-msg">
                ✅ Voto registrado: {(myVote || localVote) === 'up' ? '✅ Correcto' : '❌ Incorrecto'}
              </p>
            )}
          </div>
        )}

        {/* Active player waiting message */}
        {!isHostView && isActivePlayer && (
          <div className="active-waiting">
            <p>🎙️ ¡Responde en voz alta! Los demás votarán...</p>
            <div className="mini-vote-count">
              <span>✅ {upVotes}</span>
              <span>❌ {downVotes}</span>
              <span>({upVotes + downVotes}/{totalVoters} votos)</span>
            </div>
          </div>
        )}

        {/* Host vote display */}
        {isHostView && (
          <div className="active-waiting">
            <div className="mini-vote-count">
              <span>✅ Correcto: {upVotes}</span>
              <span>❌ Incorrecto: {downVotes}</span>
              <span style={{ fontSize: '13px', color: 'var(--text3)' }}>
                ({upVotes + downVotes}/{totalVoters} votos)
              </span>
            </div>
          </div>
        )}

        {/* Live vote tally bar */}
        <div className="vote-tally">
          <div className="tally-bar">
            <div className="tally-up" style={{ flex: upVotes + 0.01 }} />
            <div className="tally-down" style={{ flex: downVotes + 0.01 }} />
          </div>
          <div className="tally-labels">
            <span>✅ {upVotes}</span>
            <span>❌ {downVotes}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
