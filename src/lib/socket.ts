import { io, Socket } from "socket.io-client";

let socket: Socket;

export const connectSocket = (token: string) => {
  socket = io(import.meta.env.VITE_API_URL, {
    auth: {
      token,
    },
  });

  socket.on("connect", () => {
    console.log("Conectado ao socket:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Erro ao conectar no socket:", err.message);
  });

  return socket;
};

export const getSocket = () => socket;
