import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspaceContext } from "@/contexts/workspace/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Plus, Webhook, Copy, Trash2, Edit } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartPagination } from "@/components/common/SmartPagination";
import { listDealWebhooks, deleteDealWebhook } from "@/services/deal-webhook";
import { DealWebhook } from "@/types/deal-webhook";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 9; // 3x3 grid

export default function DealWebhooksPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceContext();
  const { t } = useTranslation();
  const workspaceId = currentWorkspace?.id || "";

  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<DealWebhook | null>(
    null,
  );

  const {
    data: webhooksData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["deal-webhooks", workspaceId, currentPage],
    queryFn: () =>
      listDealWebhooks({
        workspaceId,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      }),
    enabled: !!workspaceId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDealWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["deal-webhooks", workspaceId],
      });
      setIsDeleteDialogOpen(false);
      setSelectedWebhook(null);
      toast({
        title: t("webhooks.deleteSuccess"),
        description: t("webhooks.deleteSuccessDescription"),
      });
    },
    onError: (error) => {
      toast({
        title: t("webhooks.deleteError"),
        description: t("webhooks.deleteErrorDescription"),
        variant: "destructive",
      });
      console.error("Error deleting webhook:", error);
    },
  });

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: t("webhooks.copyUrl"),
      description: t("webhooks.copyUrlDescription"),
    });
  };

  const handleDeleteClick = (webhook: DealWebhook) => {
    setSelectedWebhook(webhook);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedWebhook) {
      deleteMutation.mutate(selectedWebhook.id);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          {t("webhooks.selectWorkspace")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("webhooks.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("webhooks.description")}
          </p>
        </div>
        <Button onClick={() => navigate("/webhooks/create")}>
          <Plus className="mr-2 h-4 w-4" /> Novo Webhook
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(ITEMS_PER_PAGE)].map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full ml-2" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-end gap-2 pt-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-red-800">
            {t("webhooks.loadError")}
          </p>
        </div>
      ) : webhooksData && webhooksData.items.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {webhooksData.items.map((webhook) => (
              <Card
                key={webhook.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/webhooks/${webhook.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Webhook className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{webhook.name}</CardTitle>
                    </div>
                    <Badge
                      variant={
                        webhook.status === "ACTIVE" ? "default" : "secondary"
                      }
                      className={
                        webhook.status === "ACTIVE"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                      }
                    >
                      {webhook.status === "ACTIVE" ? t("webhooks.active") : t("webhooks.inactive")}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm mt-2">
                    {webhook.automation?.sendWelcomeMessage
                      ? t("webhooks.welcomeMessage")
                      : t("webhooks.noAutomation")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                      {webhook.webhookUrl}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyUrl(webhook.webhookUrl);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-4 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/webhooks/${webhook.id}/edit`);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" /> {t("webhooks.edit")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(webhook);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> {t("webhooks.delete")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {webhooksData.totalPages > 1 && (
            <SmartPagination
              currentPage={currentPage}
              totalPages={webhooksData.totalPages}
              onPageChange={handlePageChange}
              showItemCount
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={webhooksData.total}
              itemLabel={t("webhooks.webhooks")}
            />
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("webhooks.emptyTitle")}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {t("webhooks.emptyDescription")}
            </p>
            <Button onClick={() => navigate("/webhooks/create")}>
              <Plus className="mr-2 h-4 w-4" /> {t("webhooks.createFirst")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("webhooks.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("webhooks.confirmDeleteDescription", { name: selectedWebhook?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("webhooks.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
