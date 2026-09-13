import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { updateCustomerName } from "@/services/customer/updateCustomerName";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OperationalContactNameFieldProps {
  customerId?: string;
  name?: string | null;
  canEdit?: boolean;
  onUpdated?: () => void | Promise<unknown>;
}

export function OperationalContactNameField({
  customerId,
  name,
  canEdit = false,
  onUpdated,
}: OperationalContactNameFieldProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(name ?? "");
    setEditing(false);
    setError(null);
  }, [customerId, name]);

  const updateMutation = useMutation({
    mutationFn: async (updatedName: string) => {
      if (!customerId) {
        throw new Error("Cliente não informado");
      }

      await updateCustomerName({ customerId, name: updatedName });
    },
    onSuccess: (_, updatedName) => {
      setValue(updatedName);
      setEditing(false);
      setError(null);
      toast({ title: "Nome atualizado com sucesso" });
      void onUpdated?.();
    },
    onError: () => {
      setValue(name ?? "");
      toast({
        title: "Erro ao atualizar nome",
        description: "Não foi possível atualizar o nome. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const updatedName = value.trim();

    if (!updatedName) {
      setError("Informe um nome.");
      return;
    }

    if (updatedName === (name ?? "").trim()) {
      setEditing(false);
      setError(null);
      return;
    }

    updateMutation.mutate(updatedName);
  };

  return (
    <div className="min-w-0 grid gap-0.5 py-2.5 first:pt-1 last:pb-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Nome
      </p>
      {editing ? (
        <div className="mt-1 space-y-1">
          <div className="flex items-center gap-1">
            <Input
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError(null);
              }}
              className="h-8 min-w-0 flex-1 text-sm"
              autoFocus
              aria-label="Nome do contato"
              aria-invalid={Boolean(error)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSave();
                if (event.key === "Escape") {
                  setValue(name ?? "");
                  setError(null);
                  setEditing(false);
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              aria-label="Salvar nome"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3 text-green-600" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={() => {
                setValue(name ?? "");
                setError(null);
                setEditing(false);
              }}
              disabled={updateMutation.isPending}
              aria-label="Cancelar edição do nome"
            >
              <X className="h-3 w-3 text-destructive" />
            </Button>
          </div>
          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="break-words text-sm font-medium [overflow-wrap:anywhere]">
            {name?.trim() || (
              <span className="text-muted-foreground">Contato sem nome</span>
            )}
          </p>
          {canEdit && customerId ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
              onClick={() => setEditing(true)}
              aria-label="Editar nome"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
