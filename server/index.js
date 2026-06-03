import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { generateBoard, GLOBAL_SNAKE } from '../src/data/gameData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ── Serve static build in production ──────────────────────
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/socket.io')) {
      res.sendFile(join(distPath, 'index.html'));
    } else { next(); }
  });
}

// ── Network API ───────────────────────────────────────────
let cachedLocalIP = 'localhost';
app.get('/api/network', (_req, res) => { res.json({ url: `http://${cachedLocalIP}:5173` }); });

// ─────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────
const rooms = new Map();
let playerIdCounter = 0;

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (rooms.has(code));
  return code;
}

// ─────────────────────────────────────────────
//  GameRoom
// ─────────────────────────────────────────────
class GameRoom {
  constructor(code, hostSocketId) {
    this.code = code;
    this.hostSocketId = hostSocketId;
    this.players = [];
    this.phase = 'lobby'; // lobby | rolling | moving | snake | ladder | challenge | voting | result | finished
    this.currentPlayerIndex = 0;
    this.board = null;
    this.revealedChallenges = [];
    this.currentChallenge = null;
    this.votes = {};
    this.challengeTimer = null;
    this.diceResult = null;
  }

  addPlayer(socketId, name, objectId) {
    const player = {
      id: `p${playerIdCounter++}`,
      socketId,
      name: (name || '').trim().slice(0, 20) || `Jugador ${this.players.length + 1}`,
      objectId,
      position: 1,
      connected: true,
    };
    this.players.push(player);
    return player;
  }

  getState() {
    return {
      code: this.code,
      phase: this.phase,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        objectId: p.objectId,
        position: p.position,
        connected: p.connected,
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerId: this.players[this.currentPlayerIndex]?.id,
      board: this.board,
      revealedChallenges: this.revealedChallenges,
      currentChallenge: this.currentChallenge,
      votes: this.votes,
      diceResult: this.diceResult,
    };
  }
}

// ─────────────────────────────────────────────
//  Move Processing
// ─────────────────────────────────────────────
function processMove(roomCode, room, player, roll) {
  const newPos = Math.min(player.position + roll, 100);
  const path = [];
  for (let i = player.position + 1; i <= newPos; i++) path.push(i);
  player.position = newPos;
  room.phase = 'moving';

  const { board } = room;
  const snake = board.snakes.find(s => s.head === newPos);
  const ladder = board.ladders.find(l => l.base === newPos);
  const challenge = board.challenges.find(c => c.cell === newPos);
  const isGlobalSnake = newPos === board.globalSnakeCell;

  // Emit the movement path first
  io.to(roomCode).emit('player-moved', {
    playerId: player.id,
    path,
    finalPosition: newPos,
    state: room.getState(),
  });

  // Then after animation delay, process the landing effect
  setTimeout(() => {
    if (newPos === 100) {
      // WINNER
      room.phase = 'finished';
      io.to(roomCode).emit('game-over', {
        winnerId: player.id,
        winnerName: player.name,
        state: room.getState(),
      });

    } else if (isGlobalSnake) {
      // GLOBAL SNAKE — all players go back 10
      const prevPositions = {};
      room.players.forEach(p => {
        prevPositions[p.id] = p.position;
        p.position = Math.max(1, p.position - 10);
      });
      room.phase = 'snake';
      io.to(roomCode).emit('global-snake', {
        message: GLOBAL_SNAKE.text,
        emoji: GLOBAL_SNAKE.emoji,
        isGlobal: true,
        prevPositions,
        state: room.getState(),
      });
      setTimeout(() => advanceTurn(roomCode, room), 4000);

    } else if (snake) {
      // SNAKE
      player.position = snake.tail;
      room.phase = 'snake';
      io.to(roomCode).emit('snake-event', {
        playerId: player.id,
        snake,
        finalPosition: snake.tail,
        state: room.getState(),
      });
      setTimeout(() => advanceTurn(roomCode, room), 4000);

    } else if (ladder) {
      // LADDER
      player.position = ladder.top;
      room.phase = 'ladder';
      io.to(roomCode).emit('ladder-event', {
        playerId: player.id,
        ladder,
        finalPosition: ladder.top,
        state: room.getState(),
      });
      setTimeout(() => advanceTurn(roomCode, room), 4000);

    } else if (challenge) {
      // CHALLENGE
      if (!room.revealedChallenges.includes(challenge.id)) {
        room.revealedChallenges.push(challenge.id);
      }
      room.currentChallenge = { ...challenge, activePlayerId: player.id };
      room.votes = {};
      room.phase = 'voting';

      io.to(roomCode).emit('challenge-start', {
        playerId: player.id,
        challenge: room.currentChallenge,
        state: room.getState(),
      });

      // Auto-end after 30 seconds
      room.challengeTimer = setTimeout(() => {
        endChallenge(roomCode, room, player);
      }, 30000);

    } else {
      // NORMAL CELL
      advanceTurn(roomCode, room);
    }
  }, 1500 + path.length * 180);
}

