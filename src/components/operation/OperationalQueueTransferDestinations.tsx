import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { AlertCircle, Loader2, RefreshCw, Search, X } from "lucide-react";
import { useOperationalQueueTransferDestinations } from "@/hooks/useOperationalQueueTransferDestinations";
import { useToast } from "@/hooks/use-toast";
import { OperationalQueueTransferDestinationOption } from "@/types/operation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OperationalQueueTransferDestinationsProps = {
  workspaceId: string;
  areaId: string;
  queueId: string;
  queueName: string;
};

const EMPTY_DESTINATIONS: OperationalQueueTransferDestinationOption[] = [];

export function OperationalQueueTransferDestinations({
  workspaceId,
  areaId,
  queueId,
  queueName,
}: OperationalQueueTransferDestinationsProps) {
  const { toast } = useToast();
  const { query, update } = useOperationalQueueTransferDestinations(
    workspaceId,
    areaId,
    queueId,
  );
  const [selectedQueueIds, setSelectedQueueIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [hasVersionConflict, setHasVersionConflict] = useState(false);
  const destinations = query.data?.destinations ?? EMPTY_DESTINATIONS;
  const availableDestinations =
    query.data?.availableDestinations ?? EMPTY_DESTINATIONS;

  useEffect(() => {
    if (query.data) {
      setSelectedQueueIds(query.data.destinations.map((item) => item.queueId));
    }
  }, [query.data]);

  const destinationById = useMemo(
    () => new Map(destinations.map((destination) => [destination.queueId, destination])),
    [destinations],
  );
  const availableById = useMemo(
    () =>
      new Map(
        availableDestinations.map((destination) => [
          destination.queueId,
          destination,
        ]),
      ),
    [availableDestinations],
  );
  const selectedDestinations = useMemo(
    () =>
      selectedQueueIds
        .map(
          (id) =>
            availableById.get(id) ??
            destinationById.get(id) ??
            null,
        )
        .filter(
          (destination): destination is OperationalQueueTransferDestinationOption =>
            destination !== null,
        ),
    [availableById, destinationById, selectedQueueIds],
  );
  const filteredDestinations = useMemo(() => {
    const queryText = search.trim().toLocaleLowerCase();
    if (!queryText) return availableDestinations;

    return availableDestinations.filter((destination) =>
      `${destination.queueName} ${destination.areaName}`
        .toLocaleLowerCase()
        .includes(queryText),
    );
  }, [availableDestinations, search]);
  const currentIds = destinations.map((destination) => destination.queueId).sort();
  const selectedIds = [...selectedQueueIds].sort();
  const hasChanges =
    currentIds.length !== selectedIds.length ||
    currentIds.some((id, index) => id !== selectedIds[index]);

  const toggleDestination = (targetQueueId: string, checked: boolean) => {
    setSelectedQueueIds((current) =>
      checked
        ? current.includes(targetQueueId)
          ? current
          : [...current, targetQueueId]
        : current.filter((id) => id !== targetQueueId),
    );
  };

  const handleSave = async () => {
    if (!query.data || !hasChanges) return;

    try {
      await update.mutateAsync({
        expectedVersion: query.data.version,
        targetQueueIds: selectedQueueIds,
      });
      setHasVersionConflict(false);
      toast({
        title: "Destinos atualizados",
        description: `Os destinos de transferência da fila ${queueName} foram salvos.`,
      });
    } catch (error) {
      if (getApiErrorCode(error) === "STALE_VERSION") {
        setHasVersionConflict(true);
        await query.refetch();
      }
      toast({
        title: "Não foi possível salvar os destinos",
        description: getApiErrorMessage(
          error,
          "A configuração pode ter sido alterada por outra pessoa. Atualize e tente novamente.",
        ),
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Destinos adicionais para transferência</CardTitle>
        <CardDescription>
          Permita que operadores desta fila transfiram atendimentos para outras
          filas sem receber acesso para consultar ou atuar nelas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {query.isLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando destinos de transferência…
          </div>
        ) : query.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não foi possível carregar os destinos</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>Tente atualizar a lista. Nenhuma alteração foi feita.</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {hasVersionConflict ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>A configuração mudou</AlertTitle>
                <AlertDescription>
                  Atualizamos os destinos salvos. Revise a seleção e salve
                  novamente para aplicar suas alterações.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="transfer-destination-search">
                  Filas disponíveis
                </Label>
                <span className="text-xs text-muted-foreground">
                  {availableDestinations.length} disponíveis
                </span>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="transfer-destination-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por fila ou área"
                  className="pl-9"
                  disabled={update.isPending}
                />
              </div>
              {availableDestinations.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Não há outras filas ativas neste workspace para configurar.
                </p>
              ) : filteredDestinations.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Nenhuma fila corresponde à busca.
                </p>
              ) : (
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
                  {filteredDestinations.map((destination) => {
                    const id = `transfer-destination-${destination.queueId}`;
                    return (
                      <Label
                        key={destination.queueId}
                        htmlFor={id}
                        className="flex cursor-pointer items-start gap-3 rounded-md p-3 font-normal hover:bg-muted/60"
                      >
                        <Checkbox
                          id={id}
                          checked={selectedQueueIds.includes(destination.queueId)}
                          onCheckedChange={(checked) =>
                            toggleDestination(destination.queueId, checked === true)
                          }
                          disabled={update.isPending}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {destination.queueName}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {destination.areaName}
                          </span>
                        </span>
                      </Label>
                    );
                  })}
                </div>
              )}
            </div>

            <section aria-labelledby="selected-transfer-destinations" className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="selected-transfer-destinations" className="text-sm font-medium">
                  Destinos configurados
                </h3>
                <Badge variant="secondary">{selectedDestinations.length}</Badge>
              </div>
              {selectedDestinations.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Nenhum destino adicional. Os operadores continuam podendo
                  transferir para as filas às quais já têm acesso.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {selectedDestinations.map((destination) => (
                    <li key={destination.queueId}>
                      <Badge
                        variant="outline"
                        className="flex max-w-full items-center gap-1.5 py-1.5"
                      >
                        <span className="max-w-[14rem] truncate">
                          {destination.queueName} · {destination.areaName}
                        </span>
                        {!destination.active ? (
                          <span className="text-muted-foreground">(inativa)</span>
                        ) : null}
                        <button
                          type="button"
                          className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Remover ${destination.queueName} dos destinos`}
                          onClick={() => toggleDestination(destination.queueId, false)}
                          disabled={update.isPending}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={!hasChanges || update.isPending}
              >
                {update.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Salvar destinos
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function getApiErrorCode(error: unknown): string | undefined {
  if (!(error instanceof AxiosError)) return undefined;
  const message = error.response?.data?.message;
  return typeof message === "string" ? message : undefined;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  if (code === "STALE_VERSION") {
    return "A configuração foi alterada por outra pessoa. Revise os dados atualizados e tente novamente.";
  }
  if (code === "INVALID_DESTINATION") {
    return "Uma das filas selecionadas não está mais ativa. Atualize a lista e tente novamente.";
  }
  return fallback;
}
