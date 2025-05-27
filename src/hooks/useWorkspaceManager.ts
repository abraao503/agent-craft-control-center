import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";

interface UseWorkspaceManagerOptions {
  // Array de chaves de consulta que devem ser refeitas quando o workspace mudar
  queryKeys?: string[];
  // Se verdadeiro, a consulta será refeita automaticamente quando o workspace mudar
  autoRefetch?: boolean;
  // Se verdadeiro, o hook fornecerá um estado de loading durante a mudança de workspace
  trackLoadingState?: boolean;
}

/**
 * Hook para gerenciar mudanças de workspace e refazer consultas automaticamente
 *
 * @param options Opções para configurar o comportamento do hook
 * @returns Objeto com funções e estados úteis
 */
export const useWorkspaceManager = (
  options: UseWorkspaceManagerOptions = {}
) => {
  const { currentWorkspace, workspaceChanged, resetWorkspaceChanged } =
    useWorkspaceContext();
  const queryClient = useQueryClient();
  const [isChangingWorkspace, setIsChangingWorkspace] = useState(false);

  const {
    queryKeys = [],
    autoRefetch = true,
    trackLoadingState = true,
  } = options;

  // Efeito para detectar mudança de workspace e atualizar o estado de loading
  useEffect(() => {
    if (workspaceChanged && trackLoadingState) {
      setIsChangingWorkspace(true);
    }
  }, [workspaceChanged, trackLoadingState]);

  // Armazenar o último workspace ID para detectar mudanças reais
  const [lastWorkspaceId, setLastWorkspaceId] = useState<string | undefined>(currentWorkspace?.id);
  
  // Efeito para monitorar mudanças no workspace atual
  useEffect(() => {
    // Só considera mudança de workspace quando o ID realmente mudar
    if (currentWorkspace?.id !== lastWorkspaceId) {
      // Atualiza o último workspace ID
      setLastWorkspaceId(currentWorkspace?.id);
      
      // Ativar o estado de loading
      if (trackLoadingState) {
        setIsChangingWorkspace(true);
      }
      
      // Invalidar e refazer as consultas
      if (autoRefetch && queryKeys.length > 0 && currentWorkspace) {
        const promises = queryKeys.map((key) => {
          // Primeiro invalida a consulta para forçar um refetch
          queryClient.invalidateQueries({ queryKey: [key, currentWorkspace.id] });
          // Depois refaz a consulta
          return queryClient.refetchQueries({ queryKey: [key, currentWorkspace.id] });
        });

        // Quando todas as consultas terminarem, resetar o estado de loading
        if (trackLoadingState && promises.length > 0) {
          Promise.all(promises).finally(() => {
            setIsChangingWorkspace(false);
          });
        }
      } else if (trackLoadingState) {
        // Se não tiver consultas para refazer, desativa o loading após um pequeno delay
        // para evitar flash de loading
        setTimeout(() => {
          setIsChangingWorkspace(false);
        }, 300);
      }
    } else if (isChangingWorkspace && trackLoadingState) {
      // Se não houve mudança real de workspace, desativa o estado de loading
      setIsChangingWorkspace(false);
    }
  }, [currentWorkspace?.id]);
  
  // Efeito para lidar com o flag workspaceChanged
  useEffect(() => {
    if (workspaceChanged) {
      // O estado de loading já é tratado no efeito acima
      // Apenas resetamos o flag
      resetWorkspaceChanged();
    }
  }, [
    workspaceChanged,
    resetWorkspaceChanged,
  ]);

  // Função para refazer manualmente consultas específicas
  const refetchQueries = (keys: string[] = queryKeys) => {
    if (!currentWorkspace) return;
    
    if (trackLoadingState) {
      setIsChangingWorkspace(true);
    }

    const promises = keys.map((key) => {
      // Primeiro invalida a consulta para forçar um refetch completo
      queryClient.invalidateQueries({ queryKey: [key, currentWorkspace.id] });
      // Depois refaz a consulta
      return queryClient.refetchQueries({ queryKey: [key, currentWorkspace.id] });
    });

    if (trackLoadingState && promises.length > 0) {
      Promise.all(promises).finally(() => {
        setIsChangingWorkspace(false);
      });
    } else if (trackLoadingState) {
      // Se não tiver consultas para refazer, desativa o loading após um pequeno delay
      setTimeout(() => {
        setIsChangingWorkspace(false);
      }, 300);
    }
  };

  return {
    currentWorkspace,
    workspaceId: currentWorkspace?.id,
    workspaceChanged,
    isChangingWorkspace,
    refetchQueries,
    // Função auxiliar para resetar manualmente o estado de loading
    resetLoadingState: () => setIsChangingWorkspace(false),
  };
};
