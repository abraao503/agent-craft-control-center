import {
  Archive,
  ClipboardCheck,
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
  const isOfficial = template.visibility === "OFFICIAL";

  return (
    <Card className={cn("border bg-card shadow-none", !template.active && "opacity-75")}>
      <CardHeader className="gap-3 p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{template.name}</span>
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              {template.items.length} {template.items.length === 1 ? "etapa" : "etapas"}
            </CardDescription>
          </div>
          <Badge variant={template.active ? "outline" : "secondary"}>
            {template.active ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={isOfficial ? "default" : "secondary"}>
            {isOfficial ? "Oficial" : "Pessoal"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4 pt-0">
        <ol className="divide-y rounded-lg border bg-background px-3">
          {template.items.map((item) => (
            <li key={item.id} className="flex min-w-0 items-start gap-3 py-2.5 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {item.position}
              </span>
              <span className="min-w-0 flex-1 break-words">{item.label}</span>
              <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                {item.responsible === "CUSTOMER" ? (
                  <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{item.responsible === "CUSTOMER" ? "Cliente" : "Equipe"}</span>
              </span>
            </li>
          ))}
        </ol>

        {canEdit ? (
          <div className="flex items-center justify-between gap-2 border-t pt-3">
            <Button size="sm" variant="outline" onClick={() => onEdit(template)}>
              <Pencil className="h-4 w-4" />
              Editar modelo
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
