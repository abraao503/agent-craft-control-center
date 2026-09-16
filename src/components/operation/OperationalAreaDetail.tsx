import { useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Loader2,
  Pencil,
  Users,
} from "lucide-react";
import {
  useOperationalAreaMemberships,
  useOperationalMembershipCandidates,
} from "@/hooks/useOperationalAreaMemberships";
import { useOperationalAreaMutations } from "@/hooks/useOperationalAreas";
import { useOperationalQueues } from "@/hooks/useOperationalQueues";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { ServiceArea } from "@/types/operation";
import { OperationalAreaFormDialog, OperationalAreaFormValues } from "@/components/operation/OperationalAreaFormDialog";
import { OperationalAreaMemberships } from "@/components/operation/OperationalAreaMemberships";
import { OperationalAreaQueuesList } from "@/components/operation/OperationalAreaQueuesList";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OperationalAreaDetailProps = {
  workspaceId: string;
  area: ServiceArea;
  onReload: () => Promise<unknown>;
};

export function OperationalAreaDetail({
  workspaceId,
  area,
  onReload,
}: OperationalAreaDetailProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { has } = usePermissions();
  const { toast } = useToast();
  const canManage = has("manage:operation-setup");
  const canManageMemberships = has("manage:operation-memberships");
  const currentTab = searchParams.get("tab") === "team" ? "team" : "queues";
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

  const queueCountQuery = useOperationalQueues(workspaceId, area.id, 1, 1);
  const memberCountQuery = useOperationalAreaMemberships(
    workspaceId,
    area.id,
    1,
    1,
  );
  const candidatesQuery = useOperationalMembershipCandidates(
    workspaceId,
    canManageMemberships && currentTab === "team",
  );
  const mutations = useOperationalAreaMutations(workspaceId);

  const handleTabChange = (value: string) => {
    const nextTab = value === "team" ? "team" : "queues";
    setSearchParams(nextTab === "team" ? { tab: "team" } : {}, {
      replace: true,
    });
  };

  const handleSubmit = async (values: OperationalAreaFormValues) => {
    try {
      await mutations.update.mutateAsync({
        areaId: area.id,
        name: values.name,
        description: values.description || null,
        expectedVersion: area.version,
      });
      await onReload();
      toast({
        title: "Área atualizada",
        description: "As informações da área foram atualizadas.",
      });
      setIsFormOpen(false);
      setEditingArea(null);
    } catch (error) {
      toast({
        title: "Não foi possível salvar a área",
        description: getApiErrorMessage(
          error,
          "A área pode ter sido alterada por outra pessoa.",
        ),
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async () => {
    try {
      await mutations.remove.mutateAsync({
        areaId: area.id,
        expectedVersion: area.version,
      });
      toast({
        title: "Área desativada",
        description: "A área foi retirada da estrutura ativa.",
      });
      navigate("/operation/structure");
    } catch (error) {
      toast({
        title: "Não foi possível desativar a área",
        description: getApiErrorMessage(
          error,
          "Desative as filas ativas antes de desativar esta área.",
        ),
        variant: "destructive",
      });
      setIsDeactivateOpen(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1100px] space-y-6">
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground"
      >
        <Link
          to="/operation"
          className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Operação
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to="/operation/structure"
          className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Estrutura
        </Link>
        <span aria-hidden="true">/</span>
        <span className="max-w-full truncate text-foreground">{area.name}</span>
      </nav>

      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Building2 className="h-6 w-6 shrink-0 text-primary" />
            <h1 className="truncate text-3xl font-semibold tracking-tight">
              {area.name}
            </h1>
            <Badge variant="secondary">Ativa</Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {area.description || "Sem descrição cadastrada para esta área."}
          </p>
        </div>
        {canManage ? (
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setEditingArea(area);
                setIsFormOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
              Editar área
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setIsDeactivateOpen(true)}
            >
              Desativar área
            </Button>
          </div>
        ) : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard
          icon={<Building2 className="h-4 w-4" />}
          label="Filas ativas"
          value={formatCount(queueCountQuery)}
        />
        <SummaryCard
          icon={<Users className="h-4 w-4" />}
          label="Membros ativos"
          value={formatCount(memberCountQuery)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração da área</CardTitle>
          <CardDescription>
            Administre as filas e a equipe em vistas separadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <TabsList className="w-full justify-start sm:w-auto">
              <TabsTrigger value="queues">Filas</TabsTrigger>
              <TabsTrigger value="team">Equipe</TabsTrigger>
            </TabsList>
            <TabsContent value="queues">
              <OperationalAreaQueuesList
                workspaceId={workspaceId}
                areaId={area.id}
                canManage={canManage}
              />
            </TabsContent>
            <TabsContent value="team">
              <OperationalAreaMemberships
                workspaceId={workspaceId}
                areaId={area.id}
                canManage={canManageMemberships}
                candidateUsers={candidatesQuery.data?.items}
                candidatesLoading={candidatesQuery.isLoading}
                candidatesError={candidatesQuery.isError}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div>
        <Button asChild variant="ghost" className="px-0">
          <Link to="/operation/structure">
            <ArrowLeft className="h-4 w-4" />
            Voltar para estrutura
          </Link>
        </Button>
      </div>

      <OperationalAreaFormDialog
        open={isFormOpen}
        area={editingArea}
        isPending={mutations.update.isPending}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingArea(null);
        }}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={isDeactivateOpen}
        onOpenChange={(open) => {
          if (!open && !mutations.remove.isPending) setIsDeactivateOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar área?</AlertDialogTitle>
            <AlertDialogDescription>
              A área “{area.name}” ficará fora da estrutura ativa. O histórico
              será preservado; filas ativas precisam ser desativadas antes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutations.remove.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={mutations.remove.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleDeactivate();
              }}
            >
              {mutations.remove.isPending ? "Desativando..." : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCount(query: { isSuccess: boolean; data?: { total: number } }) {
  return query.isSuccess && query.data ? String(query.data.total) : "—";
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof AxiosError)) return fallback;

  const code = error.response?.data?.message;
  const messages: Record<string, string> = {
    AREA_HAS_ACTIVE_QUEUES:
      "Desative as filas ativas antes de desativar esta área.",
    AREA_NAME_CONFLICT: "Já existe uma área ativa com esse nome.",
    STALE_VERSION:
      "A área foi alterada por outra pessoa. Atualize e tente novamente.",
  };

  return typeof code === "string" && messages[code] ? messages[code] : fallback;
}
