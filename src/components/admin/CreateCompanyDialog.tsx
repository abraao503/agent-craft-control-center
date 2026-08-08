import { useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCompany } from "@/services/company/createCompany";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCompanyDialog({
  open,
  onOpenChange,
}: CreateCompanyDialogProps) {
  const [formData, setFormData] = useState({
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    companyName: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: createCompany,
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: `Empresa "${formData.companyName}" criada com sucesso!`,
      });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setFormData({
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
        companyName: "",
      });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const response = error instanceof AxiosError ? error.response?.data : null;
      const message =
        response &&
        typeof response === "object" &&
        "message" in response &&
        typeof response.message === "string"
          ? response.message
          : "Erro ao criar empresa";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.ownerName ||
      !formData.ownerEmail ||
      !formData.ownerPassword ||
      !formData.companyName
    ) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (formData.ownerPassword.length < 6) {
      toast({
        title: "Erro",
        description: "Senha deve ter no mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (formData.companyName.length < 3) {
      toast({
        title: "Erro",
        description: "Nome da empresa deve ter no mínimo 3 caracteres",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Empresa</DialogTitle>
          <DialogDescription>
            Preencha os dados da empresa e do dono
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nome da Empresa *</Label>
            <Input
              id="companyName"
              placeholder="Ex: Tech Solutions"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerName">Nome do Dono *</Label>
            <Input
              id="ownerName"
              placeholder="Ex: João Silva"
              value={formData.ownerName}
              onChange={(e) =>
                setFormData({ ...formData, ownerName: e.target.value })
              }
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerEmail">Email do Dono *</Label>
            <Input
              id="ownerEmail"
              type="email"
              placeholder="Ex: joao@example.com"
              value={formData.ownerEmail}
              onChange={(e) =>
                setFormData({ ...formData, ownerEmail: e.target.value })
              }
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerPassword">Senha do Dono *</Label>
            <Input
              id="ownerPassword"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.ownerPassword}
              onChange={(e) =>
                setFormData({ ...formData, ownerPassword: e.target.value })
              }
              disabled={mutation.isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Criando..." : "Criar Empresa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
