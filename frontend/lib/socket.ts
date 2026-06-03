import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocketUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

export function getDealChatSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('Socket is only available in the browser');
  }

  const token = localStorage.getItem('gigmatch_access');
  if (!token) throw new Error('Not authenticated');

  if (!socket) {
    socket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  } else if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  }

  return socket;
}

export function disconnectDealChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
