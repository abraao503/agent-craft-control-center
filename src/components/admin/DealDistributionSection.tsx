import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, UsersRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { listDealDistribution, setDealDistributionMember } from "@/services/workspace/dealDistribution";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function DealDistributionSection({ workspaceId }: { workspaceId: string }) {
  const { has, role } = usePermissions();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const enabled =
    has("manage:deal-distribution") ||
    role === "PLATFORM_ADMIN" ||
    role === "COMPANY_OWNER" ||
    role === "COMPANY_ADMIN" ||
    role === "WORKSPACE_OWNER" ||
    role === "WORKSPACE_ADMIN" ||
    role === "WORKSPACE_MANAGER";
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

  const activeMembers =
    query.data?.items.filter((member) => member.enabled).length ?? 0;

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="gap-3 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UsersRound className="h-5 w-5 text-primary" />
              Distribuição automática
            </CardTitle>
            <CardDescription className="mt-2 max-w-2xl">
              Escolha quem pode receber novos negócios sem responsável. As
              atribuições são alternadas entre as pessoas ativadas.
            </CardDescription>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {activeMembers === 1
              ? t("administration.activeMemberOne")
              : t("administration.activeMemberMany", { count: activeMembers })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0 md:p-6 md:pt-0">
        <Input
          placeholder={t("administration.searchPerson")}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {query.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : query.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
            <p>{t("administration.distributionLoadError")}</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-2 inline-flex items-center gap-1 font-medium underline underline-offset-4"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="divide-y overflow-hidden rounded-lg border">
            {query.data?.items.map((member) => (
              <label
                key={member.userId}
                className="flex cursor-pointer items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/40"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{member.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {member.email}
                  </span>
                </span>
                <Switch
                  checked={member.enabled}
                  disabled={mutation.isPending}
                  onCheckedChange={(memberEnabled) => mutation.mutate({ userId: member.userId, memberEnabled })}
                  aria-label={`Incluir ${member.name} na distribuição automática`}
                />
              </label>
            ))}
            {query.data?.items.length === 0 && (
              <div className="p-8 text-center">
                <p className="font-medium">{t("administration.noAvailablePeople")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("administration.addPersonToDistribution")}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
