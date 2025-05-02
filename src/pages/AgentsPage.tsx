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
import MainLayout from "@/components/layout/MainLayout";
import AgentCard from "@/components/agents/AgentCard";
import { deleteAgent } from "@/services/mockData";
import { Agent } from "@/types/agent";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { listAgent } from "@/services/agent/listAgent";
import AgentCardSkeleton from "@/components/agents/AgentCardSkeleton";

const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const { isLoading, data, error } = useQuery({
    queryKey: ["listAgent"],
    queryFn: listAgent,
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
      deleteAgent(agentToDelete);
      // setAgents(AGENTS);
      toast({
        title: "Agent deleted",
        description: "The agent has been successfully deleted.",
      });
      setAgentToDelete(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
            <p className="text-muted-foreground">
              Create and manage your intelligent agents
            </p>
          </div>
          <Link to="/agents/new">
            <Button className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              New Agent
            </Button>
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {isLoading ? (
          <AgentCardSkeleton />
        ) : agents.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            {searchQuery ? (
              <>
                <h3 className="font-medium text-lg">No agents found</h3>
                <p className="text-muted-foreground">
                  No agents match your search query. Try using different
                  keywords.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-medium text-lg">No agents yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first AI agent to get started
                </p>
                <Link to="/agents/new">
                  <Button>Create Agent</Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              agent and any associated WhatsApp integrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default AgentsPage;
