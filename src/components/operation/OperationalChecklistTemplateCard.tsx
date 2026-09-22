import { Archive, ClipboardCheck, Pencil, UserRound, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className={cn(!template.active && "opacity-75")}>
      <CardHeader className="gap-3 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5 shrink-0 text-primary" />
              <span className="truncate">{template.name}</span>
            </CardTitle>
            <CardDescription className="mt-1">
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
          <Badge variant="outline">v{template.version}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ol className="space-y-2">
          {template.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-md border bg-background px-3 py-2 text-sm"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {item.position}
              </span>
              <span className="min-w-0 flex-1 break-words">{item.label}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                {item.responsible === "CUSTOMER" ? (
                  <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {item.responsible === "CUSTOMER" ? "Cliente" : "Equipe"}
                </span>
                {item.required ? "Obrigatória" : "Opcional"}
              </span>
            </li>
          ))}
        </ol>

        {canEdit ? (
          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button size="sm" variant="outline" onClick={() => onEdit(template)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            {template.active ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={isArchiving}
                onClick={() => onArchive(template)}
              >
                <Archive className="h-4 w-4" />
                {isArchiving ? "Arquivando..." : "Arquivar"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
