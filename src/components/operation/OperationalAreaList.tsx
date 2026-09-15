import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ServiceArea } from "@/types/operation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="divide-y overflow-hidden rounded-lg border">
      {areas.map((area) => (
        <div
          key={area.id}
          className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap sm:gap-4"
        >
          <Link
            to={`/operation/areas/${area.id}`}
            className="group min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="truncate font-medium group-hover:text-primary">
                {area.name}
              </span>
              <Badge variant="secondary">Ativa</Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {area.description || "Sem descrição cadastrada."}
            </p>
          </Link>

          <div className="flex w-full shrink-0 items-center justify-end gap-1 sm:w-auto">
            {canManage ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Editar ${area.name}`}
                  onClick={() => onEdit(area)}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  aria-label={`Desativar ${area.name}`}
                  onClick={() => onDeactivate(area)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Desativar</span>
                </Button>
              </>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link to={`/operation/areas/${area.id}`}>
                <span className="hidden sm:inline">Abrir</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
