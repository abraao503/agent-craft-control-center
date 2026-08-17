import { useState, useEffect } from "react";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCompany } from "@/services/company/updateCompany";
import { useToast } from "@/hooks/use-toast";
import { Company, UpdateCompanyRequest } from "@/types/company";
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

interface EditCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
}

export function EditCompanyDialog({
  open,
  onOpenChange,
  company,
}: EditCompanyDialogProps) {
  const [formData, setFormData] = useState({
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    companyName: "",
  });

  useEffect(() => {
    if (company) {
      setFormData({
        ownerName: company.ownerName,
        ownerEmail: company.ownerEmail,
        ownerPassword: "",
        companyName: company.name,
      });
    }
  }, [company, open]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: UpdateCompanyRequest) =>
      updateCompany(company!.id, data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
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
          : "Erro ao atualizar empresa";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName || !formData.ownerName || !formData.ownerEmail) {
      toast({
        title: "Erro",
        description: "Nome da empresa, dono e email são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (formData.ownerPassword && formData.ownerPassword.length < 6) {
      toast({
        title: "Erro",
        description: "Senha deve ter no mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    const updateData: UpdateCompanyRequest = {
      companyName: formData.companyName,
      ownerName: formData.ownerName,
      ownerEmail: formData.ownerEmail,
    };

    if (formData.ownerPassword) {
      updateData.ownerPassword = formData.ownerPassword;
    }

    mutation.mutate(updateData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription>
            Atualize os dados da empresa e do dono
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
            <Label htmlFor="ownerPassword">Nova Senha (deixe em branco para manter)</Label>
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
              {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
