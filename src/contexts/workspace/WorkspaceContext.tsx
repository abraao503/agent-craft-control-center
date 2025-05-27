import React, { createContext, useContext, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Workspace } from "@/types/workspace";

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  workspaceChanged: boolean;
  resetWorkspaceChanged: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(() => {
    const savedWorkspace = localStorage.getItem("selectedWorkspace");
    return savedWorkspace ? JSON.parse(savedWorkspace) : null;
  });
  const [workspaceChanged, setWorkspaceChanged] = useState(false);

  const setCurrentWorkspace = (workspace: Workspace | null) => {
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
  };

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
