// ...
// ...
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { DrawingService, DrawingPoint, ChatMessage, GameState, Player } from '../../core/drawing.service';
import { AuthService } from '../../core/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dibujo-colaborativo',
  templateUrl: './dibujo-colaborativo.component.html',
  styleUrls: ['./dibujo-colaborativo.component.scss']
})
export class DibujoColaborativoComponent implements OnInit, OnDestroy, AfterViewInit {
      // Modal de fin de juego
      public showGameOverModal: boolean = false;
      public podiumPlayers: Player[] = [];
      public gameOverMessage: string = '';
    // Opciones de palabras para elegir (solo para el dibujante)
    public wordOptions: string[] | null = null;
    public showWordModal: boolean = false;

    // Cuando el dibujante elige una palabra
    public chooseWord(word: string): void {
      this.drawingService.chooseWord(word);
      this.showWordModal = false;
    }
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  public isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  
  // Configuración de dibujo
  currentColor = '#000000';
  lineWidth = 5;
  
  // Colores predefinidos
  colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];
  
  // Grosores predefinidos
  lineWidths = [2, 5, 10, 15, 20];
  
  // Estado
  connectedUsers: any[] = [];
  currentUser: any;
  isConnected = false;
  
  // Chat
  chatMessages: ChatMessage[] = [];
  newMessage = '';
  showChat = true;
  currentUsername = '';

  // 🎮 Estado del juego
  gameState: GameState = {
    isActive: false,
    currentDrawer: null,
    timeLeft: 0,
    players: [],
    round: 1,
    maxRounds: 3
  };

  get onlinePlayers() {
    return this.gameState.players.filter((p: any) => p.isOnline);
  }
  currentWord = '';
  timeLeft = 0;
  isMyTurn = false;
  wordHint = ''; // Pista de la palabra para mostrar a adivinadores
  
  private subscriptions: Subscription[] = [];

  constructor(
    private drawingService: DrawingService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
        // Al entrar, limpiar modal y gameOver
        this.showGameOverModal = false;
        this.podiumPlayers = [];
        this.gameOverMessage = '';
        // Limpiar gameOver$ (si el servicio lo permite)
        if (this.drawingService && (this.drawingService as any).gameOverSubject) {
          (this.drawingService as any).gameOverSubject.next(null);
        }
    // Obtener usuario actual
    this.currentUser = this.authService.getCurrentUser();
    
    // Subscribirse a usuarios conectados
    const usersSubscription = this.drawingService.connectedUsers$.subscribe(users => {
      this.connectedUsers = users;
    });
    this.subscriptions.push(usersSubscription);
    
    // Subscribirse a mensajes de chat
    const chatSubscription = this.drawingService.chatMessages$.subscribe(messages => {
      this.chatMessages = messages;
      this.chatMessages = messages;
      // Auto-scroll al último mensaje
      setTimeout(() => this.scrollChatToBottom(), 100);
    });
    this.subscriptions.push(chatSubscription);


    // 🎮 Subscribirse al estado del juego
    const gameStateSubscription = this.drawingService.gameState$.subscribe(gameState => {
      this.gameState = gameState;
      this.timeLeft = gameState.timeLeft;
      this.isMyTurn = gameState.currentDrawer === this.drawingService.getSocketId();
    });
    this.subscriptions.push(gameStateSubscription);

    // Subscribirse a las opciones de palabras
    const wordOptionsSub = this.drawingService.wordOptions$.subscribe(options => {
      if (options && this.isMyTurn && !this.currentWord) {
        this.wordOptions = options;
        this.showWordModal = true;
      } else {
        this.wordOptions = null;
        this.showWordModal = false;
      }
    });
    this.subscriptions.push(wordOptionsSub);

    // Subscribirse a la palabra actual
    const wordSubscription = this.drawingService.currentWord$.subscribe(word => {
      this.currentWord = word;
    });
    this.subscriptions.push(wordSubscription);

    // Subscribirse al timer
    const timerSubscription = this.drawingService.timer$.subscribe(time => {
      this.timeLeft = time;
    });
    this.subscriptions.push(timerSubscription);

    // Subscribirse a las pistas de palabras
    const wordHintSubscription = this.drawingService.wordHint$.subscribe(hint => {
      this.wordHint = hint;
    });
    this.subscriptions.push(wordHintSubscription);
    
    // Establecer callback para dibujo recibido
    this.drawingService.setDrawingReceivedCallback((data: DrawingPoint) => {
      this.drawOnCanvas(data);
    });

    // Suscribirse a evento de limpieza de canvas
    this.drawingService.socket.on('drawing-cleared', () => {
      const canvas = this.canvasRef?.nativeElement;
      if (canvas && this.ctx) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    });

    // Suscribirse a fin de juego
    const gameOverSub = this.drawingService.gameOver$.subscribe(data => {
      if (data) {
        this.podiumPlayers = [...data.players].sort((a, b) => b.score - a.score);
        this.gameOverMessage = data.message;
        this.showGameOverModal = true;
      } else {
        this.showGameOverModal = false;
      }
    });
    this.subscriptions.push(gameOverSub);
  }



  ngAfterViewInit(): void {
    this.setupCanvas();
    // Usar setTimeout para diferir la conexión al siguiente ciclo
    setTimeout(() => {
      this.connectToDrawing();
    }, 0);
  }

  ngOnDestroy(): void {
    this.drawingService.disconnect();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    // Configurar canvas con tamaño fijo
    canvas.width = 1200;
    canvas.height = 600;
    
    // Asegurar que el canvas mantenga sus dimensiones CSS
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = '1200px';
    canvas.style.maxHeight = '600px';
    
    // Estilo inicial
    this.ctx.strokeStyle = this.currentColor;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Fondo blanco
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    this.setupCanvasEvents();
  }

  private setupCanvasEvents(): void {
    const canvas = this.canvasRef.nativeElement;
    
    // Mouse events (solo si es mi turno)
    canvas.addEventListener('mousedown', (e) => {
      if (this.isMyTurn) this.startDrawing(e);
    });
    canvas.addEventListener('mousemove', (e) => {
      if (this.isMyTurn) this.draw(e);
    });
    canvas.addEventListener('mouseup', () => {
      if (this.isMyTurn) this.stopDrawing();
    });
    canvas.addEventListener('mouseout', () => {
      if (this.isMyTurn) this.stopDrawing();
    });

    // Touch events para móvil (solo si es mi turno)
    canvas.addEventListener('touchstart', (e) => {
      if (!this.isMyTurn) return;
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchmove', (e) => {
      if (!this.isMyTurn) return;
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchend', (e) => {
      if (!this.isMyTurn) return;
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      canvas.dispatchEvent(mouseEvent);
    });
  }

  private getCanvasPosition(e: MouseEvent): { x: number, y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  private startDrawing(e: MouseEvent): void {
    this.isDrawing = true;
    const pos = this.getCanvasPosition(e);
    this.lastX = pos.x;
    this.lastY = pos.y;
    
    // Debug removido
  }

  private draw(e: MouseEvent): void {
    if (!this.isDrawing) return;
    
    const pos = this.getCanvasPosition(e);
    
    // Dibujar localmente
    const drawingPoint: DrawingPoint = {
      x: pos.x,
      y: pos.y,
      lastX: this.lastX,
      lastY: this.lastY,
      color: this.currentColor,
      lineWidth: this.lineWidth,
      isDrawing: true
    };
    
    // Dibujar en canvas local
    this.drawOnCanvas(drawingPoint);
    
    // Enviar a otros usuarios SOLO si estamos conectados
    if (this.drawingService.isConnected()) {
      this.drawingService.sendDrawingData(drawingPoint);
    } else {
      console.warn('⚠️ No conectado a Socket.io, no se puede enviar dibujo');
    }
    
    this.lastX = pos.x;
    this.lastY = pos.y;
  }

  private stopDrawing(): void {
    this.isDrawing = false;
  }

  private drawOnCanvas(data: DrawingPoint): void {
    this.ctx.beginPath();
    this.ctx.strokeStyle = data.color;
    this.ctx.lineWidth = data.lineWidth;
    this.ctx.moveTo(data.lastX, data.lastY);
    this.ctx.lineTo(data.x, data.y);
    this.ctx.stroke();
  }

  private connectToDrawing(): void {
    const user = this.authService.getCurrentUser();
    
    // Usar email como identificador si no hay username
    const username = user?.username || user?.name || user?.email || 'Usuario Anónimo';
    
    if (username && username !== 'Usuario Anónimo') {
      this.currentUsername = username;
      this.drawingService.connect(username);
      this.ngZone.run(() => {
        this.isConnected = true;
        this.cdr.detectChanges();
      });
      
      // Cargar datos iniciales con delay para asegurar conexión
      setTimeout(() => {
        this.loadInitialDrawingData();
      }, 1000);
    } else {
      console.error('❌ No hay usuario válido para conectar. Datos del usuario:', user);
      // Intentar obtener el email del token directamente
      const token = this.authService.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.email) {
            this.currentUsername = payload.email;
            this.drawingService.connect(payload.email);
            this.ngZone.run(() => {
              this.isConnected = true;
              this.cdr.detectChanges();
            });
            setTimeout(() => {
              this.loadInitialDrawingData();
            }, 1000);
          }
        } catch (e) {
          console.error('❌ Error leyendo token:', e);
        }
      }
    }
  }

  private loadInitialDrawingData(): void {
    this.drawingService.getDrawingData().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Redibujar todo el historial
          response.data.forEach((point: any) => {
            if (point.x !== undefined && point.y !== undefined) {
              this.drawOnCanvas(point);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error cargando datos de dibujo:', error);
      }
    });
  }

  // Métodos públicos para la UI
  selectColor(color: string): void {
    this.currentColor = color;
    this.ctx.strokeStyle = color;
  }

  selectLineWidth(width: number): void {
    this.lineWidth = width;
    this.ctx.lineWidth = width;
  }

  clearCanvas(): void {
    this.drawingService.clearCanvas().subscribe({
      next: () => {
        // Limpiar canvas local
        const canvas = this.canvasRef.nativeElement;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
      },
      error: (error) => {
        console.error('Error limpiando canvas:', error);
      }
    });
  }

  downloadCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const link = document.createElement('a');
    link.download = `dibujo-colaborativo-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }

  // Métodos de Chat
  sendMessage(): void {
    if (this.newMessage.trim() && this.currentUsername) {
      this.drawingService.sendChatMessage(this.newMessage.trim(), this.currentUsername);
      this.newMessage = '';
    } else {
      console.warn('⚠️ No se puede enviar mensaje: mensaje vacío o sin username');
    }
  }

  onMessageKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  toggleChat(): void {
    this.showChat = !this.showChat;
  }

  private scrollChatToBottom(): void {
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  formatMessageTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 🎮 Métodos del juego
  startGame(): void {
    this.drawingService.startGame();
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getCurrentDrawerName(): string {
    const drawer = this.gameState.players.find(p => p.socketId === this.gameState.currentDrawer);
    return drawer ? drawer.username : 'Desconocido';
  }

  // Método requerido por el guardia para saber si el juego está activo
  public isGameActive(): boolean {
    return !!this.gameState.isActive;
  }

  // Terminar juego y expulsar a todos (solo ADMIN)
  endGameAndKickAll() {
    // Limpiar canvas y estado
    this.clearCanvas();
    // Notificar a todos los jugadores (puedes emitir un evento socket si tienes backend)
    // Si tienes lógica de expulsión real, implementa aquí la llamada al backend/socket
    // Finalizar juego
    if (this.drawingService && (this.drawingService as any).gameOverSubject) {
      (this.drawingService as any).gameOverSubject.next({
        message: 'El administrador ha finalizado el juego y expulsado a todos.'
      });
    }
    // Opcional: limpiar estado local
    this.gameState.isActive = false;
    this.connectedUsers = [];
    this.chatMessages = [];
    this.podiumPlayers = [];
    this.showGameOverModal = false;
    this.currentWord = '';
    // Redirigir o recargar si se requiere
  }
}