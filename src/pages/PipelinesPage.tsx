import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceManager } from "@/hooks/useWorkspaceManager";
import { listPipelines } from "@/services/pipeline/listPipelines";
import { CreatePipelineModal } from "@/components/pipelines/CreatePipelineModal";
import { useTranslation } from "react-i18next";

const PipelinesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { workspaceId, isChangingWorkspace } = useWorkspaceManager({
    queryKeys: ["listPipelines"],
    autoRefetch: true,
    trackLoadingState: true,
  });

  const [openCreate, setOpenCreate] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["listPipelines", workspaceId],
    queryFn: () => listPipelines(workspaceId!),
    enabled: !!workspaceId,
  });

  if (error) {
    toast({ title: t("common.error"), description: t("pipelines.loadError"), variant: "destructive" });
  }

  const handleCreated = (pipelineId: string) => {
    navigate(`/pipelines/${pipelineId}`);
  };

  const loading = isLoading || isChangingWorkspace;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("pipelines.title")}</h1>
          <p className="text-muted-foreground">{t("pipelines.description")}</p>
        </div>
        <Button onClick={() => setOpenCreate(true)}>{t("pipelines.create")}</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="border rounded-lg py-12 text-center text-muted-foreground">
          {t("pipelines.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((p) => (
            <Card key={p.id} className="cursor-pointer hover:shadow" onClick={() => navigate(`/pipelines/${p.id}`)}>
              <CardHeader>
                <CardTitle className="text-lg">{p.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {p.description || t("pipelines.noDescription")}
                </div>
                <div className="text-xs mt-2">
                  {t("pipelines.stages", { count: p.stagesCount })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {workspaceId && (
        <CreatePipelineModal
          open={openCreate}
          onOpenChange={setOpenCreate}
          workspaceId={workspaceId}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
};

export default PipelinesPage;
