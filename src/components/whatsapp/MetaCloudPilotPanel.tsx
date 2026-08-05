import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth/hooks";
import { usePermissions } from "@/hooks/usePermissions";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { listPipelines } from "@/services/pipeline/listPipelines";
import { listPipelineStages } from "@/services/pipeline/listPipelineStages";
import { linkMetaCloudPhoneNumber } from "@/services/whatsapp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getMetaCloudDiagnostic,
  listMetaCloudPhoneNumbers,
  syncMetaCloudPhoneNumbers,
  listMetaCloudTemplates,
  syncMetaCloudTemplates,
} from "@/services/whatsapp";

export function MetaCloudPilotPanel() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const { has } = usePermissions();
  const canManageIntegrations = has("manage:integrations");
  const canLinkIntegration = canManageIntegrations || has("connect:whatsapp");
  const { workspaceId } = useWorkspaceManager({ trackLoadingState: false });
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [pipelineId, setPipelineId] = useState("");
  const [stageId, setStageId] = useState("");
  const queryClient = useQueryClient();
  const diagnosticQuery = useQuery({
    queryKey: ["meta-cloud-diagnostic"],
    queryFn: getMetaCloudDiagnostic,
    enabled: userProfile?.metaCloudWhatsappEnabled === true,
    retry: false,
  });
  const phoneNumbersQuery = useQuery({
    queryKey: ["meta-cloud-phone-numbers"],
    queryFn: listMetaCloudPhoneNumbers,
    enabled: diagnosticQuery.data?.enabled === true,
  });
  const pipelinesQuery = useQuery({
    queryKey: ["meta-cloud-pipelines", workspaceId],
    queryFn: () => listPipelines(workspaceId!),
    enabled: diagnosticQuery.data?.enabled === true && !!workspaceId,
  });
  const templatesQuery = useQuery({
    queryKey: ["meta-cloud-templates"],
    queryFn: () => listMetaCloudTemplates("APPROVED"),
    enabled: diagnosticQuery.data?.enabled === true,
  });
  const stagesQuery = useQuery({
    queryKey: ["meta-cloud-pipeline-stages", pipelineId, workspaceId],
    queryFn: () => listPipelineStages(pipelineId, workspaceId!),
    enabled:
      diagnosticQuery.data?.enabled === true && !!pipelineId && !!workspaceId,
  });
  const syncMutation = useMutation({
    mutationFn: syncMetaCloudPhoneNumbers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meta-cloud-phone-numbers"] });
      toast({ title: "Números sincronizados" });
    },
    onError: () =>
      toast({
        title: "Não foi possível sincronizar os números",
        variant: "destructive",
      }),
  });
  const templateMutation = useMutation({
    mutationFn: syncMetaCloudTemplates,
    onSuccess: () => toast({ title: "Templates sincronizados" }),
    onError: () =>
      toast({
        title: "Não foi possível sincronizar os templates",
        variant: "destructive",
      }),
  });
  const linkMutation = useMutation({
    mutationFn: linkMetaCloudPhoneNumber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meta-cloud-diagnostic"] });
      toast({ title: "Número vinculado ao pipeline" });
    },
    onError: () =>
      toast({
        title: "Não foi possível vincular o número",
        variant: "destructive",
      }),
  });

  useEffect(() => {
    if (!phoneNumberId && phoneNumbersQuery.data?.[0]) {
      setPhoneNumberId(phoneNumbersQuery.data[0].phoneNumberId);
    }
  }, [phoneNumbersQuery.data, phoneNumberId]);

  useEffect(() => {
    if (!pipelineId && pipelinesQuery.data?.[0]) {
      setPipelineId(pipelinesQuery.data[0].id);
    }
  }, [pipelinesQuery.data, pipelineId]);

  useEffect(() => {
    if (!stageId && stagesQuery.data?.[0]) {
      setStageId(stagesQuery.data[0].id);
    }
  }, [stagesQuery.data, stageId]);

  if (!diagnosticQuery.data?.enabled) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          WhatsApp Cloud API oficial
        </CardTitle>
        <div className="flex gap-2">
          {canManageIntegrations && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => templateMutation.mutate()}
                disabled={templateMutation.isPending}
              >
                Sincronizar templates
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar números
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Números provisionados pela plataforma. Tokens e credenciais não são
          exibidos.
        </p>
        {phoneNumbersQuery.data?.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {phoneNumbersQuery.data.map((phone) => (
              <div
                key={phone.phoneNumberId}
                className="rounded-md border p-3 text-sm"
              >
                <div className="font-medium">{phone.displayPhoneNumber}</div>
                <div className="text-muted-foreground">
                  {phone.verifiedName || "Nome não verificado"}
                  {phone.qualityRating
                    ? ` · qualidade ${phone.qualityRating}`
                    : ""}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {phone.status || "status desconhecido"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum número sincronizado ainda.
          </p>
        )}
        {templatesQuery.data?.length ? (
          <div className="mt-4 rounded-md border p-3 text-sm">
            <div className="font-medium">Templates aprovados</div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {templatesQuery.data.map((template) => (
                <div
                  key={`${template.name}:${template.language}`}
                  className="rounded border p-2"
                >
                  <div>{template.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {template.language} · {template.category || "sem categoria"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {canLinkIntegration && (
          <div className="mt-5 grid gap-3 rounded-md border p-3 md:grid-cols-4">
            <Select value={phoneNumberId} onValueChange={setPhoneNumberId}>
              <SelectTrigger>
                <SelectValue placeholder="Número provisionado" />
              </SelectTrigger>
              <SelectContent>
                {(phoneNumbersQuery.data ?? []).map((phone) => (
                  <SelectItem
                    key={phone.phoneNumberId}
                    value={phone.phoneNumberId}
                  >
                    {phone.displayPhoneNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={pipelineId}
              onValueChange={(value) => {
                setPipelineId(value);
                setStageId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pipeline" />
              </SelectTrigger>
              <SelectContent>
                {(pipelinesQuery.data ?? []).map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger>
                <SelectValue placeholder="Etapa inicial" />
              </SelectTrigger>
              <SelectContent>
                {(stagesQuery.data ?? []).map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() =>
                linkMutation.mutate({
                  phoneNumberId,
                  pipelineId,
                  initialPipelineStageId: stageId,
                })
              }
              disabled={
                !phoneNumberId ||
                !pipelineId ||
                !stageId ||
                linkMutation.isPending
              }
            >
              Vincular número
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
