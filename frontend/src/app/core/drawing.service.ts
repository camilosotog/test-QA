
import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface DrawingPoint {
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  color: string;
  lineWidth: number;
  isDrawing: boolean;
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  socketId: string;
  isSystemMessage?: boolean;
}

export interface User {
  username: string;
  socketId: string;
  timestamp: string;
}

export interface Player {
  socketId: string;
  username: string;
  score: number;
  isOnline: boolean;
}

export interface GameState {
  isActive: boolean;
  currentDrawer: string | null;
  timeLeft: number;
  players: Player[];
  round?: number;
  maxRounds?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DrawingService {
  public socket!: any;
  private apiUrl = '/api/drawing';
  
  // Subjects para manejar estado
  private connectedUsersSubject = new BehaviorSubject<User[]>([]);
  public connectedUsers$ = this.connectedUsersSubject.asObservable();
  
  private drawingDataSubject = new BehaviorSubject<any[]>([]);
  public drawingData$ = this.drawingDataSubject.asObservable();

  private chatMessagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public chatMessages$ = this.chatMessagesSubject.asObservable();

  // 🎮 Estado del juego
  private gameStateSubject = new BehaviorSubject<GameState>({
    isActive: false,
    currentDrawer: null,
    timeLeft: 0,
    players: [],
    round: 1,
    maxRounds: 3
  });
  public gameState$ = this.gameStateSubject.asObservable();

  private currentWordSubject = new BehaviorSubject<string>('');
  public currentWord$ = this.currentWordSubject.asObservable();

  private timerSubject = new BehaviorSubject<number>(0);
  public timer$ = this.timerSubject.asObservable();


  // Palabras sugeridas para elegir (solo para el dibujante)
  private wordOptionsSubject: BehaviorSubject<string[] | null> = new BehaviorSubject<string[] | null>(null);
  public wordOptions$ = this.wordOptionsSubject.asObservable();

  // Pistas de la palabra para adivinadores
  private wordHintSubject = new BehaviorSubject<string>('');
  public wordHint$ = this.wordHintSubject.asObservable();

  constructor(private http: HttpClient) {
    // Inicializar Socket.io
    this.socket = io('http://192.168.56.1:4000', {
      autoConnect: false
    });
    this.setupSocketListeners();
  }

  // Observable para el fin del juego
  private gameOverSubject = new BehaviorSubject<{ message: string, players: Player[] } | null>(null);
  public gameOver$ = this.gameOverSubject.asObservable();

  private setupSocketListeners(): void {
        // Evento de fin de juego
        this.socket.on('game-over', (data: { message: string, players: Player[] }) => {
          console.log('🏆 Juego finalizado:', data);
          this.gameOverSubject.next(data);
        });
    // Recibir datos de dibujo de otros usuarios
    this.socket.on('drawing', (data: DrawingPoint) => {
      this.onDrawingReceived(data);
    });

    // Recibir datos iniciales del dibujo al conectarse
    this.socket.on('drawing-data', (data: any[]) => {
      this.drawingDataSubject.next(data);
    });

    // Canvas limpiado
    this.socket.on('drawing-cleared', () => {
      this.drawingDataSubject.next([]);
    });

    // Recibir mensaje de chat
    this.socket.on('chat-message', (message: ChatMessage) => {
      console.log('💬 Mensaje de chat recibido:', message);
      const currentMessages = this.chatMessagesSubject.value;
      this.chatMessagesSubject.next([...currentMessages, message]);
    });

    // Recibir historial de chat
    this.socket.on('chat-history', (messages: ChatMessage[]) => {
      console.log('📜 Historial de chat recibido:', messages.length, 'mensajes');
      this.chatMessagesSubject.next(messages);
    });

    // 🎮 Eventos del juego
    this.socket.on('game-state-update', (gameState: GameState) => {
      console.log('🎮 Estado del juego actualizado:', gameState);
      this.gameStateSubject.next(gameState);
    });



    // Recibir palabras sugeridas para elegir
    this.socket.on('choose-word', (options: string[]) => {
      console.log('📝 Opciones de palabras para elegir:', options);
      this.wordOptionsSubject.next(options);
    });

    this.socket.on('word-to-draw', (word: string) => {
      console.log('✏️ Palabra para dibujar:', word);
      this.currentWordSubject.next(word);
      // Limpiar opciones después de elegir
      this.wordOptionsSubject.next(null);
    });
    this.socket.on('game-timer-update', (timeLeft: number) => {
      this.timerSubject.next(timeLeft);
    });
    this.socket.on('round-ended', (data: { reason: string, word: string, players: Player[] }) => {
      console.log('🏁 Ronda terminada:', data);
      // Mostrar palabra al final de la ronda
      this.currentWordSubject.next(data.word);
      // Limpiar pistas
      this.wordHintSubject.next('');
      // Limpiar palabra después de unos segundos
      setTimeout(() => {
        this.currentWordSubject.next('');
      }, 5000);
    });

    // Recibir actualizaciones de pistas
    this.socket.on('word-hint-update', (data: { hint: string }) => {
      console.log('🔍 Pista actualizada:', data.hint);
      this.wordHintSubject.next(data.hint);
    });
    // Usuario se unió
    this.socket.on('user-joined', (user: User) => {
      console.log('Usuario se unió:', user.username);
      const currentUsers = this.connectedUsersSubject.value;
      this.connectedUsersSubject.next([...currentUsers, user]);
    });
    // Usuario se fue
    this.socket.on('user-left', (data: { socketId: string }) => {
      const currentUsers = this.connectedUsersSubject.value.filter(
        user => user.socketId !== data.socketId
      );
      this.connectedUsersSubject.next(currentUsers);
    });
    // Conexión establecida
    this.socket.on('connect', () => {
      console.log('Conectado al servidor de dibujo:', this.socket.id);
    });
    // Desconexión
    this.socket.on('disconnect', () => {
      console.log('Desconectado del servidor de dibujo');
    });
  }

  // Enviar palabra elegida al backend
  public chooseWord(word: string): void {
    this.socket.emit('word-chosen', word);
  }

  // Callback personalizable para cuando se recibe dibujo

  // Método para establecer callback de dibujo recibido

  // Conectar al socket
  connect(username: string): void {
    console.log('🔌 Conectando al dibujo colaborativo como:', username);
    this.socket.connect();
    
    // Notificar que el usuario se unió al dibujo
    this.socket.emit('join-drawing', username);
  }

  // Desconectar del socket
  disconnect(): void {
    this.socket.disconnect();
  }

  // Enviar datos de dibujo
  sendDrawingData(drawingPoint: DrawingPoint): void {
    console.log('📤 Enviando dibujo:', drawingPoint);
    this.socket.emit('drawing', drawingPoint);
  }

  // Enviar mensaje de chat
  sendChatMessage(message: string, username: string): void {
    const chatMessage = {
      message,
      username,
      timestamp: new Date().toISOString()
    };
    this.socket.emit('chat-message', chatMessage);
  }

  // Limpiar canvas
  clearCanvas(): Observable<any> {
    // Emitir evento Socket.io
    this.socket.emit('clear-canvas');
    
    // También llamar al API REST
    return this.http.post(`${this.apiUrl}/clear`, {});
  }

  // Obtener datos iniciales del dibujo (HTTP)
  getDrawingData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/data`);
  }

  // Callback personalizable para cuando se recibe dibujo
  private onDrawingReceived: (data: DrawingPoint) => void = () => {};

  // Método para establecer callback de dibujo recibido
  setDrawingReceivedCallback(callback: (data: DrawingPoint) => void): void {
    this.onDrawingReceived = callback;
  }

  // Verificar estado de conexión
  isConnected(): boolean {
    return this.socket.connected;
  }

  // Obtener ID del socket actual
  getSocketId(): string {
    return this.socket.id || '';
  }

  // 🎮 Iniciar juego manualmente
  startGame(): void {
    this.socket.emit('start-game');
  }
}