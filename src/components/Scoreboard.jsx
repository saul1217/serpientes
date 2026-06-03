import React from 'react';
import { GAME_OBJECTS } from '../data/gameData.js';

export default function Scoreboard({ players, currentPlayerId, myPlayerId }) {
  return (
    <div className="scoreboard" id="scoreboard">
      <h3 className="scoreboard-title">👥 Jugadores</h3>
      <div className="scoreboard-list">
        {players?.map((p, i) => {
          const obj = GAME_OBJECTS.find(o => o.id === p.objectId);
          const isActive = p.id === currentPlayerId;
          const isMe = p.id === myPlayerId;
          return (
            <div
              key={p.id}
              className={`score-row ${isActive ? 'score-active' : ''} ${isMe ? 'score-me' : ''} ${!p.connected ? 'score-disconnected' : ''}`}
              style={{ '--obj-color': obj?.color || '#888' }}
            >
              <span className="score-emoji">{obj?.emoji || '❓'}</span>
              <div className="score-info">
                <span className="score-name">{p.name}{isMe ? ' (Tú)' : ''}</span>
                <span className="score-position">Casilla {p.position}</span>
              </div>
              <div className="score-right">
                {isActive && <span className="turn-indicator">🎲</span>}
                <div className="score-progress-bar">
                  <div
                    className="score-progress-fill"
                    style={{ width: `${p.position}%`, background: obj?.color || '#888' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
