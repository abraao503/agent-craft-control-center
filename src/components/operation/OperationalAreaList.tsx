import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ServiceArea } from "@/types/operation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type OperationalAreaListProps = {
  areas: ServiceArea[];
  canManage: boolean;
  onEdit: (area: ServiceArea) => void;
  onDeactivate: (area: ServiceArea) => void;
};

export function OperationalAreaList({
  areas,
  canManage,
  onEdit,
  onDeactivate,
}: OperationalAreaListProps) {
  const navigate = useNavigate();

  return (
    <div className="divide-y overflow-hidden rounded-lg border">
      {areas.map((area) => {
        const openArea = () => navigate(`/operation/areas/${area.id}`);

        return (
          <div
            key={area.id}
            role="link"
            tabIndex={0}
            aria-label={`Abrir ${area.name}`}
            onClick={openArea}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openArea();
              }
            }}
            className="group flex cursor-pointer flex-wrap items-center gap-3 p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-nowrap sm:gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate font-medium group-hover:text-primary">
                  {area.name}
                </span>
                <Badge variant="secondary">Ativa</Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {area.description || "Sem descrição cadastrada."}
              </p>
            </div>

            {canManage ? (
              <div className="flex shrink-0 items-center justify-end gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      aria-label={`Mais ações para ${area.name}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(area)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => onDeactivate(area)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Desativar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
