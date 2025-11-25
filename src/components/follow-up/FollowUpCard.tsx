import React from "react";
import { format } from "date-fns";
import { minutesToTimeValue } from "@/lib/time-utils";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { FollowUp } from "@/types/follow-up";
import { useNavigate } from "react-router-dom";
import { FollowUpWithMessageQueue } from "@/services/follow-up";

interface FollowUpCardProps {
  followUp: FollowUpWithMessageQueue;
  onEdit: (followUp: FollowUpWithMessageQueue) => void;
  onDelete: (followUp: FollowUpWithMessageQueue) => void;
  disabled?: boolean;
}

export function FollowUpCard({
  followUp,
  onEdit,
  onDelete,
  disabled = false,
}: FollowUpCardProps) {
  const navigate = useNavigate();
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg">{followUp.name}</CardTitle>
            {followUp.messageQueue?.isActive ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 w-fit">
                Ativo
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground w-fit">
                Inativo
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={disabled}
              >
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEdit(followUp)}
                disabled={disabled}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(followUp)}
                className="text-red-600 focus:text-red-600"
                disabled={disabled}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {followUp.messages && followUp.messages.length > 0
              ? followUp.messages[0] +
                (followUp.messages.length > 1
                  ? ` (+${followUp.messages.length - 1})`
                  : "")
              : "Sem mensagens configuradas"}
          </p>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">
              Intervalo de tempo de inatividade:
            </span>{" "}
            {(() => {
              const minTimeValue = minutesToTimeValue(
                followUp.minInactiveChatTime || 60
              );
              const maxTimeValue = minutesToTimeValue(
                followUp.maxInactiveChatTime || 120
              );

              const formatTimeValue = (timeValue: {
                days: number;
                hours: number;
                minutes: number;
              }) => {
                const parts: string[] = [];
                if (timeValue.days > 0) {
                  parts.push(
                    `${timeValue.days} ${timeValue.days === 1 ? "dia" : "dias"}`
                  );
                }

                if (timeValue.hours > 0) {
                  parts.push(
                    `${timeValue.hours} ${
                      timeValue.hours === 1 ? "hora" : "horas"
                    }`
                  );
                }

                if (timeValue.minutes > 0 || parts.length === 0) {
                  parts.push(
                    `${timeValue.minutes} ${
                      timeValue.minutes === 1 ? "minuto" : "minutos"
                    }`
                  );
                }

                return parts.join(", ");
              };

              const minFormatted = formatTimeValue(minTimeValue);
              const maxFormatted = formatTimeValue(maxTimeValue);

              return `${minFormatted} - ${maxFormatted}`;
            })()}
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Criado em:</span>{" "}
            {format(new Date(followUp.createdAt), "dd/MM/yyyy HH:mm", {
              locale: ptBR,
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full">
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center justify-center"
            onClick={() => navigate(`/follow-ups/${followUp.id}`)}
            disabled={disabled}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver detalhes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
