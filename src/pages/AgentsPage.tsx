import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AgentCard from "@/components/agents/AgentCard";
import { Agent } from "@/types/agent";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAgent } from "@/services/agent/listAgent";
import { deleteAgent } from "@/services/agent/deleteAgent";
import AgentCardSkeleton from "@/components/agents/AgentCardSkeleton";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";

const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Usar o hook de gerenciamento de workspace
  const { workspaceId, isChangingWorkspace } = useWorkspaceManager({
    queryKeys: ["listAgent"],
    autoRefetch: true,
    trackLoadingState: true,
  });

  const { isLoading, data, error } = useQuery({
    queryKey: ["listAgent", workspaceId],
    queryFn: () => listAgent(workspaceId || ""),
  });

  const { mutate: deleteAgentMutation, isPending: isDeleting } = useMutation({
    mutationFn: ({
      agentId,
      workspaceId,
    }: {
      agentId: string;
      workspaceId: string;
    }) => deleteAgent(agentId, workspaceId),
    onSuccess: () => {
      toast({
        title: "Agente excluído",
        description: "O agente foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["listAgent"] });
      setAgentToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the agent. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting agent:", error);
    },
  });

  useEffect(() => {
    if (data) {
      setAgents(data.agents);
    }
  }, [data]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
  };

  const handleDeleteClick = (id: string) => {
    setAgentToDelete(id);
  };

  const confirmDelete = () => {
    if (agentToDelete) {
      deleteAgentMutation({
        agentId: agentToDelete,
        workspaceId: workspaceId || "",
      });
    }
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agentes de IA</h1>
            <p className="text-muted-foreground">
              Crie e gerencie seus agentes inteligentes
            </p>
          </div>
          <Link to="/agents/new">
            <Button className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Novo Agente
            </Button>
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10"
            placeholder="Pesquisar agentes..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {isLoading || isChangingWorkspace ? (
          <AgentCardSkeleton />
        ) : agents.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            {searchQuery ? (
              <>
                <h3 className="font-medium text-lg">
                  Nenhum agente encontrado
                </h3>
                <p className="text-muted-foreground">
                  Nenhum agente corresponde à sua pesquisa. Tente usar
                  palavras-chave diferentes.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-medium text-lg">Nenhum agente ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro agente de IA para começar
                </p>
                <Link to="/agents/new">
                  <Button>Criar Agente</Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!agentToDelete}
        onOpenChange={() => setAgentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              agente e quaisquer integrações do WhatsApp associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgentsPage;
