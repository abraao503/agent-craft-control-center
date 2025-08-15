import { Agent } from "@/types/agent";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

interface AgentCardProps {
  agent: Agent;
  onDelete: (id: string) => void;
}

const AgentCard = ({ agent, onDelete }: AgentCardProps) => {
  return (
    <Card className="h-full flex flex-col min-w-[380px]">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{agent.name}</CardTitle>
          <div className="flex space-x-1">
            {agent.hasWhatsappIntegration && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-600 border-green-200"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                WhatsApp
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="line-clamp-2"></CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Modelo IA:</span>{" "}
            {agent.iaModelName}
          </p>
          <p>
            <span className="font-medium text-foreground">Idioma:</span>{" "}
            {agent.language}
          </p>
          <p>
            <span className="font-medium text-foreground">Criado em:</span>{" "}
            {new Date(agent.createdAt).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Link to={`/agents/${agent.id}`}>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-1" />
            Visualizar
          </Button>
        </Link>
        <div className="flex space-x-2">
          <Link to={`/agents/edit/${agent.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(agent.id)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Apagar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AgentCard;
