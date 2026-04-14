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
import { PhoneInput } from "@/components/ui/phone-input";
import { createDeal } from "@/services/deal/createDeal";
import { CreateDealInput } from "@/types/deal";
import { PipelineStageMinimal } from "@/types/pipeline";
import { isValidPhone, normalizePhone } from "@/utils/phone";

interface ValidationError {
  field: string;
  message: string;
}

interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: ValidationError[];
}

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
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [currency, setCurrency] = useState<string>("BRL");
  const [expectedCloseDate, setExpectedCloseDate] = useState<Date | undefined>(
    undefined,
  );
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!pipelineId) return "Pipeline é obrigatório";
    if (!currentStageId) return "Selecione a etapa";
    if (!customerPhone.trim()) return "Telefone do cliente é obrigatório";
    if (!isValidPhone(customerPhone)) return "Formato de telefone inválido";
    if (!title.trim()) return "Título é obrigatório";
    const n = value ? Number(value) : undefined;
    if (n !== undefined && (isNaN(n) || n < 0))
      return "Valor deve ser um número maior ou igual a 0";
    if (currency && currency.length !== 3) return "Moeda deve ter 3 letras";
    if (customerEmail && !customerEmail.includes("@")) return "Email inválido";
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
      assignedUserId: assignedUserId || undefined,
      title: title.trim(),
      description: description?.trim() || undefined,
      value: value ? Number(value) : undefined,
      currency: currency || "BRL",
      expectedCloseDate: expectedCloseDate?.toISOString(),
      customerName: customerName.trim(),
      customerPhone: normalizePhone(customerPhone),
      customerEmail: customerEmail.trim() || undefined,
    };

    try {
      setSubmitting(true);
      await createDeal(payload);
      onCreated?.();
      onOpenChange(false);
      // reset
      setCurrentStageId("");
      setAssignedUserId("");
      setTitle("");
      setDescription("");
      setValue("");
      setCurrency("BRL");
      setExpectedCloseDate(undefined);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
    } catch (e: unknown) {
      // Handle API errors with Portuguese messages
      const error = e as { response?: { data?: ApiErrorResponse } };
      if (error?.response?.data) {
        const errorData = error.response.data;

        // Handle validation errors
        if (errorData.statusCode === 400 && errorData.errors) {
          const errorMessages = errorData.errors.map((err: ValidationError) => {
            const fieldMessages: Record<string, string> = {
              "Invalid workspace ID format":
                "Formato de ID do workspace inválido",
              "Invalid pipeline ID format":
                "Formato de ID do pipeline inválido",
              "Invalid stage ID format": "Formato de ID da etapa inválido",
              "Invalid user ID format": "Formato de ID do usuário inválido",
              "Deal title is required": "Título do negócio é obrigatório",
              "Value must be non-negative":
                "Valor deve ser maior ou igual a zero",
              "Currency must be 3 characters": "Moeda deve ter 3 caracteres",
              "Invalid date format": "Formato de data inválido",
              "Phone must be in format XX9NNNNNNNN (11 digits)":
                "Formato de telefone inválido. Use o formato internacional (ex: +5511999887766) ou nacional (ex: 11999887766).",
              "Invalid phone number": "Número de telefone inválido.",
              "Invalid phone number format":
                "Formato de telefone inválido. Use o formato internacional (ex: +5511999887766) ou nacional (ex: 11999887766).",
              "Invalid email format": "Formato de email inválido",
            };
            return fieldMessages[err.message] || err.message;
          });
          setError(errorMessages.join(", "));
        } else if (errorData.statusCode === 404) {
          const notFoundMessages: Record<string, string> = {
            "Pipeline not found": "Pipeline não encontrado",
            "Stage not found in pipeline": "Etapa não encontrada no pipeline",
          };
          setError(
            notFoundMessages[errorData.message] || "Recurso não encontrado",
          );
        } else if (errorData.statusCode === 409) {
          setError("Já existe um negócio para este cliente neste pipeline");
        } else if (errorData.statusCode === 500) {
          setError("Erro ao criar negócio. Tente novamente.");
        } else {
          setError(
            errorData.message || "Erro ao criar negócio. Tente novamente.",
          );
        }
      } else {
        setError("Erro ao criar negócio. Tente novamente.");
      }
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
          <DialogDescription>
            Preencha os dados do negócio e selecione a etapa inicial.
          </DialogDescription>
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
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome do Cliente</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Telefone do Cliente</Label>
              <PhoneInput
                defaultCountry="BR"
                value={customerPhone}
                onChange={(value) => setCustomerPhone(value || "")}
                placeholder="Número de telefone"
              />
            </div>
            <div className="space-y-2">
              <Label>Email do Cliente (Opcional)</Label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="cliente@exemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do negócio"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                disabled={true}
              />
            </div>
            <div className="space-y-2">
              <Label>Previsão de Fechamento</Label>
              <DateTimePicker
                date={expectedCloseDate}
                setDate={setExpectedCloseDate}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Criando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDealModal;
