import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MessageQueue } from "@/types/follow-up";
import { Eye } from "lucide-react";

interface MessageQueueTableProps {
  messageQueues: MessageQueue[];
  onViewDetails: (messageQueue: MessageQueue) => void;
}

export function MessageQueueTable({
  messageQueues,
  onViewDetails,
}: MessageQueueTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Workspace</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messageQueues.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                Nenhuma fila de mensagens encontrada
              </TableCell>
            </TableRow>
          ) : (
            messageQueues.map((queue) => (
              <TableRow key={queue.id}>
                <TableCell className="font-medium">{queue.id.substring(0, 8)}...</TableCell>
                <TableCell>{queue.workspaceId.substring(0, 8)}...</TableCell>
                <TableCell>
                  {format(new Date(queue.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(queue)}
                    className="flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
