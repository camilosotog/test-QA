
import app from "./app";
import { createServer } from "http";
import { Server } from "socket.io";
import runMigrations from "./utils/migrations";
import { saveDrawingPoint, getCurrentDrawingData } from "./controllers/drawing.controller";
import { gameWords } from "./gameWords-extended";

const port = process.env.PORT || 4000;
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 💬 Almacenar mensajes en memoria (en producción usar BD)
let chatMessages: any[] = [];

// 🎮 Estado del juego Pictionary
interface Player {
  socketId: string;
  username: string;
  score: number;
  isOnline: boolean;
}

interface GameState {
  drawerIndex: number; // índice del dibujante actual en la lista de jugadores
  drawerTurn: number; // cuántos han dibujado en la ronda actual
  round: number; // número de ronda actual
  maxRounds: number; // total de rondas
  isActive: boolean;
  currentDrawer: string | null; // socketId del dibujante actual
  currentWord: string;
  timeLeft: number;
  players: Map<string, Player>;
  gameTimer: NodeJS.Timeout | null;
  correctGuessers: Set<string>; // socketId de quienes ya adivinaron
  guessersPoints: Map<string, number>; // socketId -> puntos obtenidos en la ronda
  wordHint: string[]; // array de caracteres de la pista (_, letras reveladas, espacios)
  hintTimer: NodeJS.Timeout | null; // timer para revelar pistas cada 30s
  revealedPositions: Set<number>; // posiciones de letras ya reveladas
}

// gameWords importado de gameWords-extended.ts (1000 palabras)

let gameState: GameState = {
  isActive: false,
  currentDrawer: null,
  currentWord: '',
  timeLeft: 80,
  players: new Map(),
  gameTimer: null,
  correctGuessers: new Set(),
  guessersPoints: new Map(),
  round: 1,
  maxRounds: 3,
  drawerTurn: 0,
  drawerIndex: 0,
  wordHint: [],
  hintTimer: null,
  revealedPositions: new Set()
};

// Funciones auxiliares del juego

