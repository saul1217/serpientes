import React, { useEffect, useState, useRef, useCallback } from 'react';
import { socket } from './socket.js';
import Lobby from './components/Lobby.jsx';
import Board from './components/Board.jsx';
import EventPopup from './components/EventPopup.jsx';
import ChallengeModal from './components/ChallengeModal.jsx';
import Scoreboard from './components/Scoreboard.jsx';
import Dice from './components/Dice.jsx';
import { GAME_OBJECTS } from './data/gameData.js';

// ── Step-by-step position animator ───────────────────────────
// Returns a gameState copy with a specific player at a given position
function stateWithPlayerAt(state, playerId, pos) {
  return {
    ...state,
    players: state.players.map(p => p.id === playerId ? { ...p, position: pos } : p),
  };
}

export default function App() {
  const [screen, setScreen] = useState('lobby');
  const [gameState, setGameState] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);

  const [rolling, setRolling] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [challengeResult, setChallengeResult] = useState(null);
  const [revealedChallenges, setRevealedChallenges] = useState([]);
  const [gameOver, setGameOver] = useState(null);
  const [notification, setNotification] = useState(null);
  const [focusCell, setFocusCell] = useState(1);
  const [myVote, setMyVote] = useState(null);

  // step-by-step animation queue
  const animRef = useRef(null);

  const animateSteps = useCallback((path, playerId, baseState, onDone) => {
    if (animRef.current) clearTimeout(animRef.current);
    let i = 0;
    const STEP_MS = 280; // ms per cell

    function step() {
      if (i >= path.length) {
        onDone();
        return;
      }
      const pos = path[i];
      setFocusCell(pos);
      setGameState(stateWithPlayerAt(baseState, playerId, pos));
      i++;
      animRef.current = setTimeout(step, STEP_MS);
    }
    step();
  }, []);

  // ── Socket listeners ─────────────────────────────────────
  useEffect(() => {
    socket.on('game-started', (state) => {
      setGameState(state); setScreen('game');
      setRevealedChallenges(state.revealedChallenges || []);
      setFocusCell(1);
    });

    socket.on('dice-rolled', ({ state }) => {
      setGameState(state); setRolling(true);
    });

    socket.on('player-moved', ({ playerId, path, finalPosition, state }) => {
      setRolling(false);
      // animate step by step; after done, apply final server state
      animateSteps(path, playerId, state, () => {
        setGameState(state);
        setFocusCell(finalPosition);
      });
    });

    socket.on('snake-event', ({ snake, playerId, finalPosition, state }) => {
      const player = state.players.find(p => p.id === playerId);
      setCurrentEvent({ type: 'snake', text: snake.text, emoji: snake.emoji,
        playerName: player?.name, fromCell: snake.head, toCell: snake.tail });
      setGameState({ ...state, players: state.players.map(p =>
        p.id === playerId ? { ...p, position: finalPosition } : p) });
      setFocusCell(snake.head);
      setTimeout(() => setFocusCell(finalPosition), 2000);
    });

    socket.on('ladder-event', ({ ladder, playerId, finalPosition, state }) => {
      const player = state.players.find(p => p.id === playerId);
      setCurrentEvent({ type: 'ladder', text: ladder.text, emoji: ladder.emoji,
        playerName: player?.name, fromCell: ladder.base, toCell: ladder.top });
      setGameState({ ...state, players: state.players.map(p =>
        p.id === playerId ? { ...p, position: finalPosition } : p) });
      setFocusCell(ladder.base);
      setTimeout(() => setFocusCell(finalPosition), 2000);
    });

    socket.on('global-snake', ({ message, emoji, state }) => {
      setCurrentEvent({ type: 'global-snake', text: message, emoji, isGlobal: true, playerName: 'TODOS' });
      setGameState(state);
    });

    socket.on('challenge-start', ({ challenge, playerId, state }) => {
      setGameState(state);
      setRevealedChallenges(state.revealedChallenges || []);
      setCurrentChallenge({ ...challenge, activePlayerId: playerId });
      setChallengeResult(null);
      setMyVote(null);
      setFocusCell(challenge.cell);
    });

    socket.on('vote-updated', ({ votes }) => {
      setGameState(prev => prev ? { ...prev, votes } : prev);
    });

    socket.on('challenge-result', ({ direction, coinFlip, steps, ups, downs, finalPosition, playerId, state }) => {
      setChallengeResult({ direction, coinFlip, steps, ups, downs, finalPosition, activePlayerId: playerId });
      setGameState(state); setFocusCell(finalPosition);
      setTimeout(() => { setCurrentChallenge(null); setChallengeResult(null); setMyVote(null); }, 5000);
    });

    socket.on('turn-start', ({ state }) => {
      setGameState(state); setRolling(false);
      const cp = state.players[state.currentPlayerIndex];
      if (cp) setFocusCell(cp.position);
    });

    socket.on('game-over', ({ winnerId, winnerName, state }) => {
      setGameState(state); setGameOver({ winnerId, winnerName }); setScreen('gameover');
    });

    socket.on('player-disconnected', ({ state }) => {
      setGameState(state); showNotification('Un jugador se desconectó', '📴');
    });

    return () => {
      ['game-started','dice-rolled','player-moved','snake-event','ladder-event','global-snake',
       'challenge-start','vote-updated','challenge-result','turn-start','game-over','player-disconnected']
        .forEach(e => socket.off(e));
    };
  }, [animateSteps]);

  const showNotification = (msg, emoji = 'ℹ️') => {
    setNotification({ msg, emoji });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRoll = () => {
    if (!gameState || rolling) return;
    const cp = gameState.players[gameState.currentPlayerIndex];
    if (cp?.id !== myPlayerId || gameState.phase !== 'rolling') return;
    socket.emit('roll-dice', { roomCode });
    setRolling(true);
  };

  const handleVote = (direction) => {
    setMyVote(direction);
    socket.emit('challenge-vote', { roomCode, vote: direction });
  };

  const handleRoomCreated = (code, playerId, host) => {
    setRoomCode(code); setMyPlayerId(playerId); setIsHost(host);
  };

  // ── LOBBY ──────────────────────────────────────────────
  if (screen === 'lobby') return (
    <div className="app-lobby">
      <Lobby socket={socket} onGameStart={s => { setGameState(s); setScreen('game'); }} onRoomCreated={handleRoomCreated} />
    </div>
  );

  // ── GAME OVER ──────────────────────────────────────────
  if (screen === 'gameover') {
    const winner = gameState?.players?.find(p => p.id === gameOver?.winnerId);
    const obj = GAME_OBJECTS.find(o => o.id === winner?.objectId);
    return (
      <div className="gameover-screen">
        <div className="gameover-card">
          <div className="gameover-trophy">🏆</div>
          <h1>¡Tenemos ganador!</h1>
          <div className="gameover-winner" style={{ '--obj-color': obj?.color }}>
            <span className="gameover-emoji">{obj?.emoji}</span>
            <span className="gameover-name">{winner?.name}</span>
          </div>
          <p className="gameover-msg">¡Llegó al Aula 100 primero!</p>
          <div className="gameover-rankings">
            <h3>Posiciones finales</h3>
            {[...gameState.players].sort((a, b) => b.position - a.position).map((p, i) => {
              const pObj = GAME_OBJECTS.find(o => o.id === p.objectId);
              return (
                <div key={p.id} className="ranking-row">
                  <span>{['🥇','🥈','🥉'][i] || `${i+1}.`}</span>
                  <span>{pObj?.emoji}</span>
                  <span>{p.name}</span>
                  <span>Aula {p.position}</span>
                </div>
              );
            })}
          </div>
          <button className="btn-primary" onClick={() => window.location.reload()}>🔄 Jugar de nuevo</button>
        </div>
      </div>
    );
  }

  if (!gameState) return <div className="loading">Cargando...</div>;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const myObj = GAME_OBJECTS.find(o => o.id === myPlayer?.objectId);
  const currentObj = GAME_OBJECTS.find(o => o.id === currentPlayer?.objectId);

  // ══════════════════════════════════════════════════════════
  //  HOST VIEW — Big display screen
  // ══════════════════════════════════════════════════════════
  if (isHost) return (
    <div className="app-game host-mode">
      <header className="game-header">
        <div className="game-header-left">
          <span className="header-logo">🐍🪜</span>
          <span className="header-room">Sala <strong>{roomCode}</strong></span>
        </div>
        <div className="game-header-center">
          <span className="turn-badge other-turn" style={{ '--tc': currentObj?.color }}>
            {currentObj?.emoji} Turno de <strong>{currentPlayer?.name}</strong>
            <span className="turn-pos"> — Aula {currentPlayer?.position}</span>
          </span>
        </div>
        <div className="game-header-right">
          <span className="host-badge-label">📺 PANTALLA</span>
        </div>
      </header>

      <main className="game-main">
        <section className="game-board-section">
          <Board
            state={gameState}
            myPlayerId={null}
            revealedChallenges={revealedChallenges}
            focusCell={focusCell}
          />
        </section>
        <aside className="game-sidebar">
          <Scoreboard players={gameState.players} currentPlayerId={currentPlayer?.id} myPlayerId={null} />
        </aside>
      </main>

      {/* Challenge/Result visible for everyone on host screen */}
      {(currentChallenge || challengeResult) && (
        <ChallengeModal
          challenge={currentChallenge}
          activePlayerId={currentChallenge?.activePlayerId || challengeResult?.activePlayerId}
          myPlayerId={null}
          players={gameState.players}
          votes={gameState.votes || {}}
          onVote={null}
          result={challengeResult}
          myVote={null}
          isHostView={true}
        />
      )}

      {currentEvent && <EventPopup event={currentEvent} onClose={() => setCurrentEvent(null)} />}
      {notification && <div className="toast">{notification.emoji} {notification.msg}</div>}
    </div>
  );

  // ══════════════════════════════════════════════════════════
  //  PLAYER MOBILE VIEW — Dice + voting only
  // ══════════════════════════════════════════════════════════
  return (
    <div className="player-view">
      {/* Header */}
      <header className="player-header" style={{ '--tc': myObj?.color }}>
        <div className="player-header-info">
          <span className="player-header-obj">{myObj?.emoji}</span>
          <div>
            <div className="player-header-name">{myPlayer?.name}</div>
            <div className="player-header-pos">Aula {myPlayer?.position}</div>
          </div>
        </div>
        <div className="player-header-room">Sala {roomCode}</div>
      </header>

      {/* Scoreboard strip */}
      <div className="player-score-strip">
        {gameState.players.map(p => {
          const pObj = GAME_OBJECTS.find(o => o.id === p.objectId);
          const isActive = p.id === currentPlayer?.id;
          const isMe = p.id === myPlayerId;
          return (
            <div key={p.id}
              className={`strip-player ${isActive ? 'strip-active' : ''} ${isMe ? 'strip-me' : ''}`}
              style={{ '--tc': pObj?.color }}>
              <span className="strip-emoji">{pObj?.emoji}</span>
              <span className="strip-name">{p.name.split(' ')[0]}</span>
              <span className="strip-pos">{p.position}</span>
              {isActive && <span className="strip-turn-dot" />}
            </div>
          );
        })}
      </div>

      {/* Main area */}
      <div className="player-main">
        {/* CHALLENGE VOTING — highest priority */}
        {(currentChallenge || challengeResult) && (
          <ChallengeModal
            challenge={currentChallenge}
            activePlayerId={currentChallenge?.activePlayerId || challengeResult?.activePlayerId}
            myPlayerId={myPlayerId}
            players={gameState.players}
            votes={gameState.votes || {}}
            onVote={handleVote}
            result={challengeResult}
            myVote={myVote}
            isHostView={false}
          />
        )}

        {/* NORMAL TURN — dice */}
        {!currentChallenge && !challengeResult && (
          <>
            {isMyTurn ? (
              <div className="my-turn-area">
                <div className="my-turn-banner">🎲 ¡ES TU TURNO!</div>
                <Dice
                  isMyTurn={gameState.phase === 'rolling'}
                  onRoll={handleRoll}
                  rolling={rolling}
                  result={gameState.diceResult}
                />
              </div>
            ) : (
              <div className="waiting-area">
                <div className="waiting-obj-big">{currentObj?.emoji}</div>
                <p className="waiting-name">{currentPlayer?.name}</p>
                <p className="waiting-sub">está en Aula {currentPlayer?.position}</p>
                <div className="waiting-dots">
                  <span />  <span /> <span />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {currentEvent && <EventPopup event={currentEvent} onClose={() => setCurrentEvent(null)} />}
      {notification && <div className="toast">{notification.emoji} {notification.msg}</div>}
    </div>
  );
}
