import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { createDeal } from "@/services/deal/createDeal";
import { CreateDealInput } from "@/types/deal";
import { PipelineStageMinimal } from "@/types/pipeline";
import { useQuery } from "@tanstack/react-query";
import { listCustomers } from "@/services/customer";

interface CreateDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  pipelineId: string;
  stages: PipelineStageMinimal[];
  onCreated?: () => void;
}

export const CreateDealModal: React.FC<CreateDealModalProps> = ({
  open,
  onOpenChange,
  workspaceId,
  pipelineId,
  stages,
  onCreated,
}) => {
  const [currentStageId, setCurrentStageId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [currency, setCurrency] = useState<string>("BRL");
  const [expectedCloseDate, setExpectedCloseDate] = useState<Date | undefined>(
    undefined
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: customersData } = useQuery({
    queryKey: ["listCustomersForDeal", workspaceId, open],
    queryFn: () =>
      listCustomers({ page: 1, limit: 50, orderBy: "createdAt", order: "desc" }, workspaceId),
    enabled: open && !!workspaceId,
  });

  const customers = customersData?.items || [];

  const validate = (): string | null => {
    if (!pipelineId) return "Pipeline is required";
    if (!currentStageId) return "Stage is required";
    if (!customerId) return "Customer is required";
    if (!title.trim()) return "Title is required";
    const n = value ? Number(value) : undefined;
    if (n !== undefined && (isNaN(n) || n < 0)) return "Value must be a number greater or equal to 0";
    if (currency && currency.length !== 3) return "Currency must have 3 letters";
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    const payload: CreateDealInput = {
      workspaceId,
      pipelineId,
      currentStageId,
      customerId,
      assignedUserId: assignedUserId || undefined,
      title: title.trim(),
      description: description?.trim() || undefined,
      value: value ? Number(value) : undefined,
      currency: currency || "BRL",
      expectedCloseDate: expectedCloseDate?.toISOString(),
    };

    try {
      setSubmitting(true);
      await createDeal(payload);
      onCreated?.();
      onOpenChange(false);
      // reset
      setCurrentStageId("");
      setCustomerId("");
      setAssignedUserId("");
      setTitle("");
      setDescription("");
      setValue("");
      setCurrency("BRL");
      setExpectedCloseDate(undefined);
    } catch (e) {
      setError("Failed to create deal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stageOptions = useMemo(() => stages, [stages]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Negócio</DialogTitle>
          <DialogDescription>Preencha os dados do negócio e selecione a etapa inicial.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select value={currentStageId} onValueChange={setCurrentStageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {stageOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.identifier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do negócio" />
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Previsão de Fechamento</Label>
              <DateTimePicker date={expectedCloseDate} setDate={setExpectedCloseDate} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Responsável (opcional)</Label>
            <Input value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)} placeholder="UUID do usuário" />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Criando..." : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDealModal;
