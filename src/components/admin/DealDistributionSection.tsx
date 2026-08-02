import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { listDealDistribution, setDealDistributionMember } from "@/services/workspace/dealDistribution";
import { useState } from "react";

export function DealDistributionSection({ workspaceId }: { workspaceId: string }) {
  const { has } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const enabled = has("manage:deal-distribution");
  const query = useQuery({
    queryKey: ["deal-distribution", workspaceId, search],
    queryFn: () => listDealDistribution({ workspaceId, search: search || undefined }),
    enabled: enabled && Boolean(workspaceId),
  });
  const mutation = useMutation({
    mutationFn: ({ userId, memberEnabled }: { userId: string; memberEnabled: boolean }) =>
      setDealDistributionMember({ workspaceId, userId, enabled: memberEnabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deal-distribution", workspaceId] }),
    onError: () => toast({ title: "Não foi possível atualizar a distribuição", variant: "destructive" }),
  });

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><RotateCw className="h-5 w-5" />Distribuição round-robin</CardTitle>
        <CardDescription>Habilite usuários ativos que devem receber novos deals inbound sem responsável.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Buscar usuário" value={search} onChange={(event) => setSearch(event.target.value)} />
        {query.isLoading ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        ) : (
          <div className="divide-y rounded-md border">
            {query.data?.items.map((member) => (
              <label key={member.userId} className="flex items-center justify-between gap-3 p-3">
                <span className="min-w-0"><span className="block truncate font-medium">{member.name}</span><span className="block truncate text-xs text-muted-foreground">{member.email}</span></span>
                <Switch
                  checked={member.enabled}
                  disabled={mutation.isPending}
                  onCheckedChange={(memberEnabled) => mutation.mutate({ userId: member.userId, memberEnabled })}
                  aria-label={`Participação de ${member.name}`}
                />
              </label>
            ))}
            {query.data?.items.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Nenhum usuário encontrado</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
