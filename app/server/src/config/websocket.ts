import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';

export class websocket {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', (ws, req) => {
      const sessionId = this.getSessionIdFromCookie(req.headers.cookie);
      if (sessionId) {
        this.clients.set(sessionId, ws);

        ws.on('close', () => {
          this.clients.delete(sessionId);
        });
      }
    });
  }

  private getSessionIdFromCookie(cookieHeader?: string): string | null {
    if (!cookieHeader) return null;
    const matches = cookieHeader.match(/sessionId=([^;]+)/);
    return matches ? matches[1] : null;
  }

  public notifyClient(sessionId: string, data: any) {
    const client = this.clients.get(sessionId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }
}
