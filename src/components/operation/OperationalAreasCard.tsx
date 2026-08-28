import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { AlertCircle, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useOperationalAreaMutations, useOperationalAreas } from "@/hooks/useOperationalAreas";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { ServiceArea } from "@/types/operation";
import { OperationalAreaQueues } from "@/components/operation/OperationalAreaQueues";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AreaForm = {
  name: string;
  description: string;
};

export function OperationalAreasCard({ workspaceId }: { workspaceId?: string }) {
  const { has } = usePermissions();
  const { toast } = useToast();
  const areasQuery = useOperationalAreas(workspaceId);
  const mutations = useOperationalAreaMutations(workspaceId);
  const canManage = has("manage:operation-setup");
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<ServiceArea | null>(null);

  const handleSubmit = async (form: AreaForm) => {
    try {
      if (editingArea) {
        await mutations.update.mutateAsync({
          areaId: editingArea.id,
          name: form.name,
          description: form.description || null,
          expectedVersion: editingArea.version,
        });
        toast({ title: "Área atualizada", description: "A área foi atualizada com sucesso." });
      } else {
        await mutations.create.mutateAsync({
          name: form.name,
          description: form.description || undefined,
        });
        toast({ title: "Área criada", description: "A área foi criada com sucesso." });
      }

      setIsDialogOpen(false);
      setEditingArea(null);
    } catch (error) {
      toast({
        title: "Não foi possível salvar a área",
        description: getApiErrorMessage(error, "Verifique os dados e tente novamente."),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!areaToDelete) return;

    try {
      await mutations.remove.mutateAsync({
        areaId: areaToDelete.id,
        expectedVersion: areaToDelete.version,
      });
      toast({ title: "Área desativada", description: "A área foi desativada sem apagar seu histórico." });
      setAreaToDelete(null);
    } catch (error) {
      toast({
        title: "Não foi possível desativar a área",
        description: getApiErrorMessage(error, "A área pode ter sido alterada por outra pessoa."),
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl">Áreas</CardTitle>
          <CardDescription>
            Organize a operação em áreas de atendimento. Somente áreas ativas aparecem na lista.
          </CardDescription>
        </div>
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setEditingArea(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova área
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {areasQuery.isLoading ? (
          <div className="flex min-h-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="sr-only">Carregando áreas</span>
          </div>
        ) : areasQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não foi possível carregar as áreas</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              Tente novamente quando a API estiver disponível.
              <Button
                size="sm"
                variant="outline"
                onClick={() => areasQuery.refetch()}
                disabled={areasQuery.isFetching}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : areasQuery.data?.items.length ? (
          <div className="space-y-3">
            {areasQuery.data.items.map((area) => (
              <div
                key={area.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{area.name}</p>
                    <Badge variant="secondary">Ativa</Badge>
                  </div>
                  {area.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {area.description}
                    </p>
                  )}
                  <OperationalAreaQueues
                    workspaceId={workspaceId}
                    areaId={area.id}
                    canManage={canManage}
                  />
                </div>
                {canManage && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingArea(area);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setAreaToDelete(area)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Desativar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="font-medium">Nenhuma área ativa</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie a primeira área para começar a estruturar o workspace.
            </p>
          </div>
        )}
      </CardContent>

      <OperationalAreaDialog
        open={isDialogOpen}
        area={editingArea}
        isPending={mutations.create.isPending || mutations.update.isPending}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingArea(null);
        }}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(areaToDelete)}
        onOpenChange={(open) => {
          if (!open && !mutations.remove.isPending) setAreaToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar área?</AlertDialogTitle>
            <AlertDialogDescription>
              A área “{areaToDelete?.name}” ficará fora das listagens ativas, mas seu histórico será preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutations.remove.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={mutations.remove.isPending}
            >
              {mutations.remove.isPending ? "Desativando..." : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function OperationalAreaDialog({
  open,
  area,
  isPending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  area: ServiceArea | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: AreaForm) => Promise<void>;
}) {
  const [form, setForm] = useState<AreaForm>({ name: "", description: "" });

  useEffect(() => {
    setForm({
      name: area?.name ?? "",
      description: area?.description ?? "",
    });
  }, [area, open]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{area ? "Editar área" : "Nova área"}</DialogTitle>
          <DialogDescription>
            Informe um nome único entre as áreas ativas deste workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="operational-area-name">Nome *</Label>
            <Input
              id="operational-area-name"
              value={form.name}
              maxLength={160}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              disabled={isPending}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="operational-area-description">Descrição</Label>
            <Textarea
              id="operational-area-description"
              value={form.description}
              maxLength={500}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !form.name.trim()}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (message === "AREA_HAS_ACTIVE_QUEUES") {
      return "Desative as filas ativas antes de desativar esta área.";
    }
    if (message === "STALE_VERSION") {
      return "A área foi alterada por outra pessoa. Atualize a lista e tente novamente.";
    }
    if (typeof message === "string") return message;
  }

  return fallback;
}
