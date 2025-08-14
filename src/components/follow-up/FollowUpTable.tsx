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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { FollowUp } from "@/types/follow-up";

interface FollowUpTableProps {
  followUps: FollowUp[];
  onEdit: (followUp: FollowUp) => void;
  onDelete: (followUp: FollowUp) => void;
}

export function FollowUpTable({
  followUps,
  onEdit,
  onDelete,
}: FollowUpTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Mensagem</TableHead>
            <TableHead>Tempo de Inatividade</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {followUps.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                Nenhum follow-up encontrado
              </TableCell>
            </TableRow>
          ) : (
            followUps.map((followUp) => (
              <TableRow key={followUp.id}>
                <TableCell className="font-medium">{followUp.name}</TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {followUp.messages && followUp.messages.length > 0 
                    ? followUp.messages[0] + (followUp.messages.length > 1 ? ` (+${followUp.messages.length - 1})` : '') 
                    : "Sem mensagens configuradas"}
                </TableCell>
                <TableCell>
                  {followUp.minInactiveChatTime} a {followUp.maxInactiveChatTime} {followUp.maxInactiveChatTime === 1 ? "minuto" : "minutos"}
                </TableCell>
                <TableCell>
                  {format(new Date(followUp.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(followUp)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(followUp)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
