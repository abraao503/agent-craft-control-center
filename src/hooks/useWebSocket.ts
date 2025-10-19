import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  workspaceId: string;
  token: string;
  enabled?: boolean;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  joinedWorkspace: boolean;
}

export const useWebSocket = ({
  workspaceId,
  token,
  enabled = true,
}: UseWebSocketOptions): UseWebSocketReturn => {
  const [connected, setConnected] = useState(false);
  const [joinedWorkspace, setJoinedWorkspace] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !workspaceId || !token) {
      return;
    }

    const socket = io(import.meta.env.VITE_API_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setConnected(true);
      
      // Join workspace on connect
      socket.emit('join:workspace', { workspaceId });
    });

    socket.on('joined:workspace', (data) => {
      console.log('Joined workspace:', data.workspaceId);
      setJoinedWorkspace(true);
    });

    socket.on('left:workspace', (data) => {
      console.log('Left workspace:', data.workspaceId);
      setJoinedWorkspace(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnected(false);
      setJoinedWorkspace(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      // Re-join workspace after reconnection
      socket.emit('join:workspace', { workspaceId });
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });

    socket.on('error', (data) => {
      console.error('WebSocket error:', data.message);
    });

    return () => {
      if (socket.connected) {
        socket.emit('leave:workspace', { workspaceId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [workspaceId, token, enabled]);

  return {
    socket: socketRef.current,
    connected,
    joinedWorkspace,
  };
};
