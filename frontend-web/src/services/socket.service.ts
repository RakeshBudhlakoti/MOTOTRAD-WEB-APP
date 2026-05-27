import { io, Socket } from 'socket.io-client';
import { WEB_CONSTANTS } from '@/constants/app.constants';

const SOCKET_URL = WEB_CONSTANTS.WS_URL;

class SocketService {
  private socket: Socket | null = null;
  private currentToken: string | null = null;

  connect() {
    if (this.socket?.connected) return;
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    this.currentToken = token;
    console.log('[SocketService] Connecting to:', SOCKET_URL, 'Namespace: /auctions', 'Token present:', !!token);

    // Using the official way to connect to a namespace
    this.socket = io(`${SOCKET_URL}/auctions`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      auth: {
        token: token ? `Bearer ${token}` : null
      }
    });

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected. ID:', this.socket?.id);
    });

    this.socket.onAny((event, ...args) => {
      console.log(`[SocketService] Global Received: ${event}`, args);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected. Reason:', reason);
    });

    this.socket.on('error', (err) => {
      console.error('[SocketService] Error:', err);
    });
  }

  reconnectWithToken(token: string) {
    console.log('[SocketService] Reconnecting with new token');
    this.currentToken = token;
    if (this.socket) {
      this.socket.auth = { token: `Bearer ${token}` };
      this.socket.disconnect().connect();
    } else {
      this.connect();
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  private ensureAuthenticated() {
    if (!this.socket) {
      this.connect();
    } else {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (token && token !== this.currentToken) {
        console.log('[SocketService] Socket token out of sync or guest upgraded. Reconnecting with token.');
        this.reconnectWithToken(token);
      }
    }
  }

  emit(event: string, data: any) {
    this.ensureAuthenticated();
    console.log('[SocketService] Emit:', event, data);
    this.socket?.emit(event, data);
  }

  on(event: string, callback: (data: any) => void) {
    this.ensureAuthenticated();
    console.log('[SocketService] Register Listener:', event);
    this.socket?.on(event, callback);
  }

  once(event: string, callback: (data: any) => void) {
    this.ensureAuthenticated();
    console.log('[SocketService] Register One-time Listener:', event);
    this.socket?.once(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        console.log('[SocketService] Remove Listener:', event);
        this.socket.off(event, callback);
      } else {
        console.log('[SocketService] Remove All Listeners:', event);
        this.socket.off(event);
      }
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();
