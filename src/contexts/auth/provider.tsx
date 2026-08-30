import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { AuthContext } from "./context";
import { User, UserLoginResponse } from "./types";
import { SessionRecorder } from "@/components/SessionRecorder";
import { UserProfile } from "@/types/auth";
import { getUserProfile } from "@/services/auth/getUserProfile";
import { startUserImpersonation } from "@/services/user/startUserImpersonation";
import { stopUserImpersonation } from "@/services/user/stopUserImpersonation";
import { disconnectSocket } from "@/lib/socket";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { translateAuthError } from "@/utils/authErrorTranslations";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
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

  const impersonateUser = async (userId: string, reason: string) => {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const previousWorkspace = localStorage.getItem("selectedWorkspace");

    sessionStorage.setItem("impersonationReturnPath", currentPath);
    if (previousWorkspace) {
      sessionStorage.setItem(
        "impersonationPreviousWorkspace",
        previousWorkspace,
      );
    } else {
      sessionStorage.removeItem("impersonationPreviousWorkspace");
    }

    try {
      const session = await startUserImpersonation({ userId, reason });
      applySwitchedSession(session, "/dashboard");
    } catch (error) {
      sessionStorage.removeItem("impersonationPreviousWorkspace");
      sessionStorage.removeItem("impersonationReturnPath");
      throw error;
    }
  };

  const stopImpersonation = async () => {
    const session = await stopUserImpersonation();
    const previousWorkspace = sessionStorage.getItem(
      "impersonationPreviousWorkspace",
    );
    const returnPath =
      sessionStorage.getItem("impersonationReturnPath") || "/admin/companies";

    if (previousWorkspace) {
      localStorage.setItem("selectedWorkspace", previousWorkspace);
    } else {
      localStorage.removeItem("selectedWorkspace");
    }
    sessionStorage.removeItem("impersonationPreviousWorkspace");
    sessionStorage.removeItem("impersonationReturnPath");

    applySwitchedSession(session, returnPath, false);
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

  const applySwitchedSession = (
    userData: UserLoginResponse,
    destination: string,
    clearWorkspace = true,
  ) => {
    queryClient.clear();
    disconnectSocket();
    if (clearWorkspace) {
      localStorage.removeItem("selectedWorkspace");
    }
    setUser(userData.user);
    setUserProfile(null);
    localStorage.setItem("user", JSON.stringify(userData.user));
    localStorage.setItem("token", userData.token);
    window.location.assign(destination);
  };

  const removeUserData = () => {
    disconnectSocket();
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "token") {
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const impersonation = userProfile?.impersonation;
    if (!impersonation) return;

    const remaining = new Date(impersonation.expiresAt).getTime() - Date.now();
    const expireSession = () => {
      queryClient.clear();
      disconnectSocket();
      removeUserData();
      window.location.assign("/login");
    };

    if (remaining <= 0) {
      expireSession();
      return;
    }

    const timer = window.setTimeout(expireSession, remaining);
    return () => window.clearTimeout(timer);
  }, [queryClient, userProfile?.impersonation]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        login,
        impersonateUser,
        stopImpersonation,
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
