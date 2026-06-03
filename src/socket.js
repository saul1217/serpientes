import { io } from 'socket.io-client';

// En producción: misma URL del servidor (Railway sirve todo en el mismo dominio)
// En desarrollo: apunta al servidor local
const URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'], // intenta WebSocket primero, cae a polling si falla
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
});
