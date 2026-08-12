import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { ReactNode, useEffect, useState } from "react";
import { AuthContext } from "./context";
import { User, UserLoginResponse } from "./types";
import { SessionRecorder } from "@/components/SessionRecorder";
import { UserProfile } from "@/types/auth";
import { getUserProfile } from "@/services/auth/getUserProfile";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { translateAuthError } from "@/utils/authErrorTranslations";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      loadUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to load user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post<UserLoginResponse>("/user/login", {
        email,
        password,
      });

      saveUserData(data);

      toast({
        title: t("auth.loginSuccess"),
        description: t("auth.loginWelcome", { name: data.user.name }),
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || error.message;
        toast({
          title: t("auth.loginFailed"),
          description: translateAuthError(message, t("auth.genericError")),
          variant: "destructive",
        });
      }

      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const { data } = await api.post("/user/register", {
        name,
        email,
        password,
      });

      toast({
        title: t("auth.signupSuccess"),
        description: t("auth.accountCreated"),
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message || error.message;
        toast({
          title: t("auth.signupFailed"),
          description: translateAuthError(message, t("auth.genericError")),
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const logout = () => {
    removeUserData();

    toast({
      title: t("auth.logoutSuccess"),
      description: t("auth.loggedOut"),
    });
  };

  const saveUserData = (userData: UserLoginResponse) => {
    setUser(userData.user);
    localStorage.setItem("user", JSON.stringify(userData.user));
    localStorage.setItem("token", userData.token);
    loadUserProfile();
  };

  const removeUserData = () => {
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        login,
        signup,
        logout,
        loadUserProfile,
      }}
    >
      {user && (
        <SessionRecorder
          userId={user.id}
          userData={{
            name: user.name,
            email: user.email,
            companyId: user.companyId,
            role: user.role,
          }}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
};
