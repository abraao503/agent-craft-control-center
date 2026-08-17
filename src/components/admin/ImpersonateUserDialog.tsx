import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/types/user";
import { useAuth } from "@/contexts/auth/hooks";
import { useToast } from "@/hooks/use-toast";

interface ImpersonateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function ImpersonateUserDialog({
  open,
  onOpenChange,
  user,
}: ImpersonateUserDialogProps) {
  const { impersonateUser } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open, user?.id]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Usuário não selecionado");
      return impersonateUser(user.id, reason.trim());
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Não foi possível acessar como este usuário";
      toast({
        title: "Acesso não iniciado",
        description: message,
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  const canSubmit = reason.trim().length >= 10 && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" aria-hidden="true" />
            Acessar como {user.name}
          </DialogTitle>
          <DialogDescription>
            Você terá acesso completo à conta de {user.email} por até 1 hora.
            As ações executadas serão reais e respeitarão as permissões deste usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="impersonation-reason">Motivo do acesso *</Label>
          <Textarea
            id="impersonation-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Descreva o bug ou cenário que será investigado"
            maxLength={500}
            disabled={mutation.isPending}
          />
          <p key={reason.length} className="text-xs text-muted-foreground">
            Informe pelo menos 10 caracteres. {reason.length}/500
          </p>
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
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            {mutation.isPending ? "Acessando..." : "Acessar como usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
