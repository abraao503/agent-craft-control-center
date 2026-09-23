import {
  Archive,
  MoreHorizontal,
  Pencil,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { OperationalChecklistTemplate } from "@/types/operational-checklist";

type OperationalChecklistTemplateCardProps = {
  template: OperationalChecklistTemplate;
  canEdit: boolean;
  isArchiving: boolean;
  onEdit: (template: OperationalChecklistTemplate) => void;
  onArchive: (template: OperationalChecklistTemplate) => void;
};

export function OperationalChecklistTemplateCard({
  template,
  canEdit,
  isArchiving,
  onEdit,
  onArchive,
}: OperationalChecklistTemplateCardProps) {
  return (
    <Card
      className={cn(
        "border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md",
        !template.active && "opacity-75",
      )}
    >
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="break-words text-base leading-5">
              {template.name}
            </CardTitle>
            <CardDescription className="mt-1.5 text-xs">
              {template.items.length} {template.items.length === 1 ? "etapa" : "etapas"}
            </CardDescription>
          </div>
          <Badge
            variant={template.active ? "outline" : "secondary"}
            className="shrink-0 rounded-full"
          >
            {template.active ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        <ol aria-label={`Etapas do modelo ${template.name}`}>
          {template.items.map((item) => (
            <li
              key={item.id}
              className="flex min-w-0 items-start gap-3 border-b py-3 last:border-b-0"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {item.position}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span className="min-w-0 break-words text-sm font-medium leading-5">
                  {item.label}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  {item.responsible === "CUSTOMER" ? (
                    <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{item.responsible === "CUSTOMER" ? "Cliente" : "Equipe"}</span>
                </span>
              </div>
            </li>
          ))}
        </ol>

        {canEdit ? (
          <div className="mt-1 flex items-center justify-between gap-2 border-t pt-3">
            <Button
              size="sm"
              variant="ghost"
              className="px-2.5"
              onClick={() => onEdit(template)}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            {template.active ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 shrink-0 text-muted-foreground"
                    aria-label={`Mais ações para ${template.name}`}
                    disabled={isArchiving}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => onArchive(template)}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Arquivar modelo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