function endChallenge(roomCode, room, player) {
  if (room.challengeTimer) {
    clearTimeout(room.challengeTimer);
    room.challengeTimer = null;
  }

  const ups = Object.values(room.votes).filter(v => v === 'up').length;
  const downs = Object.values(room.votes).filter(v => v === 'down').length;
  let direction, coinFlip = false;

  if (ups > downs) direction = 'up';
  else if (downs > ups) direction = 'down';
  else {
    coinFlip = true;
    direction = Math.random() < 0.5 ? 'up' : 'down';
  }

  const delta = direction === 'up' ? 5 : -5;
  player.position = Math.max(1, Math.min(100, player.position + delta));
  room.phase = 'result';
  room.currentChallenge = null;

  io.to(roomCode).emit('challenge-result', {
    playerId: player.id,
    direction,
    coinFlip,
    steps: 5,
    ups,
    downs,
    finalPosition: player.position,
    state: room.getState(),
  });

  setTimeout(() => advanceTurn(roomCode, room), 4500);
}

function advanceTurn(roomCode, room) {
  // Skip disconnected players
  let nextIdx = (room.currentPlayerIndex + 1) % room.players.length;
  let tries = 0;
  while (!room.players[nextIdx].connected && tries < room.players.length) {
    nextIdx = (nextIdx + 1) % room.players.length;
    tries++;
  }
  room.currentPlayerIndex = nextIdx;
  room.phase = 'rolling';
  room.diceResult = null;
  io.to(roomCode).emit('turn-start', { state: room.getState() });
}

