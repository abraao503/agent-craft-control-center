import { Button } from "@/components/ui/button";
import { BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6">
      {/* Ícone decorativo */}
      <div className="relative">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-12 w-12 text-primary/60" />
        </div>
        {/* Ícones decorativos ao redor */}
        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-md bg-primary/20 flex items-center justify-center">
          <BarChart3 className="h-3 w-3 text-primary/50" />
        </div>
        <div className="absolute -bottom-2 -left-2 h-5 w-5 rounded-md bg-primary/15 flex items-center justify-center">
          <div className="h-2 w-2 rounded-sm bg-primary/40" />
        </div>
      </div>

      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-xl font-semibold">Sua dashboard está vazia</h2>
        <p className="text-muted-foreground text-sm">
          Comece criando deals e conversando com clientes para ver seus
          indicadores aqui.
        </p>
      </div>

      <Link to="/deals">
        <Button className="gap-2">
          Criar primeiro deal
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
