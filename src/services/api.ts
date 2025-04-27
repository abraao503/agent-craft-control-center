import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Aqui sim pega os erros da API (400, 401, 500, etc)
    if (error.response) {
      console.error(
        "Erro da API:",
        error.response.data.message || "Erro desconhecido"
      );
    } else if (error.request) {
      console.error("Sem resposta do servidor");
    } else {
      console.error("Erro desconhecido", error.message);
    }

    return Promise.reject(error);
  }
);
