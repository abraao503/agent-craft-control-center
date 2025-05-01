import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  "https://cooing-quintina-abraaos-cb124017.koyeb.app";

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

const removeUserData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        "Erro da API:",
        error.response.data.message || "Erro desconhecido"
      );

      if (error.response.status === 401) {
        removeUserData();
        window.location.href = "/";
      }
    } else if (error.request) {
      console.error("Sem resposta do servidor");
    } else {
      console.error("Erro desconhecido", error.message);
    }

    return Promise.reject(error);
  }
);
