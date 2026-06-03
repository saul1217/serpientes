// ============================================================
//  SERPIENTES Y ESCALERAS — Datos del Juego
// ============================================================

export const SNAKE_MESSAGES = [
  { text: "🎤 La maestra Vanessa te escuchó decir groserías en el pasillo", emoji: "😱" },
  { text: "🎮 El director te vio jugando Forza en el salón", emoji: "😬" },
  { text: "💪 El profe Dafnis levanta más que tú en benchpress", emoji: "😳" },
  { text: "📝 Se te olvidó subir la tarea a Moodle", emoji: "😰" },
  { text: "📋 Se te olvidó el formulario para el examen de la maestra Paloma", emoji: "😭" },
  { text: "🇬🇧 No entiendes nada de lo que dice el profe de inglés", emoji: "🤯" },
  { text: "😴 Te quedaste dormido y llegas tarde a clase de la maestra Cristina", emoji: "😴" },
  { text: "🤖 El profe Esteban te atrapa usando IA", emoji: "💀" },
  { text: "⚠️ La maestra Susana te manda a condicionado", emoji: "😤" },
  { text: "💻 No sabes qué es un if con el profe Milton", emoji: "🫠" },
  { text: "🦴 Te rompes la pata en una exhibición de gobierno", emoji: "🤕" },
  { text: "📚 El profe Dafnis te deja mucha tarea", emoji: "😩" },
];

export const GLOBAL_SNAKE = {
  text: "🏛️ Se llevan a tu salón a un evento de gobierno",
  emoji: "😱",
  isGlobal: true,
  steps: -10,
};

export const LADDER_MESSAGES = [
  { text: "⭐ El profe Juan Carlos te da clases", emoji: "🎉" },
  { text: "🌮 El profe Chuy te invita a comer chilaquiles", emoji: "🤩" },
  { text: "🚪 Te cancelan la última clase y sales temprano", emoji: "🥳" },
  { text: "🏪 No hay fila en el Oxxo", emoji: "😍" },
  { text: "🫔 Los chilaquiles hoy estaban buenos", emoji: "😋" },
  { text: "✅ Pasas el examen que dabas por perdido", emoji: "🎊" },
  { text: "🎮 Ganas la partida del Fortnite con tu team", emoji: "🏆" },
  { text: "💰 Te dan la beca alimenticia", emoji: "🤑" },
];

export const CHALLENGES = [
  // ── Aritmética básica ─────────────────────────────────────────
  { type: "question", text: "¿Cuánto es  17 × 8?", answer: "136", emoji: "🔢" },
  { type: "question", text: "¿Cuánto es  144 ÷ 12?", answer: "12", emoji: "➗" },
  { type: "question", text: "¿Cuánto es  256 − 189?", answer: "67", emoji: "➖" },
  { type: "question", text: "¿Cuánto es  45 + 78 + 33?", answer: "156", emoji: "➕" },
  { type: "question", text: "¿Cuánto es  23²?  (23 al cuadrado)", answer: "529", emoji: "🔢" },
  { type: "question", text: "¿Cuánto es el  15%  de 200?", answer: "30", emoji: "%" },
  { type: "question", text: "¿Cuánto es  √169 ?  (raíz cuadrada de 169)", answer: "13", emoji: "√" },
  { type: "question", text: "¿Cuánto es  7!  (7 factorial)?", answer: "5 040", emoji: "❗" },
  // ── Fracciones y decimales ────────────────────────────────────
  { type: "question", text: "¿Cuánto es  3/4 + 5/8 ?", answer: "11/8  =  1.375", emoji: "½" },
  { type: "question", text: "¿Cuánto es  0.25 × 0.4 ?", answer: "0.1", emoji: "·" },
  { type: "question", text: "¿Cuánto es  5/6  de  120?", answer: "100", emoji: "🎯" },
  { type: "question", text: "Convierte  3/8  a decimal", answer: "0.375", emoji: "💫" },
  // ── Álgebra ───────────────────────────────────────────────────
  { type: "question", text: "Si   3x + 5 = 20,   ¿cuánto vale x?", answer: "x = 5", emoji: "📐" },
  { type: "question", text: "Si   2x − 7 = 11,   ¿cuánto vale x?", answer: "x = 9", emoji: "🧮" },
  { type: "question", text: "Si   x² = 49,   ¿cuáles son los valores de x?", answer: "x = 7  y  x = −7", emoji: "🧠" },
  { type: "question", text: "Simplifica:   (x² − 9) ÷ (x + 3)", answer: "x − 3", emoji: "✏️" },
  { type: "question", text: "Factoriza:   x² − 5x + 6", answer: "(x − 2)(x − 3)", emoji: "🔬" },
  // ── Geometría ─────────────────────────────────────────────────
  { type: "question", text: "Área de un triángulo con base 10 y altura 6", answer: "30", emoji: "🔺" },
  { type: "question", text: "Circunferencia de un círculo de radio 7   (π ≈ 3.14)", answer: "43.96", emoji: "⭕" },
  { type: "question", text: "Hipotenusa de un triángulo rectángulo con catetos 3 y 4", answer: "5", emoji: "📏" },
  { type: "question", text: "Volumen de un cubo de lado 5", answer: "125", emoji: "🟦" },
  { type: "question", text: "Área de un círculo de radio 6   (π ≈ 3.14)", answer: "113.04", emoji: "🔵" },
  // ── Probabilidad y estadística ────────────────────────────────
  { type: "question", text: "En un dado de 6 caras, ¿probabilidad de sacar número par?", answer: "1/2  =  50%", emoji: "🎲" },
  { type: "question", text: "Promedio de:   4,  8,  10,  6,  12", answer: "8", emoji: "📊" },
  { type: "question", text: "¿Cuántas combinaciones hay para elegir 2 de entre 5?   C(5,2)", answer: "10", emoji: "🎰" },
  { type: "question", text: "Si lanzas una moneda 3 veces, ¿probabilidad de obtener 3 caras?", answer: "1/8  =  12.5%", emoji: "🪙" },
];

