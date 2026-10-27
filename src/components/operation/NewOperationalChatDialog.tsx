import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOperationalAttendanceOptions } from "@/hooks/useOperationalAttendances";
import { useOperationalAttendanceMutations } from "@/hooks/useOperationalAttendanceMutations";
import { searchOperationalCustomers } from "@/services/operation/searchOperationalCustomers";
import { extractOperationalErrorCode } from "@/utils/operationalAttendanceErrors";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
};

export function NewOperationalChatDialog({ open, onOpenChange, workspaceId }: Props) {
  const optionsQuery = useOperationalAttendanceOptions(workspaceId, open);
  const mutations = useOperationalAttendanceMutations(workspaceId);
  const navigate = useNavigate();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [channelId, setChannelId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [queueId, setQueueId] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  const customersQuery = useQuery({
    queryKey: ["operation", "new-chat-customers", workspaceId, search],
    queryFn: () => searchOperationalCustomers({ workspaceId: workspaceId!, search, limit: 8 }),
    enabled: open && mode === "existing" && Boolean(workspaceId) && search.trim().length >= 2,
  });

  const options = optionsQuery.data;
  const selectedArea = useMemo(
    () => options?.areas.find((area) => area.id === areaId),
    [areaId, options?.areas],
  );

  useEffect(() => {
    if (!open) return;
    setMode("existing");
    setSearch("");
    setCustomerId("");
    setCustomerName("");
    setCustomerPhone("");
    setChannelId("");
    setAreaId("");
    setQueueId("");
    setAssigneeUserId("");
    setIdempotencyKey(crypto.randomUUID());
  }, [open]);

  useEffect(() => {
    if (!options) return;
    if (!channelId && options.channels.length === 1) setChannelId(options.channels[0].id);
    if (!areaId && options.areas.length === 1) setAreaId(options.areas[0].id);
    if (!assigneeUserId && options.users.length === 1) setAssigneeUserId(options.users[0].id);
  }, [areaId, assigneeUserId, channelId, options]);

  useEffect(() => {
    if (!selectedArea) {
      setQueueId("");
      return;
    }
    if (!selectedArea.queues.some((queue) => queue.id === queueId)) {
      setQueueId(selectedArea.queues.length === 1 ? selectedArea.queues[0].id : "");
    }
  }, [queueId, selectedArea]);

  const submit = async () => {
    if (!workspaceId || !options) return;
    if (!channelId || !areaId || !queueId || !assigneeUserId) {
      if (!options.capabilities.canAssign && options.users.length !== 1) {
        toast.error("Não há um responsável elegível para sua função neste destino.");
        return;
      }
      toast.error("Selecione canal, área, fila e responsável.");
      return;
    }
    if (mode === "existing" && !customerId) {
      toast.error("Selecione um cliente ou escolha cadastrar um novo.");
      return;
    }
    if (mode === "new" && (!customerName.trim() || !customerPhone.trim())) {
      toast.error("Informe nome e telefone do novo cliente.");
      return;
    }

    try {
      const result = await mutations.createManual.mutateAsync({
        workspaceId,
        ...(mode === "existing" ? { customerId } : { customerName: customerName.trim(), customerPhone: customerPhone.trim() }),
        channelId,
        targetAreaId: areaId,
        targetQueueId: queueId,
        assigneeUserId,
        idempotencyKey,
      });
      onOpenChange(false);
      navigate(`/operation/attendances/${result.attendance.id}`);
    } catch (error) {
      const errorCode = extractOperationalErrorCode(error);
      if (errorCode === "ACTIVE_ATTENDANCE_CONFLICT") {
        toast.error("Este cliente já possui um atendimento ativo. Atualize a lista e abra o atendimento existente.");
        return;
      }
      toast.error("Não foi possível iniciar o atendimento. Verifique os dados e tente novamente.");
    }
  };

  const isLoading = optionsQuery.isLoading || mutations.createManual.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Novo chat</DialogTitle>
          <DialogDescription>Escolha o contato e o destino. A conversa será aberta no editor atual.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button type="button" size="sm" variant={mode === "existing" ? "secondary" : "outline"} onClick={() => setMode("existing")}>
              Cliente existente
            </Button>
            <Button type="button" size="sm" variant={mode === "new" ? "secondary" : "outline"} onClick={() => { setMode("new"); setCustomerId(""); }}>
              Novo cliente
            </Button>
          </div>

          {mode === "existing" ? (
            <div className="space-y-2">
              <Label htmlFor="new-chat-customer-search">Buscar por nome ou telefone</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="new-chat-customer-search" value={search} onChange={(event) => { setSearch(event.target.value); setCustomerId(""); }} className="pl-9" placeholder="Digite pelo menos 2 caracteres" />
              </div>
              {customerId ? <p className="text-sm text-muted-foreground">Cliente selecionado.</p> : null}
              {customersQuery.isFetching ? <p className="text-sm text-muted-foreground">Buscando...</p> : null}
              {customersQuery.data?.items.length ? (
                <div className="max-h-40 overflow-y-auto rounded-md border">
                  {customersQuery.data.items.map((customer) => (
                    <button key={customer.id} type="button" className="flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-muted" onClick={() => { setCustomerId(customer.id); setSearch(customer.name || customer.phone); }}>
                      <span className="font-medium">{customer.name || "Sem nome"}</span>
                      <span className="text-muted-foreground">{customer.phone}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="new-chat-customer-name">Nome</Label><Input id="new-chat-customer-name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="new-chat-customer-phone">Telefone</Label><Input id="new-chat-customer-phone" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="+55 11 99999-9999" /></div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldSelect label="Canal" value={channelId} onValueChange={setChannelId} disabled={isLoading}>
              {options?.channels.map((channel) => <SelectItem key={channel.id} value={channel.id}>{channel.displayName}</SelectItem>)}
            </FieldSelect>
            <FieldSelect label="Área" value={areaId} onValueChange={setAreaId} disabled={isLoading}>
              {options?.areas.map((area) => <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>)}
            </FieldSelect>
            <FieldSelect label="Fila" value={queueId} onValueChange={setQueueId} disabled={isLoading || !selectedArea}>
              {selectedArea?.queues.map((queue) => <SelectItem key={queue.id} value={queue.id}>{queue.name}</SelectItem>)}
            </FieldSelect>
            <FieldSelect label="Responsável" value={assigneeUserId} onValueChange={setAssigneeUserId} disabled={isLoading || !options?.capabilities.canAssign}>
              {options?.users.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
            </FieldSelect>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={() => void submit()} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Iniciar chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldSelect({ label, value, onValueChange, disabled, children }: { label: string; value: string; onValueChange: (value: string) => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger><SelectValue placeholder={`Selecione ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}
