import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth/hooks";
import { Workspace, WorkspaceType } from "@/types/workspace";

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  workspaceChanged: boolean;
  resetWorkspaceChanged: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const normalizeStoredWorkspace = (value: string | null): Workspace | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<Workspace>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.companyId !== "string" ||
      typeof parsed.isDefault !== "boolean"
    ) {
      return null;
    }

    const type: WorkspaceType =
      parsed.type === "OPERATION" ? "OPERATION" : "COMMERCIAL";

    return { ...parsed, type } as Workspace;
  } catch {
    return null;
  }
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(() => {
    return normalizeStoredWorkspace(localStorage.getItem("selectedWorkspace"));
  });
  const [workspaceChanged, setWorkspaceChanged] = useState(false);

  const setCurrentWorkspace = useCallback((workspace: Workspace | null) => {
    if (workspace && user && workspace.companyId !== user.companyId) {
      return;
    }

    // Verifica se houve mudança real de workspace
    const isRealChange = 
      !workspace || 
      !currentWorkspace || 
      workspace.id !== currentWorkspace.id;
    
    // Atualiza o estado do workspace
    setCurrentWorkspaceState(workspace);
    
    // Atualiza o localStorage
    if (workspace) {
      localStorage.setItem("selectedWorkspace", JSON.stringify(workspace));
    } else {
      localStorage.removeItem("selectedWorkspace");
    }
    
    // Só invalida consultas e marca como alterado se houve mudança real
    if (isRealChange) {
      // Invalida todas as consultas que podem depender do workspaceId
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          // Invalida todas as consultas exceto a própria lista de workspaces
          return query.queryKey[0] !== "workspaces";
        }
      });
      
      // Marca que o workspace foi alterado para que os componentes possam reagir
      setWorkspaceChanged(true);
    }
  }, [currentWorkspace, queryClient, user]);

  useEffect(() => {
    if (
      currentWorkspace &&
      user &&
      currentWorkspace.companyId !== user.companyId
    ) {
      setCurrentWorkspace(null);
    }
  }, [currentWorkspace, setCurrentWorkspace, user]);

  const resetWorkspaceChanged = () => {
    setWorkspaceChanged(false);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        setCurrentWorkspace,
        workspaceChanged,
        resetWorkspaceChanged
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspaceContext = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspaceContext deve ser usado dentro de um WorkspaceProvider");
  }
  return context;
};
