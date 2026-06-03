import React, { useEffect, useState } from 'react';

export default function EventPopup({ event, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (event) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 400);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [event]);

  if (!event) return null;

  const isSnake = event.type === 'snake' || event.type === 'global-snake';
  const isLadder = event.type === 'ladder';

  return (
    <div className={`event-overlay ${visible ? 'visible' : 'hidden'}`}>
      <div className={`event-popup ${isSnake ? 'event-snake' : 'event-ladder'}`}>
        <div className="event-big-emoji">
          {isSnake ? '🐍' : '🪜'}
        </div>
        <div className="event-content">
          {event.isGlobal && (
            <div className="event-global-badge">⚠️ EVENTO GLOBAL — TODOS BAJAN</div>
          )}
          <p className="event-player-name">{event.playerName}</p>
          <h3 className="event-title">
            {isSnake ? '¡SERPIENTE! 📉' : '¡ESCALERA! 📈'}
          </h3>
          <p className="event-text">{event.text}</p>
          {event.fromCell && event.toCell && (
            <div className="event-move">
              <span className="event-cell-from">{event.fromCell}</span>
              <span className="event-arrow">{isSnake ? ' ↘️ ' : ' ↗️ '}</span>
              <span className="event-cell-to">{event.toCell}</span>
            </div>
          )}
        </div>
        <div className="event-particles">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="particle" style={{ '--i': i }}>
              {isSnake ? '💀' : '⭐'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
