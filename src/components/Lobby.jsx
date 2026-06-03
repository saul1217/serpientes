import React, { useState, useEffect } from 'react';
import { GAME_OBJECTS } from '../data/gameData.js';

export default function Lobby({ socket, onGameStart, onRoomCreated }) {
  const [screen, setScreen] = useState('home');
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedObject, setSelectedObject] = useState(null);
  const [takenObjects, setTakenObjects] = useState([]);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [networkUrl, setNetworkUrl] = useState('');

  useEffect(() => {
    fetch('/api/network').then(r => r.json()).then(d => setNetworkUrl(d.url)).catch(() => {});
    socket.on('player-joined', ({ players }) => setPlayers(players));
    socket.on('player-disconnected', ({ state }) => setPlayers(state.players));
    socket.on('game-started', (state) => onGameStart(state));
    return () => {
      socket.off('player-joined');
      socket.off('player-disconnected');
      socket.off('game-started');
    };
  }, [socket]);

  // ── HOST: Create room (no player join) ───────────────────
  function handleCreateHost() {
    setLoading(true);
    setError('');

    function doCreate() {
      socket.emit('create-room', (res) => {
        setLoading(false);
        if (!res || !res.success) { setError('Error creando sala. Intenta de nuevo.'); return; }
        setRoomCode(res.roomCode);
        setPlayers([]);
        onRoomCreated(res.roomCode, null, true);
        setScreen('host-waiting');
      });
    }

    if (socket.connected) {
      doCreate();
    } else {
      socket.once('connect', doCreate);
      socket.once('connect_error', (err) => {
        setLoading(false);
        setError('No se pudo conectar al servidor. Recarga la página.');
        console.error('Socket connect error:', err);
      });
      socket.connect();
    }
  }

  // ── PLAYER: Join room ────────────────────────────────────
  function handleJoin() {
    const code = inputCode.trim().toUpperCase();
    if (!code || code.length < 4) { setError('Ingresa el código de 4 letras'); return; }
    if (!playerName.trim()) { setError('Ingresa tu nombre'); return; }
    if (!selectedObject) { setError('Selecciona tu objeto'); return; }
    setError('');
    setLoading(true);

    function doJoin() {
      socket.emit('join-room', { roomCode: code, playerName: playerName.trim(), objectId: selectedObject }, (res) => {
        setLoading(false);
        if (!res || !res.success) { setError(res?.error || 'Error al unirse'); return; }
        setRoomCode(code);
        onRoomCreated(code, res.playerId, false, playerName.trim(), selectedObject);
        setScreen('player-waiting');
      });
    }

    if (socket.connected) {
      doJoin();
    } else {
      socket.once('connect', doJoin);
      socket.once('connect_error', (err) => {
        setLoading(false);
        setError('No se pudo conectar al servidor. Recarga la página.');
        console.error('Socket connect error:', err);
      });
      socket.connect();
    }
  }

  function refreshTaken(code) {
    if (code.length === 4) {
      socket.emit('get-taken-objects', { roomCode: code }, ({ objects }) => setTakenObjects(objects));
    }
  }

  // Particles — always rendered in background
  const Particles = () => (
    <div className="lobby-particles" aria-hidden="true">
      <span>🐍</span><span>🪜</span><span>🎲</span><span>⭐</span>
      <span>🐍</span><span>🪜</span><span>🎯</span><span>✨</span>
    </div>
  );

  // ── HOME ────────────────────────────────────────────────
  if (screen === 'home') return (
    <div className="lobby-home">
      <Particles />
      <div className="lobby-logo">
        <span className="logo-snake">🐍</span>
        <div>
          <h1>Serpientes</h1>
          <h1 className="logo-h2">y Escaleras</h1>
        </div>
        <span className="logo-ladder">🪜</span>
      </div>
      <p className="lobby-subtitle">UTCH Edition • Hasta 8 jugadores en tiempo real</p>
      <div className="lobby-btns">
        <button className="btn-host" onClick={handleCreateHost} disabled={loading}>
          <span className="btn-host-icon">📺</span>
          <span>
            <strong>Poner Pantalla</strong>
            <small>Solo para mostrar el tablero</small>
          </span>
        </button>
        <button className="btn-primary" onClick={() => setScreen('player-join')}>
          <span>🎮 Unirse a Jugar</span>
        </button>
      </div>
    </div>
  );

  // ── HOST WAITING ────────────────────────────────────────
  if (screen === 'host-waiting') return (
    <div className="host-waiting">
      <div className="host-code-block">
        <p className="host-code-title">Código para los jugadores:</p>
        <div className="host-code-big">{roomCode}</div>
        {networkUrl && (
          <p className="host-url-hint">
            📱 Jugadores abren: <strong>{networkUrl}</strong>
          </p>
        )}
      </div>

      <div className="host-players-area">
        <h3>Jugadores conectados <span className="player-count-badge">{players.length}/8</span></h3>
        {players.length === 0
          ? <p className="no-players-hint">Esperando jugadores...</p>
          : players.map(p => {
              const obj = GAME_OBJECTS.find(o => o.id === p.objectId);
              return (
                <div key={p.id} className="host-player-row">
                  <span className="hp-emoji">{obj?.emoji}</span>
                  <span className="hp-name">{p.name}</span>
                  <span className="hp-obj">{obj?.label}</span>
                </div>
              );
            })
        }
      </div>

      <button
        className="btn-primary"
        onClick={() => socket.emit('start-game', { roomCode })}
        disabled={players.length < 1}
      >
        {players.length < 1 ? '⏳ Esperando jugadores...' : `🎮 Iniciar Juego (${players.length} jugadores)`}
      </button>
    </div>
  );

  // ── PLAYER JOIN ─────────────────────────────────────────
  if (screen === 'player-join') return (
    <div className="lobby-form">
      <button className="btn-back" onClick={() => { setScreen('home'); setError(''); }}>← Volver</button>
      <h2>🎮 Unirse a Jugar</h2>

      <div className="form-field">
        <label>Código de sala</label>
        <input
          className="lobby-input code-input"
          placeholder="ABCD"
          maxLength={4}
          value={inputCode}
          onChange={e => {
            const v = e.target.value.toUpperCase();
            setInputCode(v);
            refreshTaken(v);
          }}
        />
      </div>

      <div className="form-field">
        <label>Tu nombre</label>
        <input
          className="lobby-input"
          placeholder="¿Cómo te llamas?"
          maxLength={20}
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label>Tu objeto</label>
        <div className="object-grid">
          {GAME_OBJECTS.map(obj => {
            const taken = takenObjects.includes(obj.id) && obj.id !== selectedObject;
            return (
              <button
                key={obj.id}
                className={`object-btn ${selectedObject === obj.id ? 'selected' : ''} ${taken ? 'taken' : ''}`}
                style={{ '--obj-color': obj.color }}
                onClick={() => !taken && setSelectedObject(obj.id)}
                disabled={taken}
              >
                <span className="obj-emoji">{obj.emoji}</span>
                <span className="obj-label">{obj.label}</span>
                {taken && <span className="obj-taken-badge">Tomado</span>}
              </button>
            );
          })}
        </div>
      </div>

      {error && <div className="lobby-error">{error}</div>}

      <button className="btn-primary" onClick={handleJoin} disabled={loading}>
        {loading ? 'Uniéndose...' : '🚀 Entrar al Juego'}
      </button>
    </div>
  );

  // ── PLAYER WAITING ─────────────────────────────────────
  if (screen === 'player-waiting') {
    const myObj = GAME_OBJECTS.find(o => o.id === selectedObject);
    return (
      <div className="player-waiting">
        <div className="pw-logo">🐍🪜</div>
        <h2>¡Estás dentro!</h2>
        <div className="pw-my-token" style={{ '--tc': myObj?.color }}>
          <span className="pw-emoji">{myObj?.emoji}</span>
          <div>
            <strong>{playerName}</strong>
            <small>{myObj?.label}</small>
          </div>
        </div>
        <div className="pw-room">Sala: <strong>{roomCode}</strong></div>
        <div className="pw-status">
          <span className="pw-spinner">⏳</span>
          <span>El host iniciará el juego pronto...</span>
        </div>
        <div className="pw-players">
          {players.map(p => {
            const obj = GAME_OBJECTS.find(o => o.id === p.objectId);
            return (
              <span key={p.id} className="pw-player-badge">
                {obj?.emoji} {p.name}
              </span>
            );
          })}
        </div>
      </div>
    );
  }
}