// ─────────────────────────────────────────────
//  Socket Events
// ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`✅ Connected: ${socket.id}`);

  // CREATE ROOM
  socket.on('create-room', (callback) => {
    const code = generateRoomCode();
    const room = new GameRoom(code, socket.id);
    rooms.set(code, room);
    socket.join(code);
    callback({ success: true, roomCode: code });
    console.log(`🏠 Room created: ${code}`);
  });

  // JOIN ROOM
  socket.on('join-room', ({ roomCode, playerName, objectId }, callback) => {
    const code = roomCode?.toUpperCase();
    const room = rooms.get(code);
    if (!room) return callback({ success: false, error: 'Sala no encontrada' });
    if (room.phase !== 'lobby') return callback({ success: false, error: 'El juego ya comenzó' });
    if (room.players.length >= 8) return callback({ success: false, error: 'Sala llena (máx 8 jugadores)' });
    if (room.players.some(p => p.objectId === objectId)) return callback({ success: false, error: 'Ese objeto ya está tomado' });

    const player = room.addPlayer(socket.id, playerName, objectId);
    socket.join(code);

    callback({ success: true, playerId: player.id, player });
    io.to(code).emit('player-joined', { players: room.players });
    console.log(`👤 ${player.name} joined ${code} with ${objectId}`);
  });

  // GET TAKEN OBJECTS
  socket.on('get-taken-objects', ({ roomCode }, callback) => {
    const room = rooms.get(roomCode?.toUpperCase());
    callback({ objects: room ? room.players.map(p => p.objectId) : [] });
  });

  // START GAME
  socket.on('start-game', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || socket.id !== room.hostSocketId || room.players.length < 1) return;
    room.board = generateBoard();
    room.phase = 'rolling';
    room.currentPlayerIndex = 0;
    io.to(roomCode).emit('game-started', room.getState());
    console.log(`🎮 Game started in room ${roomCode} with ${room.players.length} players`);
  });

  // ROLL DICE
  socket.on('roll-dice', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'rolling') return;
    const current = room.players[room.currentPlayerIndex];
    if (socket.id !== current.socketId) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    room.diceResult = roll;

    io.to(roomCode).emit('dice-rolled', {
      playerId: current.id,
      roll,
      state: room.getState(),
    });

    // Process move after dice animation
    setTimeout(() => processMove(roomCode, room, current, roll), 2000);
  });

  // CHALLENGE VOTE
  socket.on('challenge-vote', ({ roomCode, vote }) => {
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'voting') return;
    const voter = room.players.find(p => p.socketId === socket.id);
    if (!voter) return;
    const current = room.players[room.currentPlayerIndex];
    if (voter.id === current.id) return; // active player can't vote

    room.votes[voter.id] = vote; // 'up' | 'down'
    io.to(roomCode).emit('vote-updated', { votes: room.votes, state: room.getState() });
    console.log(`🗳️ ${voter.name} voted ${vote} in ${roomCode}`);
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
    for (const [code, room] of rooms) {
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) continue;

      player.connected = false;
      io.to(code).emit('player-disconnected', { playerId: player.id, state: room.getState() });
      console.log(`📵 ${player.name} desconectado de ${code} (fase: ${room.phase})`);

      const isCurrentPlayer = room.players[room.currentPlayerIndex]?.id === player.id;

      // ─ Si era su turno en fase rolling, avanzar automáticamente tras 8 s
      if (isCurrentPlayer && room.phase === 'rolling' && room.players.filter(p => p.connected).length >= 1) {
        console.log(`⏱️ Auto-skip de ${player.name} en ${code} en 8s`);
        setTimeout(() => {
          // Solo actuar si sigue desconectado y sigue siendo su turno
          if (!player.connected && room.phase === 'rolling' &&
              room.players[room.currentPlayerIndex]?.id === player.id) {
            io.to(code).emit('player-skipped', { playerId: player.id, playerName: player.name, state: room.getState() });
            advanceTurn(code, room);
          }
        }, 8000);
      }

      // ─ Si era su turno en fase voting, terminar reto en 2 s
      if (isCurrentPlayer && room.phase === 'voting') {
        setTimeout(() => endChallenge(code, room, player), 2000);
      }

      // ─ Si quedan 0 conectados, guardar sala 2 minutos antes de borrar
      if (room.players.every(p => !p.connected)) {
        console.log(`⏳ Sala ${code} vacía, se borrará en 2 min si nadie reconecta`);
        room._emptyTimer = setTimeout(() => {
          if (room.players.every(p => !p.connected)) {
            if (room.challengeTimer) clearTimeout(room.challengeTimer);
            rooms.delete(code);
            console.log(`🗑️ Sala eliminada por inactividad: ${code}`);
          }
        }, 2 * 60 * 1000); // 2 minutos
      }
    }
  });

  // REJOIN (reconexion tras recargar página)
  socket.on('rejoin-room', ({ roomCode, playerId, playerName }, callback) => {
    const code = roomCode?.toUpperCase();
    const room = rooms.get(code);
    if (!room) return callback({ success: false, error: 'Sala no encontrada o expirada' });
    if (room.phase === 'lobby') return callback({ success: false, error: 'El juego no ha comenzado' });

    // Buscar por ID primero, luego por nombre
    let player = room.players.find(p => p.id === playerId);
    if (!player) player = room.players.find(p => p.name.toLowerCase() === playerName?.toLowerCase());
    if (!player) return callback({ success: false, error: 'No se encontró tu jugador en esta sala' });

    // Cancelar timer de borrado si existía
    if (room._emptyTimer) { clearTimeout(room._emptyTimer); room._emptyTimer = null; }

    // Actualizar socket y marcar conectado
    player.socketId = socket.id;
    player.connected = true;
    socket.join(code);

    console.log(`🔄 ${player.name} reconectado en ${code}`);
    callback({ success: true, playerId: player.id, state: room.getState() });
    io.to(code).emit('player-reconnected', { playerId: player.id, playerName: player.name, state: room.getState() });
  });
});

// ─────────────────────────────────────────────
//  Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', async () => {
  const os = await import('os');
  const ifaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) { cachedLocalIP = iface.address; break; }
    }
  }
  console.log(`\n🐍 Serpientes y Escaleras`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${cachedLocalIP}:${PORT}  ← Jugadores en celular usan esta`);
  console.log(`   Clientes Vite: http://localhost:5173\n`);
});
