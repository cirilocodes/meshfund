import { STORAGE_KEYS, secureStorage } from './storage';

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: number;
}

export interface WebSocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: any) => void;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private isAuthenticated = false;

  constructor() {
    this.url = __DEV__ 
      ? 'ws://localhost:8000/ws'
      : 'wss://api.meshfund.com/ws';
  }

  connect(callbacks: WebSocketCallbacks = {}) {
    this.callbacks = callbacks;
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      console.log('Connecting to WebSocket:', this.url);
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.callbacks.onError?.(error);
    }
  }

  private async handleOpen() {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.callbacks.onConnect?.();
    
    // Authenticate the WebSocket connection
    await this.authenticate();
  }

  private async authenticate() {
    try {
      const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        this.send({
          type: 'auth',
          token,
        });
      }
    } catch (error) {
      console.error('Failed to authenticate WebSocket:', error);
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('WebSocket message received:', message);
      
      // Handle authentication response
      if (message.type === 'auth_success') {
        this.isAuthenticated = true;
        console.log('WebSocket authenticated successfully');
      } else if (message.type === 'auth_error') {
        console.error('WebSocket authentication failed:', message.data);
        this.isAuthenticated = false;
      }
      
      this.callbacks.onMessage?.(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent) {
    console.log('WebSocket disconnected:', event.reason);
    this.isAuthenticated = false;
    this.callbacks.onDisconnect?.();
    
    // Attempt to reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect(this.callbacks);
      }, this.reconnectInterval * Math.pow(2, this.reconnectAttempts)); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleError(error: any) {
    console.error('WebSocket error:', error);
    this.callbacks.onError?.(error);
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const messageWithTimestamp = {
        ...message,
        timestamp: Date.now(),
      };
      this.ws.send(JSON.stringify(messageWithTimestamp));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  joinGroup(groupId: string) {
    this.send({
      type: 'join_group',
      data: { groupId },
    });
  }

  leaveGroup(groupId: string) {
    this.send({
      type: 'leave_group',
      data: { groupId },
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }
}

// Create singleton instance
export const websocketClient = new WebSocketClient();

// Convenience functions
export const connectWebSocket = (callbacks?: WebSocketCallbacks) => {
  websocketClient.connect(callbacks);
};

export const disconnectWebSocket = () => {
  websocketClient.disconnect();
};

export const sendWebSocketMessage = (message: WebSocketMessage) => {
  websocketClient.send(message);
};

export const joinGroupRoom = (groupId: string) => {
  websocketClient.joinGroup(groupId);
};

export const leaveGroupRoom = (groupId: string) => {
  websocketClient.leaveGroup(groupId);
};