// Devuelve un array de N palabras aleatorias únicas
function getRandomWords(count = 5): string[] {
  const shuffled = [...gameWords].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Genera la pista inicial de la palabra (espacios y guiones bajos)
function generateInitialHint(word: string): string[] {
  return word.split('').map(char => {
    if (char === ' ') return ' '; // mantener espacios
    return '_'; // ocultar letras
  });
}

// Revela una letra aleatoria que aún no esté revelada
function revealRandomLetter(): void {
  if (!gameState.currentWord || gameState.wordHint.length === 0) return;
  
  // Encontrar posiciones de letras que aún no están reveladas (excluyendo espacios)
  const hiddenPositions: number[] = [];
  for (let i = 0; i < gameState.currentWord.length; i++) {
    const char = gameState.currentWord[i];
    if (char !== ' ' && !gameState.revealedPositions.has(i)) {
      hiddenPositions.push(i);
    }
  }
  
  // Si no hay letras por revelar, no hacer nada
  if (hiddenPositions.length === 0) return;
  
  // Seleccionar una posición aleatoria
  const randomIndex = Math.floor(Math.random() * hiddenPositions.length);
  const positionToReveal = hiddenPositions[randomIndex];

  // Verificar que la posición es válida y no es undefined
  if (
    typeof positionToReveal === 'number' &&
    positionToReveal >= 0 &&
    positionToReveal < gameState.currentWord.length
  ) {
    // Revelar la letra en esa posición
    gameState.wordHint[positionToReveal] = gameState.currentWord[positionToReveal] ?? '';
    gameState.revealedPositions.add(positionToReveal);

    // Enviar la pista actualizada a todos los jugadores (excepto al dibujante)
    const hintDisplay = gameState.wordHint.join(' ');
    io.emit('word-hint-update', { hint: hintDisplay });

    console.log('🔍 Letra revelada:', gameState.currentWord[positionToReveal] ?? '', '- Pista actual:', hintDisplay);
  }
}

// Inicia el timer de pistas (revela una letra cada 30 segundos)
function startHintTimer(): void {
  if (gameState.hintTimer) {
    clearInterval(gameState.hintTimer);
  }
  
  gameState.hintTimer = setInterval(() => {
    revealRandomLetter();
  }, 30000); // 30 segundos
}

function getNextDrawer(): string | null {
  const onlinePlayers = Array.from(gameState.players.values()).filter(p => p.isOnline);
  if (onlinePlayers.length === 0) return null;
  // Si es la primera ronda, usar drawerIndex, si no, avanzar el índice
  if (typeof gameState.drawerIndex !== 'number' || gameState.drawerIndex >= onlinePlayers.length) {
    gameState.drawerIndex = 0;
  }
  const player = onlinePlayers[gameState.drawerIndex];
  return player ? player.socketId : null;
}


function startGameRound(): void {
  console.log('🎮 Iniciando nueva ronda del juego');
  const onlinePlayersStart = Array.from(gameState.players.values()).filter(p => p.isOnline);
  if (gameState.round > gameState.maxRounds) {
    io.emit('game-over', { message: 'Juego finalizado', players: Array.from(gameState.players.values()) });
    return;
  }
  if (gameState.drawerTurn >= onlinePlayersStart.length) {
    gameState.round++;
    gameState.drawerTurn = 0;
    if (gameState.round > gameState.maxRounds) {
      io.emit('game-over', { message: 'Juego finalizado', players: Array.from(gameState.players.values()) });
      return;
    }
  }
  gameState.currentDrawer = getNextDrawer();
  gameState.drawerTurn++;
  // Avanzar el índice del dibujante para la próxima ronda
  const onlinePlayersDrawer = Array.from(gameState.players.values()).filter(p => p.isOnline);
  if (onlinePlayersDrawer.length > 0) {
    gameState.drawerIndex = (gameState.drawerIndex + 1) % onlinePlayersDrawer.length;
  }
  // 🔥 Resetear currentWord ANTES de enviar opciones
  gameState.currentWord = '';
  gameState.timeLeft = 80;
  gameState.isActive = true;
  gameState.correctGuessers = new Set();
  gameState.guessersPoints = new Map();
  
  // Resetear sistema de pistas
  gameState.wordHint = [];
  gameState.revealedPositions = new Set();
  if (gameState.hintTimer) {
    clearInterval(gameState.hintTimer);
    gameState.hintTimer = null;
  }

  // Limpiar canvas
  io.emit('drawing-cleared');

  // Notificar estado del juego (sin palabra)
  io.emit('game-state-update', {
    isActive: gameState.isActive,
    currentDrawer: gameState.currentDrawer,
    timeLeft: gameState.timeLeft,
    players: Array.from(gameState.players.values()),
    round: gameState.round,
    maxRounds: gameState.maxRounds
  });

  // 🔥 Resetear la palabra actual del dibujante en frontend
  if (gameState.currentDrawer) {
    // Emitir palabra vacía para limpiar en el frontend
    io.to(gameState.currentDrawer).emit('word-to-draw', '');
    // Enviar 5 palabras al dibujante para que elija
    const options = getRandomWords(5);
    io.to(gameState.currentDrawer).emit('choose-word', options);
  }
}

function endGameRound(reason: string): void {
  console.log('🎮 Terminando ronda:', reason);
  
  if (gameState.gameTimer) {
    clearInterval(gameState.gameTimer);
    gameState.gameTimer = null;
  }
  
  // Limpiar timer de pistas
  if (gameState.hintTimer) {
    clearInterval(gameState.hintTimer);
    gameState.hintTimer = null;
  }
  
  gameState.isActive = false;
  
  // Asignar puntos al dibujante: suma total de los puntos de los adivinadores
  if (gameState.currentDrawer && gameState.guessersPoints && gameState.guessersPoints.size > 0) {
    const total = Array.from(gameState.guessersPoints.values()).reduce((a, b) => a + b, 0);
    const drawer = gameState.players.get(gameState.currentDrawer);
    if (drawer) {
      drawer.score += total;
    }
  }

  // Notificar fin de ronda
  io.emit('round-ended', {
    reason,
    word: gameState.currentWord,
    players: Array.from(gameState.players.values()),
    round: gameState.round,
    maxRounds: gameState.maxRounds
  });

  // Limpiar puntos y aciertos para la siguiente ronda
  gameState.guessersPoints = new Map();
  gameState.correctGuessers = new Set();

  // Esperar 5 segundos antes de la siguiente ronda
  setTimeout(() => {
    const onlinePlayers = Array.from(gameState.players.values()).filter(p => p.isOnline);
    if (onlinePlayers.length >= 2 && gameState.round <= gameState.maxRounds) {
      startGameRound();
    } else if (gameState.round > gameState.maxRounds) {
      io.emit('game-over', { message: 'Juego finalizado', players: Array.from(gameState.players.values()) });
    }
  }, 5000);
  // Si es la primera ronda, round=1; si es reinicio, resetear round
  if (gameState.round > gameState.maxRounds) {
    gameState.round = 1;
  }
}

function addPlayer(socketId: string, username: string): void {
  gameState.players.set(socketId, {
    socketId,
    username,
    score: 0,
    isOnline: true
  });
  
  console.log('🎮 Jugador agregado:', username);
}

function removePlayer(socketId: string): void {
  if (gameState.players.has(socketId)) {
    gameState.players.get(socketId)!.isOnline = false;
    console.log('🎮 Jugador desconectado:', socketId);
    
    // Si era el dibujante actual, terminar ronda
    if (gameState.currentDrawer === socketId && gameState.isActive) {
      endGameRound('El dibujante se desconectó');
    }
  }
}

function checkWordGuess(message: string, guesserSocketId: string): boolean {
  if (!gameState.isActive || guesserSocketId === gameState.currentDrawer) {
    return false;
  }

  const normalizedMessage = message.toLowerCase().trim();
  const normalizedWord = gameState.currentWord.toLowerCase().trim();

  if (normalizedMessage === normalizedWord) {
    // Si ya adivinó antes, ignorar
    if (gameState.correctGuessers.has(guesserSocketId)) {
      return false;
    }
    // Otorgar puntos al adivinador igual al tiempo restante
    const guesser = gameState.players.get(guesserSocketId);
    if (guesser) {
      guesser.score += gameState.timeLeft;
      gameState.guessersPoints.set(guesserSocketId, gameState.timeLeft);
    }
    // Registrar que este jugador ya adivinó
    gameState.correctGuessers.add(guesserSocketId);
    return true;
  }
  return false;
}

// 🔥 Logs de conexión Socket.IO
io.on('connection', (socket) => {

  // Enviar datos actuales del dibujo al usuario que se conecta
  const currentData = getCurrentDrawingData();
  socket.emit('drawing-data', currentData);

  // Enviar historial de mensajes de chat al usuario que se conecta
  socket.emit('chat-history', chatMessages);

  // Enviar estado actual del juego
  socket.emit('game-state-update', {
    isActive: gameState.isActive,
    currentDrawer: gameState.currentDrawer,
    timeLeft: gameState.timeLeft,
    players: Array.from(gameState.players.values())
  });
  
  // Enviar pista actual si hay un juego activo y una palabra elegida
  if (gameState.isActive && gameState.currentWord && gameState.wordHint.length > 0) {
    const hintDisplay = gameState.wordHint.join(' ');
    socket.emit('word-hint-update', { hint: hintDisplay });
  }

  // Evento para recibir datos de dibujo
  socket.on('drawing', (data) => {
    // Solo permitir dibujar al dibujante actual
    if (gameState.isActive && socket.id === gameState.currentDrawer) {
      // Guardar punto en memoria
      saveDrawingPoint({
        ...data,
        socketId: socket.id
      });
      
      // Retransmitir a todos los demás usuarios (excepto el emisor)
      socket.broadcast.emit('drawing', data);
    }
  });

  // Evento para limpiar canvas
  socket.on('clear-canvas', () => {
    // Solo permitir limpiar al dibujante actual
    if (gameState.isActive && socket.id === gameState.currentDrawer) {
      io.emit('drawing-cleared');
    }
  });

  // 💬 Evento para recibir mensajes de chat
  socket.on('chat-message', (messageData) => {
    
    const chatMessage = {
      id: Date.now().toString(),
      username: messageData.username,
      message: messageData.message,
      timestamp: new Date().toISOString(),
      socketId: socket.id
    };

    // Verificar si es una adivinanza correcta
    const isCorrectGuess = checkWordGuess(messageData.message, socket.id);
    
    if (isCorrectGuess) {
      // Mensaje especial para adivinanza correcta (sin mostrar la palabra)
      const winMessage = {
        ...chatMessage,
        message: `🎉 ${messageData.username} adivinó la palabra!`,
        isSystemMessage: true
      };
      chatMessages.push(winMessage);
      io.emit('chat-message', winMessage);

      // Verificar si todos los jugadores (excepto el dibujante) ya adivinaron
      const onlinePlayers = Array.from(gameState.players.values()).filter(p => p.isOnline && p.socketId !== gameState.currentDrawer);
      if (gameState.correctGuessers.size >= onlinePlayers.length && onlinePlayers.length > 0) {
        endGameRound('Todos adivinaron la palabra');
      }
    } else {
      // Mensaje normal de chat
      chatMessages.push(chatMessage);
      // Limitar historial a 100 mensajes
      if (chatMessages.length > 100) {
        chatMessages = chatMessages.slice(-100);
      }
      // Enviar mensaje a todos los usuarios (incluyendo el emisor)
      io.emit('chat-message', chatMessage);
    }
    
    console.log('📤 Mensaje enviado a todos los usuarios:', chatMessage);
  });

  // 🎮 Evento para unirse al juego
  socket.on('join-drawing', (username) => {
    console.log('👤 Usuario se unió al dibujo:', username, '- Socket ID:', socket.id);
    
    // Agregar jugador al juego
    addPlayer(socket.id, username);
    
    // Notificar a otros usuarios
    socket.broadcast.emit('user-joined', {
      username,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
    
    // Enviar estado actualizado del juego
    io.emit('game-state-update', {
      isActive: gameState.isActive,
      currentDrawer: gameState.currentDrawer,
      timeLeft: gameState.timeLeft,
      players: Array.from(gameState.players.values())
    });
    
    // El juego solo inicia manualmente con el botón "Iniciar Juego"
  });


  // 🎮 Evento para iniciar juego manualmente
  socket.on('start-game', () => {
    const onlinePlayers = Array.from(gameState.players.values()).filter(p => p.isOnline);
    if (onlinePlayers.length >= 2 && !gameState.isActive) {
      // Resetear puntajes y estado de todos los jugadores
      gameState.players.forEach((player) => {
        player.score = 0;
      });
      // Resetear ronda y turnos
      gameState.round = 1;
      gameState.maxRounds = 3;
      gameState.drawerTurn = 0;
      gameState.drawerIndex = 0;
      // Limpiar chat
      chatMessages = [];
      // Limpiar palabra y estado
      gameState.currentWord = '';
      gameState.correctGuessers = new Set();
      gameState.guessersPoints = new Map();
      // Iniciar juego
      startGameRound();
      // Notificar chat vacío
      io.emit('chat-history', []);
    }
  });

  // 🎮 Evento para recibir la palabra elegida por el dibujante
  socket.on('word-chosen', (word) => {
    // Solo el dibujante puede elegir
    if (socket.id === gameState.currentDrawer && gameState.isActive && !gameState.currentWord) {
      if (typeof word === 'string' && word.length > 0) {
        gameState.currentWord = word;

        // Inicializar sistema de pistas
        gameState.wordHint = generateInitialHint(word);
        gameState.revealedPositions = new Set();
        
        // Enviar pista inicial a todos los jugadores (excepto al dibujante)
        const hintDisplay = gameState.wordHint.join(' ');
        socket.broadcast.emit('word-hint-update', { hint: hintDisplay });

        // Notificar solo al dibujante la palabra elegida (por si quiere mostrarla)
        io.to(gameState.currentDrawer).emit('word-to-draw', gameState.currentWord);

        // Iniciar timer de pistas (primera pista después de 30 segundos)
        startHintTimer();

        // Iniciar timer del juego
        if (gameState.gameTimer) {
          clearInterval(gameState.gameTimer);
        }
        gameState.gameTimer = setInterval(() => {
          gameState.timeLeft--;
          io.emit('game-timer-update', gameState.timeLeft);
          if (gameState.timeLeft <= 0) {
            endGameRound('Tiempo agotado');
          }
        }, 1000);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Usuario desconectado:', socket.id);
    
    // Remover jugador del juego
    removePlayer(socket.id);
    
    socket.broadcast.emit('user-left', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
    
    // Enviar estado actualizado del juego
    io.emit('game-state-update', {
      isActive: gameState.isActive,
      currentDrawer: gameState.currentDrawer,
      timeLeft: gameState.timeLeft,
      players: Array.from(gameState.players.values()).filter(p => p.isOnline)
    });
  });
});

// Ejecutar migraciones antes de iniciar el servidor
runMigrations().then(() => {
  httpServer.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}).catch((error) => {
  console.error('Error ejecutando migraciones:', error);
  process.exit(1);
});
