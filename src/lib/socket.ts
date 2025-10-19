import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(import.meta.env.VITE_API_URL, {
    auth: {
      token: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("Conectado ao socket:", socket?.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Erro ao conectar no socket:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket desconectado:", reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
