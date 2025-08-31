import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { ReactNode, useEffect, useState } from "react";
import { AuthContext } from "./context";
import { User, UserLoginResponse } from "./types";
import { SessionRecorder } from "@/components/SessionRecorder";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post<UserLoginResponse>("/user/login", {
        email,
        password,
      });

      saveUserData(data);

      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${data.user.name}!`,
      });
    } catch (error) {
      toast({
        title: "Erro ao realizar login",
        description:
          error.response?.data?.message || error.message || "Erro inesperado",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/user/register", {
        name,
        email,
        password,
      });

      toast({
        title: "Cadastro realizado com sucesso",
        description: "Conta criada com sucesso. Você pode agora fazer login.",
      });
    } catch (error) {
      toast({
        title: "Erro ao realizar cadastro",
        description:
          error.response?.data?.message || error.message || "Erro inesperado",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeUserData();

    toast({
      title: "Logout realizado com sucesso",
      description: "Você foi deslogado com sucesso.",
    });
  };

  const saveUserData = (userData: UserLoginResponse) => {
    setUser(userData.user);
    localStorage.setItem("user", JSON.stringify(userData.user));
    localStorage.setItem("token", userData.token);
  };

  const removeUserData = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {user && (
        <SessionRecorder
          userId={user.id}
          userData={{
            name: user.name,
            email: user.email,
            companyId: user.companyId,
          }}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
};