export const GAME_OBJECTS = [
  { id: "moto",         emoji: "🏍️", label: "Moto",           color: "#f97316" },
  { id: "silla",        emoji: "♿", label: "Silla de Ruedas", color: "#3b82f6" },
  { id: "muletas",      emoji: "🩼", label: "Muletas",         color: "#a855f7" },
  { id: "laptop",       emoji: "💻", label: "Laptop",          color: "#06b6d4" },
  { id: "celular",      emoji: "📱", label: "Celular",         color: "#ec4899" },
  { id: "mochila",      emoji: "🎒", label: "Mochila",         color: "#22c55e" },
  { id: "pizza",        emoji: "🍕", label: "Pizza",           color: "#eab308" },
  { id: "control",      emoji: "🎮", label: "Control",         color: "#ef4444" },
  { id: "auriculares",  emoji: "🎧", label: "Auriculares",     color: "#8b5cf6" },
  { id: "pelota",       emoji: "⚽", label: "Pelota",          color: "#10b981" },
  { id: "llave",        emoji: "🔑", label: "Llave",           color: "#f59e0b" },
  { id: "casco",        emoji: "⛑️", label: "Casco",           color: "#6366f1" },
];

// Convierte número de casilla (1-100) a coordenadas [col, row] en tablero de serpentina
// Fila 0 = arriba (casillas 100-91), fila 9 = abajo (casillas 1-10)
export function cellToCoords(cell) {
  const idx = cell - 1; // 0-based
  const row = Math.floor(idx / 10); // 0 = fila inferior (casilla 1-10)
  const col = row % 2 === 0 ? (idx % 10) : (9 - (idx % 10));
  // row 0 = bottom, row 9 = top  → invert for display
  return { col, row }; 
}

// Genera tablero aleatorio: posiciones de serpientes, escaleras y retos
export function generateBoard() {
  const used = new Set([1, 100]);

  // Devuelve un número libre en [min, max], lo marca como usado
  function pick(min, max) {
    if (min > max) return -1;
    const candidates = [];
    for (let v = min; v <= max; v++) if (!used.has(v)) candidates.push(v);
    if (candidates.length === 0) return -1;
    const val = candidates[Math.floor(Math.random() * candidates.length)];
    used.add(val);
    return val;
  }

  // Serpientes: cabeza alta, cola baja — diferencia mínima 12
  const snakes = [];
  for (let i = 0; i < SNAKE_MESSAGES.length; i++) {
    const head = pick(22, 98);
    if (head === -1) continue;
    const minTail = Math.max(2, head - 40);
    const maxTail = head - 12;
    const tail = pick(minTail, maxTail);
    if (tail === -1) { used.delete(head); continue; }
    snakes.push({ id: `snake-${i}`, head, tail, ...SNAKE_MESSAGES[i] });
  }

  // Serpiente Global (casilla especial, todos bajan 10)
  const globalSnakeCell = pick(30, 85) || 50;

  // Escaleras: base baja, cima alta — diferencia mínima 12
  const ladders = [];
  for (let i = 0; i < LADDER_MESSAGES.length; i++) {
    const base = pick(2, 78);
    if (base === -1) continue;
    const minTop = base + 12;
    const maxTop = Math.min(99, base + 50);
    const top = pick(minTop, maxTop);
    if (top === -1) { used.delete(base); continue; }
    ladders.push({ id: `ladder-${i}`, base, top, ...LADDER_MESSAGES[i] });
  }

  // Casillas Reto (8 ocultas)
  const challenges = [];
  const shuffledChallenges = [...CHALLENGES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < 8; i++) {
    const cell = pick(5, 95);
    if (cell === -1) continue;
    challenges.push({ id: `challenge-${i}`, cell, challenge: shuffledChallenges[i % shuffledChallenges.length] });
  }

  console.log('🎲 Board generated:', {
    snakes: snakes.map(s => `${s.head}→${s.tail}`),
    ladders: ladders.map(l => `${l.base}→${l.top}`),
    challenges: challenges.map(c => c.cell),
    globalSnakeCell,
  });

  return { snakes, ladders, challenges, globalSnakeCell };
}
