import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import AgentDetailsCard from "@/components/agents/AgentDetailsCard";
import { FullAgent } from "@/types/agent";
import { ArrowLeft, Edit, MessageSquare, Trash2, Loader } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAgent } from "@/services/agent/getAgent";
import { deleteAgent } from "@/services/agent/deleteAgent";

const AgentDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<FullAgent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { isLoading, data, error } = useQuery({
    queryKey: ["getAgent", id],
    queryFn: () => getAgent(id!),
    enabled: !!id,
  });

  const { mutate: deleteAgentMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => {
      toast({
        title: "Agent deleted",
        description: "The agent has been successfully deleted.",
      });
      navigate("/agents");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the agent. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting agent:", error);
      setConfirmDelete(false);
    },
  });

  useEffect(() => {
    if (data) {
      setAgent(data);
    }
  }, [data]);

  const handleDelete = () => {
    if (id) {
      deleteAgentMutation(id);
    }
  };

  if (isLoading || !agent) {
    return (
      <div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/agents">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold tracking-tight">
                {agent.name}
              </h1>
            </div>
            <p className="text-muted-foreground">Agent ID: {agent.id}</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/integrations/new?agentId=${agent.id}`}>
              <Button variant="outline">
                <MessageSquare className="mr-2 h-5 w-5" />
                Connect to WhatsApp
              </Button>
            </Link>
            <Link to={`/agents/edit/${agent.id}`}>
              <Button variant="outline">
                <Edit className="mr-2 h-5 w-5" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-2 h-5 w-5" />
              Delete
            </Button>
          </div>
        </div>

        <AgentDetailsCard agent={agent} />
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              agent "{agent.name}" and any associated WhatsApp integrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgentDetailsPage;
