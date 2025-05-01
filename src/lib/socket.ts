import { io, Socket } from "socket.io-client";

let socket: Socket;

export const connectSocket = (token: string) => {
  socket = io("https://cooing-quintina-abraaos-cb124017.koyeb.app", {
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
